export type ProjFn = (x: number, y: number, z: number) => [[number, number], [number, number] | null];
export type Proj = 'lin' | 'log' | 'sqrt' | 'isolin' | 'isosqrt' | 'sidelin';

export function getProjectionFunction(type: Proj, { width, height, max }: { width: number, height: number, max: number; }): ProjFn {
  switch (type) {
    case 'lin':
      {
        const scale = Math.min(width - 2, height - 2) / max / 2;
        return (x: number, y: number) => [[Math.round(x * scale + width / 2), Math.round(height / 2 - y * scale)] as [number, number], null];
      }
    case 'log':
      {
        const exp = Math.min(width - 2, height - 2) / Math.log10(max) / 2;
        return (x: number, y: number) => {
          const r = Math.sqrt(x * x + y * y);
          if (r == 0) return [[width / 2, height / 2], null];
          const fi = Math.atan2(y, x);
          const r_scaled = Math.log10(r) * exp;
          const x_scaled = r_scaled * Math.cos(fi);
          const y_scaled = r_scaled * Math.sin(fi);
          return [[Math.round(x_scaled + width / 2), Math.round(height / 2 - y_scaled)], null];
        };
      }
    case 'sqrt':
      {
        const sqr = Math.min(width - 2, height - 2) / Math.sqrt(max) / 2;
        return (x: number, y: number) => {
          const r = Math.sqrt(x * x + y * y);
          if (r == 0) return [[width / 2, height / 2], null];
          const fi = Math.atan2(y, x);
          const r_scaled = Math.sqrt(r) * sqr;
          const x_scaled = r_scaled * Math.cos(fi);
          const y_scaled = r_scaled * Math.sin(fi);
          return [[Math.round(x_scaled + width / 2), Math.round(height / 2 - y_scaled)], null];
        };
      }
    case 'isolin':
      {
        const isoscale = Math.min(width - 2, height - 2) / max / 2;
        return (x: number, y: number, z: number) => [
          [Math.round(x * isoscale + width / 2), Math.round(height / 2 - y * isoscale * Math.SQRT1_2 - z * isoscale * Math.SQRT1_2)] as [number, number],
          [Math.round(x * isoscale + width / 2), Math.round(height / 2 - y * isoscale * Math.SQRT1_2)] as [number, number]
        ];
      }
    case 'sidelin':
      {
        const scale = Math.min(width - 2, height - 2) / max / 2;
        return (x: number, y: number, z: number) => [[Math.round(x * scale + width / 2), Math.round(height / 2 - z * scale)] as [number, number], null];
      }
    case 'isosqrt':
      {
        const isosqrt = Math.min(width - 2, height - 2) / Math.sqrt(max) / 2;
        return (x: number, y: number, z: number) => {
          const r = Math.sqrt(x * x + y * y);
          if (r == 0) return [[width / 2, height / 2], null];
          const fi = Math.atan2(y, x);
          const r_scaled = Math.sqrt(r) * isosqrt;
          const x_scaled = r_scaled * Math.cos(fi);
          const y_scaled = r_scaled * Math.sin(fi);
          const z_scaled = z * (r_scaled / r);
          return [
            [Math.round(x_scaled + width / 2), Math.round(height / 2 - y_scaled * Math.SQRT1_2 - z_scaled * Math.SQRT1_2)],
            [Math.round(x_scaled + width / 2), Math.round(height / 2 - y_scaled * Math.SQRT1_2)],
          ];
        };
      }
  }
}
