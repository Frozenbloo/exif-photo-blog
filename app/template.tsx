'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAppState } from '@/app/AppState';
import { isDesignApplied } from '@/design';
import { isPathAdmin } from '@/app/path';

// Re-mounts on navigation: gives design themes their page-enter
// animation (defined in design-themes.css, gated on reduced motion)
export default function Template({ children }: { children: ReactNode }) {
  const { design } = useAppState();
  const pathname = usePathname();
  return isDesignApplied(design) && !isPathAdmin(pathname)
    ? <div className={`design-page-enter--${design}`}>
      {children}
    </div>
    : <>{children}</>;
}
