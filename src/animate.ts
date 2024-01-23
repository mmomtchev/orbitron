import { Magick, MagickCore } from 'magickwand.js';
import ffmpeg from '@mmomtchev/ffmpeg';
import { Muxer, VideoEncoder, VideoTransform } from '@mmomtchev/ffmpeg/stream';

import * as Horizons from './horizons';
import { Proj, ProjFn, getProjectionFunction } from './projection';
import major from './major-bodies';

ffmpeg.setLogLevel(ffmpeg.AV_LOG_VERBOSE);

interface Options {
  width: number;
  height: number;
  file: string;
  fps: number;
  start: Date;
  stop: Date;
  step: string;
  br: number;
  origin: string;
  proj: Proj;
  bodies: string[];
  legend: boolean;
};

interface Settings {
  opts: Options;
  pointSize: number;
  lineSize: number;
  bodySize: number;
  drawStrokeTransparent: Magick.DrawableBase;
  drawFillTransparent: Magick.DrawableBase;
  drawWhite: Magick.DrawableBase;
  drawPointSize: Magick.DrawableBase;
  drawFont: Magick.DrawableBase;
};

interface Body {
  id: string;
  name: string;
  color: string;
  fill: Magick.DrawableBase;
  stroke: Magick.DrawableBase;
  trajectory: Horizons.EphemItem[];
};

async function draw(coordsToPixels: ProjFn,
  background: Magick.Image,
  conf: Settings,
  bodies: Body[],
  idx: number) {

  const date = bodies[0].trajectory[idx].date;

  const image = new Magick.Image(background);
  const drawList: Magick.DrawableBase[] = [];
  for (const body of bodies) {
    const position = body.trajectory[idx];
    const [origin, shadow] = coordsToPixels(position.data.X, position.data.Y, position.data.Z);
    const perim = [origin[0] + conf.bodySize, origin[1] + conf.bodySize] as [number, number];

    drawList.push(...[
      body.fill,
      conf.drawStrokeTransparent,
      new Magick.DrawableCircle(...origin, ...perim)
    ]);
    if (shadow) {
      drawList.push(...[
        conf.drawFillTransparent,
        body.stroke,
        new Magick.DrawableLine(...origin, ...shadow)
      ]);
    }
    await background.pixelColorAsync(...origin, body.color);
  }

  drawList.push(...[
    conf.drawFont,
    conf.drawPointSize,
    conf.drawStrokeTransparent,
    conf.drawWhite,
    new Magick.DrawableText(conf.lineSize, conf.opts.height - conf.lineSize,
      `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`)
  ]);
  await image.drawAsync(drawList);
  return image;
}

async function legend(image: Magick.Image, conf: Settings, bodies: Body[]) {
  const drawList: Magick.DrawableBase[] = [];

  let height = conf.lineSize;
  for (const body of bodies) {
    drawList.push(...[
      conf.drawFont,
      conf.drawPointSize,
      conf.drawStrokeTransparent,
      body.fill,
      new Magick.DrawableText(conf.opts.width - conf.pointSize * 1.5, height, `${body.name}`)
    ]);
    height += conf.lineSize;
  }
  await image.drawAsync(drawList);
}

