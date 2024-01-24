import { Proj } from "./projection";

export interface Options {
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
  font: string;
  pointSize: number;
  date: 'bottom' | 'top' | 'off';
  format: 'mp4' | 'gif';
  verbose: boolean | undefined;
};
