import ffmpeg from '@mmomtchev/ffmpeg';
import { Filter, Muxer, VideoEncoder, VideoTransform } from '@mmomtchev/ffmpeg/stream';
import { Options } from './options';

export function encoder(opts: Options) {
  ffmpeg.setLogLevel(opts.verbose ? ffmpeg.AV_LOG_VERBOSE : ffmpeg.AV_LOG_ERROR);
  const formatImage = new ffmpeg.PixelFormat(ffmpeg.AV_PIX_FMT_RGBA);
  const formatVideo = opts.format === 'gif' ?
    new ffmpeg.PixelFormat(ffmpeg.AV_PIX_FMT_RGB8) :
    new ffmpeg.PixelFormat(ffmpeg.AV_PIX_FMT_YUV420P);
  const timeBase = new ffmpeg.Rational(1, opts.fps);

  const videoOutput = new VideoEncoder({
    type: 'Video',
    codec: opts.format === 'gif' ? ffmpeg.AV_CODEC_GIF : ffmpeg.AV_CODEC_H265,
    bitRate: opts.br,
    width: opts.width,
    height: opts.height,
    frameRate: new ffmpeg.Rational(opts.fps, 1),
    timeBase,
    pixelFormat: formatVideo
  });
  const definitionIn = { ...videoOutput.definition(), pixelFormat: formatImage };
  const videoRescaler = new VideoTransform({
    input: definitionIn,
    output: videoOutput.definition(),
    interpolation: ffmpeg.SWS_BILINEAR
  });
  const output = new Muxer({ outputFile: opts.file, outputFormat: opts.format, streams: [videoOutput] });

  return {
    write: (data: ArrayBuffer, idx: number) => {
      const frame = ffmpeg.VideoFrame.create(Buffer.from(data), formatImage, opts.width, opts.height);
      frame.setTimeBase(timeBase);
      frame.setPts(new ffmpeg.Timestamp(idx, timeBase));
      return videoRescaler.write(frame, 'binary');
    },
    start: () => {
      videoRescaler.pipe(videoOutput).pipe(output.video[0]);
    },
    drain: (fn: () => void) => {
      console.log('wait for drain', videoRescaler, fn);
      videoRescaler.once('drain', fn);
    },
    end: () => {
      videoRescaler.end();
    }
  };
}
