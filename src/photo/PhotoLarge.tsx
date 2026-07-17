'use client';

import {
  Photo,
  altTextForPhoto,
  doesPhotoNeedBlurCompatibility,
  shouldShowCameraDataForPhoto,
  shouldShowExifDataForPhoto,
  shouldShowFilmDataForPhoto,
  shouldShowLensDataForPhoto,
  shouldShowRecipeDataForPhoto,
} from '.';
import AppGrid from '@/components/AppGrid';
import ImageLarge from '@/components/image/ImageLarge';
import { clsx } from 'clsx/lite';
import Link from 'next/link';
import { pathForFocalLength, pathForPhoto } from '@/app/path';
import PhotoTags from '@/tag/PhotoTags';
import ShareButton from '@/share/ShareButton';
import DownloadButton from '@/components/DownloadButton';
import PhotoCamera from '../camera/PhotoCamera';
import { cameraFromPhoto } from '@/camera';
import PhotoFilm from '@/film/PhotoFilm';
import { sortTagsArray } from '@/tag';
import DivDebugBaselineGrid from '@/components/DivDebugBaselineGrid';
import PhotoLink from './PhotoLink';
import {
  SHOULD_PREFETCH_ALL_LINKS,
  ALLOW_PUBLIC_DOWNLOADS,
  SHOW_TAKEN_AT_TIME,
  MATTE_COLOR,
  MATTE_COLOR_DARK,
  ALWAYS_SHOW_EXPOSURE_COMP,
} from '@/app/config';
import AdminPhotoMenu from '@/admin/AdminPhotoMenu';
import { RevalidatePhoto } from './InfinitePhotoScroll';
import { useCallback, useMemo, useRef } from 'react';
import useVisibility from '@/utility/useVisibility';
import PhotoDate from './PhotoDate';
import { useAppState } from '@/app/AppState';
import { LuExpand } from 'react-icons/lu';
import LoaderButton from '@/components/primitives/LoaderButton';
import Tooltip from '@/components/Tooltip';
import ZoomControls, { ZoomControlsRef } from '@/components/image/ZoomControls';
import { AnimatePresence } from 'framer-motion';
import useRecipeOverlay from '../recipe/useRecipeOverlay';
import PhotoRecipeOverlay from '@/recipe/PhotoRecipeOverlay';
import PhotoRecipe from '@/recipe/PhotoRecipe';
import PhotoLens from '@/lens/PhotoLens';
import { lensFromPhoto } from '@/lens';
import MaskedScroll from '@/components/MaskedScroll';
import { useAppText } from '@/i18n/state/client';
import { Album } from '@/album';
import AdminPhotoStorageCheck from '@/admin/storage/AdminPhotoStorageCheck';
import {
  isDesignApplied,
  inkForYear,
  volumeLabelForYear,
  yearFromPhotoDate,
} from '@/design';

