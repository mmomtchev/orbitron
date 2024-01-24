import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { JD } from '@lunisolar/julian';
import { Options } from './options';

const horizons_endpoint = `https://ssd.jpl.nasa.gov/api`;
const horizons_lookup = `${horizons_endpoint}/horizons_lookup.api`;
const horizons_main = `${horizons_endpoint}/horizons.api`;

export interface LookupItem {
  name: string;
  spkid: number;
  alias?: string[];
};

export interface LookupResult {
  result: LookupItem[];
  count: number;
  signature: {
    source: string;
    version: string;
  };
};

export interface EphemItem {
  jd: number;
  date: Date;
  data: Record<string, number>;
};

export async function lookup(s: string) {
  const r = await fetch(`${horizons_lookup}?group=pln&sstr=${s}`)
    .then((r) => r.json());
  return r as LookupResult;
}

export async function vectors(req: { center: string; body: string; start: Date; stop: Date; step: string; }, opt: Options) {
  const url = `${horizons_main}?` +
    `format=text` +
    `&command=${req.body}` +
    `&obj_data=no&ephem_type=vectors&vec_table=1` +
    `&center=${req.center}` +
    `&step_size=${req.step}` +
    `&start_time='${req.start.toISOString()}'&stop_time='${req.stop.toISOString()}'`;
  const hash = crypto.createHash('md5');
  hash.update(url);
  const digest = hash.digest().toString('hex');
  if (opt.verbose) console.log(digest, url);
  let raw: string;

  try {
    raw = await fs.readFile(path.resolve(__dirname, '..', 'cache', `${digest}.txt`), 'utf-8');
    console.log('retrieved from cache', digest);
  } catch {
    raw = await fetch(url).then((r) => r.text());
    console.log('retrieved from server');
    await fs.mkdir(path.resolve(__dirname, '..', 'cache'), { recursive: true });
    await fs.writeFile(path.resolve(__dirname, '..', 'cache', `${digest}.txt`), raw, 'utf-8');
    console.log('saved to cache', digest);
  }

  const object = ((raw.match(/Target body name: ([^\{\(\n]+)/) || [])[1] || '???').trim();

  const lines = raw.substring(raw.indexOf('$$SOE'), raw.indexOf('$$EOE')).split('\n');
  lines.shift();
  lines.pop();

  const data = [] as EphemItem[];
  for (let i = 0; i < lines.length; i += 2) {
    const jd = +lines[i].split(' ')[0];
    const element: EphemItem = { jd, date: new Date(JD.fromJdn(jd).format('YYYY-MM-DDTHH:mm:ssZ')), data: {} };
    for (const parm of lines[i + 1].matchAll(/([A-Za-z]+)\s*=\s*(-?[0-9]+\.[0-9]+E[-+][0-9]+)/g)) {
      element.data[parm[1]] = +parm[2];
    }
    data.push(element);
  }
  return {
    object,
    data
  };
}
