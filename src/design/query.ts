import { sql } from '@/platforms/postgres';
import { Design, getDesignFromString } from '.';

const createDesignTable = () =>
  sql`
    CREATE TABLE IF NOT EXISTS design (
      id SERIAL PRIMARY KEY,
      design VARCHAR(31) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

// ponytail: self-contained table bootstrap, avoids growing the shared
// migration switch in db/query.ts for a single-row settings table
const safelyQueryDesign = async <T>(
  callback: () => Promise<T>,
): Promise<T> => {
  try {
    return await callback();
  } catch (e: any) {
    if (/relation "design" does not exist/i.test(e.message)) {
      await createDesignTable();
      return callback();
    }
    throw e;
  }
};

export const getDesign = (): Promise<Design> =>
  safelyQueryDesign(() => sql`
    SELECT design FROM design LIMIT 1
  `.then(({ rows }) => getDesignFromString(rows[0]?.design as string)));

export const upsertDesign = (design: Design) =>
  safelyQueryDesign(() => sql`
    INSERT INTO design (id, design)
    VALUES (1, ${design})
    ON CONFLICT (id) DO UPDATE SET
      design = EXCLUDED.design,
      updated_at = CURRENT_TIMESTAMP
  `);