export default function PhotoLarge({
  photo,
  className,
  album,
  primaryTag,
  priority,
  prefetch = SHOULD_PREFETCH_ALL_LINKS,
  prefetchRelatedLinks = SHOULD_PREFETCH_ALL_LINKS,
  recent,
  year,
  revalidatePhoto,
  showTitle = true,
  showTitleAsH1,
  showCamera = true,
  showLens = true,
  showFilm = true,
  showRecipe = true,
  showZoomControls: _showZoomControls = true,
  shouldZoomOnFKeydown = true,
  shouldShare = true,
  shouldShareRecents,
  shouldShareYear,
  shouldShareCamera,
  shouldShareLens,
  shouldShareAlbum,
  shouldShareTag,
  shouldShareFilm,
  shouldShareRecipe,
  shouldShareFocalLength,
  includeFavoriteInAdminMenu,
  onVisible,
  showAdminKeyCommands,
  showStorageCheck,
}: {
  photo: Photo
  className?: string
  album?: Album
  primaryTag?: string
  priority?: boolean
  prefetch?: boolean
  prefetchRelatedLinks?: boolean
  recent?: boolean
  year?: string
  revalidatePhoto?: RevalidatePhoto
  showTitle?: boolean
  showTitleAsH1?: boolean
  showCamera?: boolean
  showLens?: boolean
  showFilm?: boolean
  showRecipe?: boolean
  showZoomControls?: boolean
  shouldZoomOnFKeydown?: boolean
  shouldShare?: boolean
  shouldShareRecents?: boolean
  shouldShareYear?: boolean
  shouldShareCamera?: boolean
  shouldShareLens?: boolean
  shouldShareAlbum?: boolean
  shouldShareTag?: boolean
  shouldShareFilm?: boolean
  shouldShareRecipe?: boolean
  shouldShareFocalLength?: boolean
  includeFavoriteInAdminMenu?: boolean
  onVisible?: () => void
  showAdminKeyCommands?: boolean
  showStorageCheck?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null);
  const refZoomControls = useRef<ZoomControlsRef>(null);
  const refPhotoRecipe = useRef<HTMLDivElement>(null);
  const refPhotoFilm = useRef<HTMLDivElement>(null);

  const {
    areZoomControlsShown,
    arePhotosMatted,
    shouldDebugRecipeOverlays,
    isUserSignedIn,
    design,
  } = useAppState();

  const appText = useAppText();

  const showZoomControls = _showZoomControls && areZoomControlsShown;
  const selectZoomImageElement = useCallback(
    (container: HTMLElement | null) => Array
      .from(container?.getElementsByTagName('img') ?? [])
      // Ignore fallback blur images
      .filter((img) => !img.src.startsWith('data:image'))[0]
    , []);

  const refRecipe = useRef<HTMLDivElement>(null);
  const refTriggers = useMemo(() => [
    refPhotoRecipe,
    refPhotoFilm,
  ], []);
  const {
    isShowingRecipeOverlay,
    toggleRecipeOverlay,
    hideRecipeOverlay,
  } = useRecipeOverlay({
    ref: refRecipe,
    refTriggers,
  });

  const tags = sortTagsArray(photo.tags, primaryTag);

  const camera = cameraFromPhoto(photo);
  const lens = lensFromPhoto(photo);
  const { recipeTitle } = photo;

  const showExifContent = shouldShowExifDataForPhoto(photo);

  const showCameraContent = showCamera && shouldShowCameraDataForPhoto(photo);
  const showLensContent = showLens && shouldShowLensDataForPhoto(photo);
  const showTagsContent = tags.length > 0;
  const showRecipeContent = showRecipe && shouldShowRecipeDataForPhoto(photo);
  const showFilmContent = showFilm && shouldShowFilmDataForPhoto(photo);

  useVisibility({ ref, onVisible });

  const hasTitle =
    showTitle &&
    Boolean(photo.title);

  const hasTitleContent =
    hasTitle ||
    Boolean(photo.caption);

  const hasMetaContent =
    showCameraContent ||
    showLensContent ||
    showTagsContent ||
    showRecipeContent ||
    showFilmContent ||
    showExifContent;

  const hasNonDateContent =
    hasTitleContent ||
    hasMetaContent;

  const renderPhotoLink =
    <PhotoLink
      photo={photo}
      className="font-bold uppercase grow"
      prefetch={prefetch}
    />;

  // Restrict width for landscape photos
  // (portrait photos are always height restricted)
  const matteContentWidthForAspectRatio =
    photo.aspectRatio > 3 / 2 + 0.1
      ? 'w-[90%]'
      : photo.aspectRatio >= 1
        ? 'w-[80%]'
        : undefined;

  const renderLargePhoto =
    <div className={clsx(
      'relative',
      arePhotosMatted && 'flex items-center justify-center',
      // Always specify height to ensure fallback doesn't collapse
      arePhotosMatted && 'h-[90%]',
      arePhotosMatted && matteContentWidthForAspectRatio,
    )}>
      <ZoomControls
        ref={refZoomControls}
        selectImageElement={selectZoomImageElement}
        {...{ isEnabled: showZoomControls, shouldZoomOnFKeydown }}
      >
        <ImageLarge
          className={clsx(arePhotosMatted && 'h-full')}
          classNameImage={clsx(arePhotosMatted &&
            'object-contain w-full h-full')}
          alt={altTextForPhoto(photo)}
          src={photo.url}
          aspectRatio={photo.aspectRatio}
          blurDataURL={photo.blurData}
          blurCompatibilityMode={doesPhotoNeedBlurCompatibility(photo)}
          priority={priority}
        />
      </ZoomControls>
      <div className={clsx(
        'absolute inset-0',
        'flex items-center justify-center',
        // Allow clicks to pass through to zoom controls
        // when not showing recipe overlay
        !(isShowingRecipeOverlay || shouldDebugRecipeOverlays) &&
          'pointer-events-none',
      )}>
        <AnimatePresence>
          {(isShowingRecipeOverlay || shouldDebugRecipeOverlays) &&
            photo.recipeData &&
            photo.film &&
              <PhotoRecipeOverlay
                ref={refRecipe}
                title={photo.recipeTitle}
                data={photo.recipeData}
                film={photo.film}
                iso={photo.isoFormatted}
                exposure={photo.exposureCompensationFormatted}
                onClose={hideRecipeOverlay}
              />}
        </AnimatePresence>
      </div>
    </div>;

  const renderAdminMenu =
    <AdminPhotoMenu {...{
      photo,
      revalidatePhoto,
      includeFavorite: includeFavoriteInAdminMenu,
      showKeyCommands: showAdminKeyCommands,
    }} />;

  const largePhotoContainerClassName = clsx(
    arePhotosMatted && 'flex items-center justify-center aspect-3/2',
    // Matte theme colors defined in root layout
    arePhotosMatted && (MATTE_COLOR
      ? 'bg-(--matte-bg)'
      : 'bg-gray-100'),
    arePhotosMatted && (MATTE_COLOR_DARK
      ? 'dark:bg-(--matte-bg-dark)'
      // Only specify dark background when MATTE_COLOR is not configured
      : !MATTE_COLOR && 'dark:bg-gray-700/30'),
  );

  const renderMainImage = showZoomControls
    ? <div className={largePhotoContainerClassName}>
      {renderLargePhoto}
    </div>
    : <Link
      href={pathForPhoto({ photo })}
      className={largePhotoContainerClassName}
      prefetch={prefetch}
    >
      {renderLargePhoto}
    </Link>;

  // DESIGNED PRESENTATION (site-wide design themes):
  // caption apparatus below the photo replaces the metadata side rail
  if (isDesignApplied(design)) {
    const isVolumes = design === 'volumes';
    const isIssue = design === 'issue';
    const isTitlecard = design === 'titlecard';
    const isHijack = design === 'hijack';
    const isCentered = isVolumes || isTitlecard;

    const photoYear = yearFromPhotoDate(photo.takenAtNaive);
    const volumeInk = inkForYear(photoYear);

    const exifLineValues = [
      photo.focalLengthFormatted,
      photo.fNumberFormatted,
      photo.exposureTimeFormatted,
      photo.isoFormatted,
      photo.exposureCompensationFormatted ??
        (ALWAYS_SHOW_EXPOSURE_COMP ? '0ev' : undefined),
    ].filter(Boolean) as string[];

    const designedTitleClassName = clsx(
      'inline-block',
      isVolumes && 'font-serif italic text-2xl',
      isIssue && 'font-masthead uppercase tracking-wide text-3xl',
      isTitlecard && 'font-mincho font-bold tracking-[0.15em] text-2xl',
      isHijack && 'font-mono uppercase tracking-[0.1em] text-lg',
    );

    const renderDesignedTitle =
      <PhotoLink photo={photo} prefetch={prefetch} />;

    return (
      <AppGrid
        containerRef={ref}
        className={className}
        contentMain={
          <div className={clsx(
            'space-y-5',
            // Plate margins: photobooks breathe
            isVolumes && 'max-w-3xl mx-auto',
          )}>
            <div className={clsx(
              'relative design-photo-frame',
              // Tategaki: vertical title beside the photo
              isTitlecard && hasTitle && 'flex gap-4 sm:gap-6',
            )}>
              {isTitlecard && hasTitle
                ? <>
                  <div className="grow min-w-0">
                    {renderMainImage}
                  </div>
                  <div className={clsx(
                    'shrink-0 [writing-mode:vertical-rl]',
                    'font-mincho font-bold tracking-[0.35em] text-xl',
                  )}>
                    {showTitleAsH1
                      ? <h1>{renderDesignedTitle}</h1>
                      : renderDesignedTitle}
                  </div>
                </>
                : renderMainImage}
              {isHijack && <>
                <span className={clsx(
                  'absolute top-0 left-0 size-4 z-10 pointer-events-none',
                  'border-t-2 border-l-2 border-(--d-focus)',
                )} />
                <span className={clsx(
                  'absolute top-0 right-0 size-4 z-10 pointer-events-none',
                  'border-t-2 border-r-2 border-(--d-focus)',
                )} />
                <span className={clsx(
                  'absolute bottom-0 left-0 size-4 z-10 pointer-events-none',
                  'border-b-2 border-l-2 border-(--d-focus)',
                )} />
                <span className={clsx(
                  'absolute bottom-0 right-0 size-4 z-10 pointer-events-none',
                  'border-b-2 border-r-2 border-(--d-focus)',
                )} />
              </>}
            </div>
            <div className={clsx(
              'space-y-2',
              isCentered && 'text-center',
            )}>
              <div className="float-end">
                {renderAdminMenu}
              </div>
              {isVolumes && photoYear &&
                <div
                  className="text-xs uppercase tracking-[0.25em]"
                  style={{ color: volumeInk }}
                >
                  {volumeLabelForYear(photoYear)}
                </div>}
              {(isIssue || isTitlecard) &&
                <PhotoDate
                  photo={photo}
                  className={clsx(
                    'block font-mono text-xs uppercase text-(--d-ink)',
                    isIssue ? 'tracking-[0.2em]' : 'tracking-[0.4em]',
                  )}
                  timezone={null}
                  hideTime={!SHOW_TAKEN_AT_TIME}
                />}
              {/* Titlecard shows the title vertically beside the photo */}
              {hasTitle && !isTitlecard && (showTitleAsH1
                ? <h1 className={designedTitleClassName}>
                  {renderDesignedTitle}
                </h1>
                : <div className={designedTitleClassName}>
                  {renderDesignedTitle}
                </div>)}
              {photo.caption &&
                <div className={clsx(
                  'text-medium',
                  isVolumes && 'font-serif italic',
                )}>
                  {photo.caption}
                </div>}
              {isHijack
                ? <div className={clsx(
                  'inline-block text-left',
                  'font-mono text-xs leading-relaxed text-(--d-ink)',
                )}>
                  <div>&gt; open {photo.id}.raw ... [OK]</div>
                  {showExifContent && exifLineValues.length > 0 &&
                    <div>&gt; exif: {exifLineValues.join(' ')} ... [OK]</div>}
                  {photo.film &&
                    <div>&gt; film: {photo.film} ... [OK]</div>}
                </div>
                : showExifContent && exifLineValues.length > 0 &&
                  <div className={clsx(
                    'font-mono text-xs uppercase',
                    isTitlecard
                      ? 'tracking-[0.3em] text-(--d-ink)'
                      : 'tracking-[0.15em] text-dim',
                  )}>
                    {exifLineValues.join(isTitlecard ? ' ▸ ' : ' · ')}
                  </div>}
              <div className={clsx(
                'flex flex-wrap items-center gap-x-4 gap-y-1 text-sm',
                isCentered && 'justify-center',
              )}>
                {showCameraContent &&
                  <PhotoCamera
                    camera={camera}
                    contrast="medium"
                    prefetch={prefetchRelatedLinks}
                  />}
                {showLensContent &&
                  <PhotoLens
                    lens={lens}
                    contrast="medium"
                    prefetch={prefetchRelatedLinks}
                  />}
                {showFilmContent && photo.film &&
                  <PhotoFilm
                    ref={refPhotoFilm}
                    film={photo.film}
                    make={photo.make}
                    prefetch={prefetchRelatedLinks}
                    {...photo.recipeData && !photo.recipeTitle && {
                      toggleRecipeOverlay,
                      isShowingRecipeOverlay,
                    }}
                  />}
                {showRecipeContent && recipeTitle &&
                  <PhotoRecipe
                    ref={refPhotoRecipe}
                    recipe={recipeTitle}
                    contrast="medium"
                    prefetch={prefetchRelatedLinks}
                    toggleRecipeOverlay={toggleRecipeOverlay}
                    isShowingRecipeOverlay={isShowingRecipeOverlay}
                  />}
                {showTagsContent &&
                  <PhotoTags
                    tags={tags}
                    contrast="medium"
                    prefetch={prefetchRelatedLinks}
                  />}
                {!(isIssue || isTitlecard) &&
                  <PhotoDate
                    photo={photo}
                    className="text-medium"
                    timezone={null}
                    hideTime={!SHOW_TAKEN_AT_TIME}
                  />}
                <div className="flex items-center gap-1">
                  {showZoomControls &&
                    <LoaderButton
                      tooltip={appText.tooltip.zoom}
                      icon={<LuExpand size={15} />}
                      onClick={() => refZoomControls.current?.open()}
                      styleAs="link"
                      className="text-medium"
                      hideFocusOutline
                    />}
                  {shouldShare &&
                    <ShareButton
                      tooltip={appText.tooltip.sharePhoto}
                      photo={photo}
                      recent={shouldShareRecents ? recent : undefined}
                      year={shouldShareYear ? year : undefined}
                      album={shouldShareAlbum ? album : undefined}
                      tag={shouldShareTag ? primaryTag : undefined}
                      camera={shouldShareCamera ? camera : undefined}
                      lens={shouldShareLens ? lens : undefined}
                      film={shouldShareFilm ? photo.film : undefined}
                      recipe={shouldShareRecipe ? recipeTitle : undefined}
                      focal={shouldShareFocalLength
                        ? photo.focalLength
                        : undefined}
                      prefetch={prefetchRelatedLinks}
                    />}
                  {ALLOW_PUBLIC_DOWNLOADS &&
                    <DownloadButton photo={photo} />}
                </div>
                {showStorageCheck &&
                  <AdminPhotoStorageCheck photo={photo} />}
              </div>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <AppGrid
      containerRef={ref}
      className={className}
      contentMain={renderMainImage}
      classNameSide="relative"
      sideHiddenOnMobile={false}
      contentSide={
        <div className="md:absolute inset-0 -mt-1">
          <MaskedScroll className="sticky top-4 self-start">
            <DivDebugBaselineGrid className={clsx(
              'grid grid-cols-2 md:grid-cols-1',
              'gap-x-0.5 sm:gap-x-1 gap-y-baseline',
              'mb-6 md:mb-4',
            )}>
              {/* Meta */}
              <div className="pr-3 md:pr-0">
                <div className="float-end hidden md:block">
                  {renderAdminMenu}
                </div>
                {hasTitle && (showTitleAsH1
                  ? <h1>{renderPhotoLink}</h1>
                  : renderPhotoLink)}
                <div className="space-y-baseline">
                  {photo.caption &&
                    <div className="uppercase">
                      {photo.caption}
                    </div>}
                  {(
                    showCameraContent ||
                    showLensContent ||
                    showRecipeContent ||
                    showTagsContent
                  ) &&
                    <div>
                      {(showCameraContent || showLensContent) &&
                        <div className="flex flex-col *:self-start">
                          {showCameraContent &&
                            <PhotoCamera
                              camera={camera}
                              contrast="medium"
                              prefetch={prefetchRelatedLinks}
                            />}
                          {showLensContent &&
                            <PhotoLens
                              lens={lens}
                              contrast="medium"
                              prefetch={prefetchRelatedLinks}
                            />}
                        </div>}
                      {showRecipeContent && recipeTitle &&
                        <PhotoRecipe
                          ref={refPhotoRecipe}
                          recipe={recipeTitle}
                          contrast="medium"
                          prefetch={prefetchRelatedLinks}
                          toggleRecipeOverlay={toggleRecipeOverlay}
                          isShowingRecipeOverlay={isShowingRecipeOverlay}
                        />}
                      {showTagsContent &&
                        <PhotoTags
                          tags={tags}
                          contrast="medium"
                          prefetch={prefetchRelatedLinks}
                        />}
                    </div>}
                </div>
              </div>
              {/* EXIF Data */}
              <div className={clsx(
                'space-y-baseline',
                !hasTitleContent && !hasMetaContent && 'md:-mt-baseline',
              )}>
                <div className="float-end md:hidden">
                  {renderAdminMenu}
                </div>
                {showExifContent &&
                  <>
                    <ul className="text-medium">
                      <li>
                        {photo.focalLength &&
                          <Link
                            href={pathForFocalLength(photo.focalLength)}
                            className="hover:text-main active:text-medium"
                          >
                            {photo.focalLengthFormatted}
                          </Link>}
                        {(
                          photo.focalLengthIn35MmFormatFormatted &&
                          // eslint-disable-next-line max-len
                          photo.focalLengthIn35MmFormatFormatted !== photo.focalLengthFormatted
                        ) &&
                          <>
                            {' '}
                            <Tooltip
                              content={appText.tooltip['35mm']}
                              sideOffset={3}
                              supportMobile
                            >
                              <span
                                className={clsx(
                                  'text-extra-dim',
                                  'decoration-dotted underline-offset-[3px]',
                                  'hover:underline',
                                )}
                              >
                                {photo.focalLengthIn35MmFormatFormatted}
                              </span>
                            </Tooltip>
                          </>}
                      </li>
                      <li>{photo.fNumberFormatted}</li>
                      <li>{photo.exposureTimeFormatted}</li>
                      <li>{photo.isoFormatted}</li>
                      {photo.exposureCompensationFormatted
                        ? <li>{photo.exposureCompensationFormatted}</li>
                        : ALWAYS_SHOW_EXPOSURE_COMP && <li>0ev</li>}
                    </ul>
                    {showFilmContent && photo.film &&
                      <PhotoFilm
                        ref={refPhotoFilm}
                        film={photo.film}
                        make={photo.make}
                        prefetch={prefetchRelatedLinks}
                        {...photo.recipeData && !photo.recipeTitle && {
                          toggleRecipeOverlay,
                          isShowingRecipeOverlay,
                        }}
                      />}
                  </>}
                <div className={clsx(
                  'flex gap-x-3 gap-y-baseline',
                  'md:flex-col flex-wrap',
                  'md:justify-normal',
                )}>
                  <PhotoDate
                    photo={photo}
                    className={clsx(
                      'text-medium',
                      // Prevent collision with admin button
                      !hasNonDateContent && isUserSignedIn && 'md:pr-7',
                    )}
                    // 'createdAt' is a naive datetime which does not require
                    // a timezone and will not cause server/client mismatch
                    timezone={null}
                    hideTime={!SHOW_TAKEN_AT_TIME}
                  />
                  <div className={clsx(
                    'flex gap-1 translate-y-[0.5px]',
                    'translate-x-[-2.5px]',
                  )}>
                    {showZoomControls &&
                      <LoaderButton
                        tooltip={appText.tooltip.zoom}
                        icon={<LuExpand size={15} />}
                        onClick={() => refZoomControls.current?.open()}
                        styleAs="link"
                        className="text-medium translate-y-[0.25px]"
                        hideFocusOutline
                      />}
                    {shouldShare &&
                      <ShareButton
                        tooltip={appText.tooltip.sharePhoto}
                        photo={photo}
                        recent={shouldShareRecents
                          ? recent
                          : undefined}
                        year={shouldShareYear
                          ? year
                          : undefined}
                        album={shouldShareAlbum
                          ? album
                          : undefined}
                        tag={shouldShareTag
                          ? primaryTag
                          : undefined}
                        camera={shouldShareCamera
                          ? camera
                          : undefined}
                        lens={shouldShareLens
                          ? lens
                          : undefined}
                        film={shouldShareFilm
                          ? photo.film
                          : undefined}
                        recipe={shouldShareRecipe
                          ? recipeTitle
                          : undefined}
                        focal={shouldShareFocalLength
                          ? photo.focalLength
                          : undefined}
                        prefetch={prefetchRelatedLinks}
                      />}
                    {ALLOW_PUBLIC_DOWNLOADS && 
                      <DownloadButton 
                        className="translate-y-[0.5px] md:translate-y-0"
                        photo={photo} 
                      />}
                  </div>
                  {showStorageCheck &&
                    <AdminPhotoStorageCheck photo={photo} />}
                </div>
              </div>
            </DivDebugBaselineGrid>
          </MaskedScroll>
        </div>}
    />
  );
};
