export const DESIGNS = [
  'default',
  'issue',
  'titlecard',
  'volumes',
  'hijack',
] as const;

export type Design = (typeof DESIGNS)[number];

export const DEFAULT_DESIGN: Design = 'default';

export interface DesignConfig {
  title: string
  description: string
  // Overrides light/dark switching when set
  forcedColorScheme?: 'dark'
  // Grid tiles keep native aspect ratios instead of cropping
  showsUncroppedGrid?: boolean
  // Swatches shown in admin design picker
  swatches: string[]
}

export const DESIGN_CONFIG: Record<Design, DesignConfig> = {
  default: {
    title: 'Classic',
    description: 'The stock design: mono type, cropped grid, light/dark.',
    swatches: ['#ffffff', '#111111', '#2563eb'],
  },
  issue: {
    title: 'The Issue',
    description:
      'Riso zine: newsprint, masthead type, spot-ink duotones on hover.',
    showsUncroppedGrid: true,
    swatches: ['#EFEDE6', '#23262B', '#0078BF'],
  },
  titlecard: {
    title: 'The Title Card',
    description:
      'Retro-Japanese: black title cards, mincho type, telemetry orange.',
    forcedColorScheme: 'dark',
    swatches: ['#0B0B0C', '#F0EEE4', '#F94C00'],
  },
  volumes: {
    title: 'The Volumes',
    description:
      'Photobook: plates with captions, running heads, per-year volume inks.',
    showsUncroppedGrid: true,
    swatches: ['#FBFAF7', '#1C1A18', '#59201F'],
  },
  hijack: {
    title: 'The Hijack',
    description:
      'Pirate broadcast: terminal chrome, RGB-split glitches, exfil logs.',
    forcedColorScheme: 'dark',
    swatches: ['#0B0D12', '#31E4FF', '#FF3AA2'],
  },
};

export const getDesignFromString = (design?: string | null): Design =>
  DESIGNS.find(d => d === design) ?? DEFAULT_DESIGN;

export const isDesignApplied = (design?: Design) =>
  Boolean(design) && design !== 'default';

// Real riso ink colors, rotated per photo year
// ponytail: deterministic rotation—deriving inks from photo colorData
// can replace this if volumes should feel more bespoke
const VOLUME_INKS = [
  '#0078BF', // riso blue
  '#00A95C', // riso green
  '#F15060', // riso bright red
  '#765BA7', // riso violet
  '#FF6C2F', // riso orange
  '#00838A', // riso teal
] as const;

export const inkForYear = (year?: string | number) => {
  const numericYear = Number(year);
  return VOLUME_INKS[
    isNaN(numericYear) ? 0 : numericYear % VOLUME_INKS.length
  ];
};

// Roman numeral years, as printed in book colophons,
// let volumes be labeled without knowing the archive's first year
const ROMAN: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export const romanize = (number: number) => {
  let remaining = Math.max(0, Math.floor(number));
  return ROMAN.reduce((result, [value, numeral]) => {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
    return result;
  }, '');
};

export const volumeLabelForYear = (year?: string) =>
  year ? `Vol. ${romanize(Number(year))}` : undefined;

export const yearFromPhotoDate = (takenAtNaive?: string) =>
  takenAtNaive?.slice(0, 4);

// e.g. "'26 7 12" — the quartz datestamp of a 90s point-and-shoot
export const datestampForPhotoDate = (takenAtNaive?: string) => {
  const [year, month, day] = takenAtNaive?.split(/[\s-]/) ?? [];
  return year && month && day
    ? `'${year.slice(2)} ${Number(month)} ${Number(day)}`
    : undefined;
};
