'use client';

import { clsx } from 'clsx/lite';
import Link from 'next/link';
import { useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAppState } from '@/app/AppState';
import { useAppText } from '@/i18n/state/client';
import {
  PATH_ABOUT,
  PATH_ADMIN_PHOTOS,
  PATH_FULL_INFERRED,
  PATH_GRID_INFERRED,
  PATH_ROOT,
} from '@/app/path';
import { GRID_HOMEPAGE_ENABLED, SHOW_ABOUT_PAGE } from '@/app/config';
import { KEY_COMMANDS } from '@/photo/key-commands';
import useKeydownHandler from '@/utility/useKeydownHandler';
import IconSearch from '@/components/icons/IconSearch';
import { SwitcherSelection } from '@/app/AppViewSwitcher';

// Themed replacement for the switcher nav: text links styled per
// design, same keyboard commands, search via cmd-k trigger.
// ponytail: admin is a text link here, not the full AdminAppMenu—
// that menu is welded to switcher geometry; revisit if admins miss it
export default function DesignNav({
  navTitle,
  navCaption,
  currentSelection,
}: {
  navTitle: string
  navCaption?: string
  currentSelection?: SwitcherSelection
}) {
  const pathname = usePathname();

  const {
    design,
    isUserSignedIn,
    setIsCommandKOpen,
  } = useAppState();

  const appText = useAppText();

  const refHrefFull = useRef<HTMLAnchorElement>(null);
  const refHrefGrid = useRef<HTMLAnchorElement>(null);
  const refHrefAbout = useRef<HTMLAnchorElement>(null);

  // Same key commands as AppViewSwitcher
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (!e.metaKey) {
      switch (e.key.toLocaleUpperCase()) {
        case KEY_COMMANDS.full:
          if (pathname !== PATH_FULL_INFERRED) { refHrefFull.current?.click(); }
          break;
        case KEY_COMMANDS.grid:
          if (pathname !== PATH_GRID_INFERRED) { refHrefGrid.current?.click(); }
          break;
        case KEY_COMMANDS.about:
          if (pathname !== PATH_ABOUT) { refHrefAbout.current?.click(); }
          break;
      }
    }
  }, [pathname]);
  useKeydownHandler({ onKeyDown });

  const isVolumes = design === 'volumes';
  const isIssue = design === 'issue';
  const isTitlecard = design === 'titlecard';
  const isHijack = design === 'hijack';

  const linkGrid = {
    key: 'grid',
    text: appText.nav.grid,
    href: PATH_GRID_INFERRED,
    hrefRef: refHrefGrid,
    active: currentSelection === 'grid',
  };
  const linkFull = {
    key: 'full',
    text: appText.nav.full,
    href: PATH_FULL_INFERRED,
    hrefRef: refHrefFull,
    active: currentSelection === 'full',
  };
  const links = [
    ...GRID_HOMEPAGE_ENABLED ? [linkGrid, linkFull] : [linkFull, linkGrid],
    ...SHOW_ABOUT_PAGE
      ? [{
        key: 'about',
        text: appText.nav.about,
        href: PATH_ABOUT,
        hrefRef: refHrefAbout,
        active: currentSelection === 'about',
      }]
      : [],
    ...isUserSignedIn
      ? [{
        key: 'admin',
        text: appText.nav.admin,
        href: PATH_ADMIN_PHOTOS,
        hrefRef: undefined,
        active: currentSelection === 'admin',
      }]
      : [],
  ];

  const classForLink = (active: boolean) => active
    ? isVolumes
      ? 'text-main underline underline-offset-4 decoration-(--d-ink)'
      : 'text-(--d-ink)'
    : 'text-dim hover:text-main';

  const renderLinks = (className?: string) =>
    <div className={clsx('flex items-center', className)}>
      {links.map(({ key, text, href, hrefRef, active }) =>
        <Link
          key={key}
          ref={hrefRef}
          href={href}
          className={classForLink(active)}
        >
          {isHijack ? `[${text.toLocaleLowerCase()}]` : text}
        </Link>)}
      <button
        type="button"
        aria-label={appText.nav.search}
        onClick={() => setIsCommandKOpen?.(true)}
        className="link text-dim hover:text-main flex items-center"
      >
        <IconSearch width={17} />
      </button>
    </div>;

  if (isVolumes) {
    // Running head: name left, sections right, hairline below
    return (
      <div className="w-full">
        <div className="flex items-baseline justify-between gap-4">
          <Link
            href={PATH_ROOT}
            className={clsx(
              'font-serif uppercase tracking-[0.3em] text-xs',
              'text-main truncate',
            )}
          >
            {navTitle}
          </Link>
          {renderLinks(clsx(
            'gap-4 sm:gap-5 shrink-0',
            'font-serif uppercase tracking-[0.2em] text-[0.7rem]',
          ))}
        </div>
        {navCaption &&
          <div className="font-serif italic text-dim text-xs mt-0.5">
            {navCaption}
          </div>}
        <div className="border-b border-(--d-border) mt-2" />
      </div>
    );
  }

  if (isIssue) {
    // Masthead: double-ruled nameplate over a centered link row
    return (
      <div className="w-full text-center">
        <div className="border-y-2 border-(--d-text) py-1.5">
          <Link
            href={PATH_ROOT}
            className={clsx(
              'font-masthead uppercase tracking-wide',
              'text-3xl sm:text-5xl leading-none',
              'inline-block max-w-full truncate align-bottom',
            )}
          >
            {navTitle}
          </Link>
          {navCaption &&
            <div className={clsx(
              'font-mono uppercase text-[0.6rem] tracking-[0.3em]',
              'text-(--d-ink) mt-1',
            )}>
              {navCaption}
            </div>}
        </div>
        {renderLinks(clsx(
          'justify-center gap-5 py-2',
          'font-mono uppercase text-[0.65rem] tracking-[0.25em]',
          'border-b border-(--d-border)',
        ))}
      </div>
    );
  }

  if (isTitlecard) {
    return (
      <div className={clsx(
        'w-full flex items-center justify-between gap-4',
        'border-b border-(--d-border) pb-3',
      )}>
        <Link
          href={PATH_ROOT}
          className={clsx(
            'font-mincho font-bold tracking-[0.25em] text-lg',
            'truncate',
          )}
        >
          {navTitle}
        </Link>
        {renderLinks(clsx(
          'gap-4 sm:gap-5 shrink-0',
          'font-mono uppercase text-[0.65rem] tracking-[0.3em]',
        ))}
      </div>
    );
  }

  // Hijack: terminal prompt bar
  return (
    <div className="w-full border-b border-(--d-border) pb-2">
      <div className="flex items-center gap-2 font-mono text-sm min-w-0">
        <span className="text-dim shrink-0">~$</span>
        <Link
          href={PATH_ROOT}
          className={clsx(
            'design-nav-title font-stencil tracking-[0.15em]',
            'truncate',
          )}
        >
          {navTitle}
        </Link>
        <span className="design-cursor shrink-0">▮</span>
        <div className="grow" />
        {renderLinks('gap-3 text-xs shrink-0')}
        <span className={clsx(
          'max-md:hidden shrink-0',
          'text-[0.6rem] tracking-[0.3em] text-(--d-ink-2)',
        )}>
          SIGNAL: HIJACKED
        </span>
      </div>
    </div>
  );
}
