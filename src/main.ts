import { program } from 'commander';
import { lookup } from './horizons';
import { animate } from './animate';

function collect(value: string, previous: string[]) {
  return previous.concat([value]);
}
function parseInteger(value: string) {
  return parseInt(value);
}

program
  .name('orbitron')
  .command('animate')
  .description('Generate orbital animations using NASA/JPL Horizons API')
  .option('--start <date>', 'starting date')
  .option('--stop <date>', 'final date')
  .option('--origin <Horizons ID | name>', 'reference body', 'Sun')
  .option('--body <<Horizons ID>=color | name>', 'body to animate', collect, [])
  .option('--proj <lin | log | sqrt | isolin | isosqrt>',
    'projection to use\n' +
    '\tlin\tLinear, 2D top-down view from the north, works best for the inner planets\n' +
    '\tlog\tLogarithmic, 2D top-down view from the north, works best for huge differences in scale\n' +
    '\tsqrt\tSquare Root, 2D top-down view from the north, works best for the main 8 planets\n' +
    '\tisolin\tLinear, 3D isometric view (45° from the north), for highly inclined orbits\n' +
    '\tisosqrt\tSquare Root, 3D isometric view (45° from the north), for the whole solar system\n' +
    '\tsidelin\tLinear, 2D, side view from the plane of the ecliptic, for highly inclined orbits around the inner planets\n',
    'isosqrt')
  .option('--out <file>', 'output file')
  .option('--width <number>', 'X-resolution of the output file', parseInteger, 1280)
  .option('--height <number>', 'Y-resolution of the output file', parseInteger, 720)
  .option('--fps <number>', 'frames per second', parseInteger, 30)
  .option('--br <number>', 'bitrate', parseFloat, 5e6)
  .option('--days <number>', 'number of days per frame', parseInteger, 1)
  .option('--hours <number>', 'number of hours per frame (use with --days 0)', parseInteger, 0)
  .option('--legend', 'include a legend', false)
  .option('--font <string>', 'font to use', 'Bitstream Charter')
  .option('--font-size <number>', 'font size', parseInteger, 0)
  .option('--body-size <number>', 'body size in pixels', parseInteger, 0)
  .option('--shadow-lines <number>', 'when using isometric 3D, place a shadow line every <number> frames', parseInteger, 50)
  .option('--date <bottom | top | off>', 'show the date', 'bottom')
  .option('--format <mp4 | gif>', 'output format', 'mp4')
  .option('--verbose', 'debug output', false)
  .action((options) => {
    if (!Date.parse(options.start) || !Date.parse(options.stop)) {
      console.error('--start and --stop are mandatory and must contain valid dates in the YYYY-MM-DD format');
      return;
    }
    if (!options.out) {
      console.error('Filename missing');
      return;
    }
    if (!options.body.length) {
      console.error('No bodies specified');
      return;
    }
    animate({
      file: options.out,
      origin: options.origin,
      bodies: options.body,
      start: new Date(options.start),
      stop: new Date(options.stop),
      width: options.width,
      height: options.height,
      fps: options.fps,
      br: options.br,
      step: options.days ? `${options.days}d` : `${options.hours}h`,
      proj: options.proj,
      legend: options.legend,
      font: options.font,
      pointSize: options.fontSize,
      bodySize: options.bodySize,
      shadowLines: options.shadowLines,
      date: options.date,
      format: options.format,
      verbose: options.verbose
    });
  });

program
  .command('lookup')
  .description('Lookup bodies in the Horizons database')
  .argument('<string>')
  .action((s) => lookup(s)
    .then((r) => {
      if (r.result?.length) {
        for (const b of r.result) {
          console.log(`${b.name} ${b.alias.join(', ')}\n\t\t${b.spkid}`);
        }
      } else {
        console.log('None found');
      }
    })
  );

program.parse(process.argv);
