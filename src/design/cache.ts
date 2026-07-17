import { unstable_cache } from 'next/cache';
import { getDesign } from './query';
import { KEY_DESIGN } from '@/cache';
import { DEFAULT_DESIGN, Design } from '.';

export const getDesignCached = (): Promise<Design> =>
  unstable_cache(
    getDesign,
    [KEY_DESIGN],
  )()
    // Site must render even when the database is unavailable
    .catch(() => DEFAULT_DESIGN);