export async function animate(opts: Options) {
  console.log(opts);

  // Initialize the bodies and retrieve Horizons data
  const ephem: Body[] = [];
  let maxDistance: number = 0;
  const origin = major[opts.origin.toLocaleLowerCase()] ? major[opts.origin.toLocaleLowerCase()].id : opts.origin;
  for (const id of opts.bodies) {
    const wkb = major[id.toLocaleLowerCase()];
    const [body, color] = wkb ?
      [wkb.id, wkb.color] :
      id.split('=');
    if (!color) {
      throw new Error(`No color for body ${body}`);
    }
    const r = await Horizons.vectors({ center: origin, body: body, start: opts.start, stop: opts.stop, step: opts.step });
    if (!r?.data?.length) {
      throw new Error(`Horizons API returned an empty dataset for ${body}`);
    }
    ephem.push({
      id: body,
      color: color,
      stroke: new Magick.DrawableStrokeColor(color),
      fill: new Magick.DrawableFillColor(color),
      name: r.object,
      trajectory: r.data
    });
    maxDistance = r.data.reduce((a, x) => Math.max(a, Math.abs(x.data.X) || 0, Math.abs(x.data.Y) || 0, Math.abs(x.data.Z) || 0), maxDistance);
  }
  const coordsToPixels = getProjectionFunction(opts.proj, {
    width: opts.width,
    height: opts.height,
    max: maxDistance
  });
  console.log(`Animating\n${ephem.map((b) => `\t${b.name}  :  ${b.color}`).join('\n')}`);

  const conf: Settings = {
    opts,
    pointSize: opts.width / 16,
    lineSize: opts.height / 36,
    bodySize: Math.round(Math.min(opts.width, opts.height) / 400) || 1,
    drawStrokeTransparent: new Magick.DrawableStrokeColor('transparent'),
    drawFillTransparent: new Magick.DrawableStrokeColor('transparent'),
    drawWhite: new Magick.DrawableFillColor('white'),
    drawPointSize: new Magick.DrawablePointSize(opts.width / 16 / 6),
    drawFont: new Magick.DrawableFont('Bitstream Charter', MagickCore.NormalStyle, 400, MagickCore.NormalStretch)
  };

  // Create the video
  const formatIn = new ffmpeg.PixelFormat(ffmpeg.AV_PIX_FMT_RGBA);
  const formatOut = new ffmpeg.PixelFormat(ffmpeg.AV_PIX_FMT_YUV420P);
  const timeBase = new ffmpeg.Rational(1, opts.fps);
  const videoOutput = new VideoEncoder({
    type: 'Video',
    codec: ffmpeg.AV_CODEC_H265,
    bitRate: opts.br,
    width: opts.width,
    height: opts.height,
    frameRate: new ffmpeg.Rational(opts.fps, 1),
    timeBase,
    pixelFormat: formatOut
  });
  const videoRescaler = new VideoTransform({
    input: { ...videoOutput.definition(), pixelFormat: formatIn },
    output: videoOutput.definition(),
    interpolation: ffmpeg.SWS_BILINEAR
  });
  const output = new Muxer({ outputFile: opts.file, streams: [videoOutput] });
  const totalFrames = ephem[0].trajectory.length;

  // Create the background and the legend
  const image = new Magick.Image(`${opts.width}x${opts.height}`, 'black');
  image.magick('rgba');
  image.depth(8);
  image.strokeAntiAlias(true);
  if (opts.legend) {
    await legend(image, conf, ephem);
  }

  // Create the frames one by one
  let frameIdx = 0;
  async function genFrame() {
    let frame;
    let time = 0;
    do {
      const t0 = Date.now();
      const im = await draw(coordsToPixels, image, conf, ephem, frameIdx);
      const blob = new Magick.Blob;
      await im.writeAsync(blob);
      frame = ffmpeg.VideoFrame.create(Buffer.from(blob.data()), formatIn, opts.width, opts.height);
      frame.setTimeBase(timeBase);
      frame.setPts(new ffmpeg.Timestamp(frameIdx, timeBase));
      const t1 = Date.now();
      time += (t1 - t0) / 1000;
      frameIdx++;
      process.stdout.write(`Frame ${frameIdx} of ${totalFrames}, fps ${(frameIdx / time).toPrecision(3)}\r`);
    } while (videoRescaler.write(frame, 'binary') && frameIdx < totalFrames);

    if (frameIdx < totalFrames) {
      videoRescaler.once('drain', genFrame);
    } else {
      videoRescaler.end();
    }
  }
  videoRescaler.pipe(videoOutput).pipe(output.video[0]);
  genFrame();
}
