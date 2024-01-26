import ffmpeg from '@mmomtchev/ffmpeg';
import { Magick, MagickCore } from 'magickwand.js';

import * as Horizons from './horizons';
import { ProjFn, getProjectionFunction } from './projection';
import { Options } from './options';
import major from './major-bodies';
import { encoder } from './encode';

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

/**
 * The main drawing function, creates one frame from the given trajectories
 * 
 * @param coordsToPixels projection function
 * @param background background image that is carried over, contains the orbital lines
 * @param conf the configuration settings
 * @param bodies the trajectories
 * @param idx the frame index
 * @returns the current frame
 */
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
      if (conf.opts.shadowLines && (idx % conf.opts.shadowLines === 0)) {
        await background.drawAsync([
          conf.drawFillTransparent,
          body.stroke,
          new Magick.DrawableLine(...origin, ...shadow)
        ]);
      }
    }
    if (idx > 0) {
      const prevPosition = body.trajectory[idx - 1];
      await background.drawAsync([
        conf.drawFillTransparent,
        body.stroke,
        new Magick.DrawableLine(...origin,
          ...coordsToPixels(prevPosition.data.X, prevPosition.data.Y, prevPosition.data.Z)[0])
      ]);
    }
  }

  if (conf.opts.date !== 'off') {
    drawList.push(...[
      conf.drawFont,
      conf.drawPointSize,
      conf.drawStrokeTransparent,
      conf.drawWhite,
      new Magick.DrawableText(conf.lineSize,
        conf.opts.date === 'bottom' ? conf.opts.height - conf.lineSize : conf.lineSize,
        `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`)
    ]);
  }
  await image.drawAsync(drawList);
  return image;
}

/**
 * Draw the legend
 * 
 * @param image the background image
 * @param conf the configuration settings
 * @param bodies the bodies and their trajectories
 */
async function legend(image: Magick.Image, conf: Settings, bodies: Body[]) {
  const drawList: Magick.DrawableBase[] = [];

  const maxLen = bodies.reduce((a, x) => x.name.length > a.length ? x.name : a, '');
  const width = (await image.fontTypeMetricsAsync(maxLen)).textWidth();

  let height = conf.lineSize;
  for (const body of bodies) {
    drawList.push(...[
      conf.drawFont,
      conf.drawPointSize,
      conf.drawStrokeTransparent,
      body.fill,
      new Magick.DrawableText(Math.round(conf.opts.width - width * 1.2), height, `${body.name}`)
    ]);
    height += conf.lineSize;
  }
  await image.drawAsync(drawList);
}

/**
 * Main entry point, called by 'animate' from the command line
 * 
 * @param opts the command-line options
 */
export async function animate(opts: Options) {
  if (opts.verbose) console.log(opts);

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
    const r = await Horizons.vectors({ center: origin, body: body, start: opts.start, stop: opts.stop, step: opts.step }, opts);
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

  const image = new Magick.Image(`${opts.width}x${opts.height}`, 'black');
  const pointSize = opts.pointSize || (opts.width / 16 / 6);
  image.fontPointsize(pointSize);
  image.fontFamily(opts.font);
  image.fontStyle(MagickCore.NormalStyle);
  image.fontWeight(400);
  const metrics = image.fontTypeMetrics('YYYY-MM-DD');
  const bodySize = opts.bodySize || Math.round(Math.min(opts.width, opts.height) / 400) || 1;
  const conf: Settings = {
    opts,
    pointSize,
    lineSize: Math.round(metrics.textHeight() * 1.5),
    bodySize,
    drawStrokeTransparent: new Magick.DrawableStrokeColor('transparent'),
    drawFillTransparent: new Magick.DrawableStrokeColor('transparent'),
    drawWhite: new Magick.DrawableFillColor('white'),
    drawPointSize: new Magick.DrawablePointSize(pointSize),
    drawFont: new Magick.DrawableFont(opts.font, MagickCore.NormalStyle, 400, MagickCore.NormalStretch)
  };

  // Create the video
  const totalFrames = ephem[0].trajectory.length;
  const video = encoder(opts);

  // Create the background and the legend
  image.magick('rgba');
  image.depth(8);
  image.strokeAntiAlias(true);
  if (opts.legend) {
    await legend(image, conf, ephem);
  }

  // Create the frames one by one
  let frameIdx = 0;
  async function genFrame() {
    let more: boolean;
    let time = 0;
    do {
      const t0 = Date.now();
      const im = await draw(coordsToPixels, image, conf, ephem, frameIdx);
      const blob = new Magick.Blob;
      await im.writeAsync(blob);
      more = video.write(blob.data(), frameIdx);
      const t1 = Date.now();
      time += (t1 - t0) / 1000;
      frameIdx++;
      process.stdout.write(`Frame ${frameIdx} of ${totalFrames}, fps ${(frameIdx / time).toPrecision(3)}\r`);
    } while (more && frameIdx < totalFrames);

    if (frameIdx < totalFrames) {
      video.drain(genFrame);
    } else {
      video.end();
    }
  }

  genFrame();
  video.start();
}
