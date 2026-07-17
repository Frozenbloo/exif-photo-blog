'use client';

import { Photo } from '.';
import { PhotoSetCategory } from '../category';
import PhotoMedium from './PhotoMedium';
import { clsx } from 'clsx/lite';
import AnimateItems from '@/components/AnimateItems';
import {
  GRID_ASPECT_RATIO,
  MASONRY_GRID_ENABLED,
} from '@/app/config';
import { useAppState } from '@/app/AppState';
import SelectTileOverlay from '@/components/SelectTileOverlay';
import { ReactNode, useEffect } from 'react';
import { GRID_GAP_CLASSNAME } from '@/components';
import { useSelectPhotosState } from '@/admin/select/SelectPhotosState';
import { DATA_KEY_PHOTO_GRID } from '@/admin/select/SelectPhotosProvider';
import PhotoGridMasonry from './PhotoGridMasonry';
import { DESIGN_CONFIG, isDesignApplied } from '@/design';

export default function PhotoGrid({
  photos,
  prioritizeInitialPhotos,
  className,
  classNamePhoto,
  animate = true,
  canStart,
  animateOnFirstLoadOnly,
  staggerOnFirstLoadOnly = true,
  additionalTile,
  small,
  selectable = true,
  onLastPhotoVisible,
  onAnimationComplete,
  ...categories
}: {
  photos: Photo[]
  prioritizeInitialPhotos?: boolean
  className?: string
  classNamePhoto?: string
  animate?: boolean
  canStart?: boolean
  animateOnFirstLoadOnly?: boolean
  staggerOnFirstLoadOnly?: boolean
  additionalTile?: ReactNode
  small?: boolean
  selectable?: boolean
  onLastPhotoVisible?: () => void
  onAnimationComplete?: () => void
} & PhotoSetCategory) {
  const {
    isGridHighDensity,
    design,
  } = useAppState();

  // Print-like designs never crop: tiles keep native aspect ratios
  const showsUncroppedGrid =
    design && DESIGN_CONFIG[design].showsUncroppedGrid;

  const {
    isSelectingPhotos,
    isSelectingAllPhotos,
    selectedPhotoIds,
    togglePhotoSelection,
  } = useSelectPhotosState();

  const isDesigned = isDesignApplied(design);
  const isVolumes = design === 'volumes';
  const isIssue = design === 'issue';
  const isTitlecard = design === 'titlecard';
  const isHijack = design === 'hijack';
  // Justified rows of native-ratio plates (volumes + issue)
  const isJustified = isVolumes || isIssue;

  // Themed grids skip AnimateItems (stillness): release anything
  // gated on the entrance animation completing
  useEffect(() => {
    if (isDesigned) { onAnimationComplete?.(); }
  }, [isDesigned, onAnimationComplete]);

  const photoNodes = photos.map((photo, index) => {
    const isSelected = (
      selectedPhotoIds?.includes(photo.id) ||
      isSelectingAllPhotos
    ) ?? false;
    return <div
      key={photo.id}
      className={clsx(
        'flex relative overflow-hidden',
        'group',
      )}
      style={{
        ...(MASONRY_GRID_ENABLED || showsUncroppedGrid) ? {
          aspectRatio: photo.aspectRatio,
        } : (GRID_ASPECT_RATIO !== 0) ? {
          aspectRatio: GRID_ASPECT_RATIO,
        } : {},
      }}
    >
      <PhotoMedium
        className={clsx(
          'flex w-full h-full',
          // Prevent photo navigation when selecting
          isSelectingPhotos && 'pointer-events-none',
          classNamePhoto,
        )}
        {...{
          photo,
          ...categories,
          selected: isSelected,
          // More priority slots when masonry is on (helps LCP)
          priority: prioritizeInitialPhotos
            ? (MASONRY_GRID_ENABLED ? index < 36 : index < 6)
            : undefined,
          onVisible: index === photos.length - 1
            ? onLastPhotoVisible
            : undefined,
        }}
      />
      {isSelectingPhotos &&
        <SelectTileOverlay
          isSelected={isSelected}
          onSelectChange={() => togglePhotoSelection?.(photo.id)}
        />}
    </div>;
  });

  const allItems = photoNodes.concat(
    additionalTile ? [<div key="more">{additionalTile}</div>] : [],
  );

  // THEMED GRIDS: plain containers (no entrance animation),
  // justified plate rows, tile captions, month divider cards
  if (isDesigned) {
    const renderMonthDivider = (month: string) => {
      const [year, monthNumber] = month.split('-');
      // ponytail: fixed en-US month names sidestep SSR/client
      // locale mismatches; wire to i18n if it ever matters
      const monthName = new Date(Number(year), Number(monthNumber) - 1)
        .toLocaleString('en-US', { month: 'long' });
      return (
        <div
          key={`month-${month}`}
          className={clsx(
            'flex flex-col items-center justify-center gap-1.5',
            'border border-(--d-border)',
          )}
          style={{
            aspectRatio: GRID_ASPECT_RATIO !== 0 ? GRID_ASPECT_RATIO : 1,
          }}
        >
          <div className="font-mincho font-bold text-2xl sm:text-3xl">
            {Number(monthNumber)}月
          </div>
          <div className={clsx(
            'font-mono uppercase text-[0.55rem] tracking-[0.3em]',
            'text-(--d-ink)',
          )}>
            {monthName} {year}
          </div>
        </div>
      );
    };

    const designedTiles: ReactNode[] = [];
    let lastMonth: string | undefined;

    photos.forEach((photo, index) => {
      if (isTitlecard) {
        const month = photo.takenAtNaive?.slice(0, 7);
        if (month && month !== lastMonth) {
          lastMonth = month;
          designedTiles.push(renderMonthDivider(month));
        }
      }

      const isSelected = (
        selectedPhotoIds?.includes(photo.id) ||
        isSelectingAllPhotos
      ) ?? false;

      // ponytail: plate numbers follow the current sort order, not
      // archive position—global numbering needs a row_number query
      const tileCaption = isVolumes
        ? `PL. ${index + 1}`
        : isIssue
          ? `Nº ${index + 1}`
          : isHijack
            ? `${photo.id}.raw`
            : undefined;

      designedTiles.push(
        <figure
          key={photo.id}
          className="m-0 min-w-0 flex flex-col gap-1"
          style={isJustified
            ? {
              flexGrow: photo.aspectRatio * 100,
              flexBasis: `${photo.aspectRatio * 11}rem`,
            }
            : undefined}
        >
          <div
            className="flex relative overflow-hidden group w-full"
            style={{
              aspectRatio: isJustified || GRID_ASPECT_RATIO === 0
                ? photo.aspectRatio
                : GRID_ASPECT_RATIO,
            }}
          >
            <PhotoMedium
              className={clsx(
                'flex w-full h-full',
                isSelectingPhotos && 'pointer-events-none',
                classNamePhoto,
              )}
              {...{
                photo,
                ...categories,
                selected: isSelected,
                priority: prioritizeInitialPhotos ? index < 6 : undefined,
                onVisible: index === photos.length - 1
                  ? onLastPhotoVisible
                  : undefined,
              }}
            />
            {isSelectingPhotos &&
              <SelectTileOverlay
                isSelected={isSelected}
                onSelectChange={() => togglePhotoSelection?.(photo.id)}
              />}
          </div>
          {tileCaption &&
            <figcaption className={clsx(
              'text-[0.6rem] tracking-[0.2em] text-dim uppercase',
              isVolumes ? 'font-serif text-center' : 'font-mono',
            )}>
              {tileCaption}
            </figcaption>}
        </figure>,
      );
    });

    if (additionalTile) {
      designedTiles.push(
        <div
          key="more"
          style={isJustified
            ? { flexGrow: 100, flexBasis: '10rem' }
            : undefined}
        >
          {additionalTile}
        </div>,
      );
    }

    return (
      <div {...{ [DATA_KEY_PHOTO_GRID]: selectable, className }}>
        <div className={clsx(
          isJustified
            ? 'flex flex-wrap design-grid-justified gap-2 sm:gap-3'
            : clsx(
              'grid items-start',
              small
                ? 'grid-cols-3 xs:grid-cols-6'
                : isGridHighDensity
                  ? 'grid-cols-2 xs:grid-cols-4 lg:grid-cols-6'
                  : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4',
              isTitlecard ? 'gap-1.5 sm:gap-2.5' : GRID_GAP_CLASSNAME,
            ),
        )}>
          {designedTiles}
        </div>
      </div>
    );
  }

  if (MASONRY_GRID_ENABLED) {
    return (
      <PhotoGridMasonry
        photos={photos}
        photoNodes={photoNodes}
        additionalTile={additionalTile}
        small={small}
        isGridHighDensity={isGridHighDensity}
        selectable={selectable}
        className={className}
        animate={animate}
        canStart={canStart}
        animateOnFirstLoadOnly={animateOnFirstLoadOnly}
        staggerOnFirstLoadOnly={staggerOnFirstLoadOnly}
        onAnimationCompleteAction={onAnimationComplete}
      />
    );
  }

  return (
    <div
      {...{ [DATA_KEY_PHOTO_GRID]: selectable, className }}
    >
      <AnimateItems
        className={clsx(
          'grid',
          GRID_GAP_CLASSNAME,
          small
            ? 'grid-cols-3 xs:grid-cols-6'
            : isGridHighDensity
              ? 'grid-cols-2 xs:grid-cols-4 lg:grid-cols-6'
              : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4',
          'items-center',
        )}
        // Designed themes are still: the page-enter animation
        // in app/template.tsx carries the motion instead
        type={animate === false || isDesignApplied(design)
          ? 'none'
          : undefined}
        canStart={canStart}
        duration={0.7}
        staggerDelay={0.04}
        distanceOffset={40}
        animateOnFirstLoadOnly={animateOnFirstLoadOnly}
        staggerOnFirstLoadOnly={staggerOnFirstLoadOnly}
        onAnimationComplete={onAnimationComplete}
        items={allItems}
        itemKeys={photos.map(photo => photo.id)
          .concat(additionalTile ? ['more'] : [])}
      />
    </div>
  );
};
