'use client';

import { clsx } from 'clsx/lite';
import AnimateItems from '@/components/AnimateItems';
import { Photo } from '.';
import PhotoLarge from './PhotoLarge';
import { RevalidatePhoto } from './InfinitePhotoScroll';
import { useAppState } from '@/app/AppState';
import { isDesignApplied } from '@/design';

export default function PhotosLarge({
  photos,
  animate = true,
  prefetchFirstPhotoLinks,
  onLastPhotoVisible,
  revalidatePhoto,
  showStorageCheck,
}: {
  photos: Photo[]
  animate?: boolean
  prefetchFirstPhotoLinks?: boolean
  onLastPhotoVisible?: () => void
  revalidatePhoto?: RevalidatePhoto
  showStorageCheck?: boolean
}) {
  const { design } = useAppState();

  const isDesigned = isDesignApplied(design);

  return (
    <AnimateItems
      className={clsx(
        design === 'volumes' && 'space-y-14 md:space-y-24',
        design === 'issue' && 'design-feed-rules space-y-10 md:space-y-14',
        design === 'titlecard' && 'space-y-12 md:space-y-16',
        design === 'hijack' && 'design-feed-rules space-y-8 md:space-y-10',
        !isDesigned && 'space-y-1',
      )}
      type={animate && !isDesigned ? 'scale' : 'none'}
      duration={0.7}
      staggerDelay={0.15}
      distanceOffset={0}
      staggerOnFirstLoadOnly
      items={photos.map((photo, index) =>
        <PhotoLarge
          key={photo.id}
          photo={photo}
          priority={index <= 1}
          prefetchRelatedLinks={prefetchFirstPhotoLinks && index === 0}
          revalidatePhoto={revalidatePhoto}
          shouldZoomOnFKeydown={false}
          onVisible={index === photos.length - 1
            ? onLastPhotoVisible
            : undefined}
          showStorageCheck={showStorageCheck}
        />)}
      itemKeys={photos.map(photo => photo.id)}
    />
  );
}
