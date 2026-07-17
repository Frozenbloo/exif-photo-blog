'use server';

import { revalidateDesignKey } from '@/cache';
import { upsertDesign } from './query';
import { getDesignFromString } from '.';
import { runAuthenticatedAdminServerAction } from '@/auth/server';
import { revalidatePath } from 'next/cache';

export const updateDesignAction = async (formData: FormData) =>
  runAuthenticatedAdminServerAction(async () => {
    const design = getDesignFromString(formData.get('design') as string);
    await upsertDesign(design);
    revalidateDesignKey();
    // Design affects every page
    revalidatePath('/', 'layout');
  });
