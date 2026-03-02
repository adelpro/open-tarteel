import CLoseButton from '../close-button';
import BookmarkButton from '../player-controls/bookmark-button';
import DownloadButton from '../player-controls/download-button';

export default function FeaturedControls() {
  return (
    <div className="absolute end-4 top-4 hidden items-center gap-4 sm:end-8 sm:flex">
      <BookmarkButton />
      <DownloadButton />
      <CLoseButton />
    </div>
  );
}
