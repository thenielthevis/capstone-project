import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SessionPreview from './SessionPreview';

interface PostMediaCarouselProps {
  post: {
    _id: string;
    images?: string[];
    reference?: {
      item_id: any;
      item_type: 'GeoSession' | 'ProgramSession' | 'FoodLog' | 'Post';
    };
  };
  onImageClick?: (index: number) => void;
  onSessionClick?: () => void;
}

export default function PostMediaCarousel({ post, onImageClick, onSessionClick }: PostMediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Build media items array
  const mediaItems: { type: 'reference' | 'image'; data: any }[] = [];
  if (post.reference?.item_id) {
    mediaItems.push({ type: 'reference', data: post.reference });
  }
  if (post.images) {
    post.images.forEach((img) => mediaItems.push({ type: 'image', data: img }));
  }

  if (mediaItems.length === 0) return null;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : prev));
  };

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
  };

  const handleMediaClick = () => {
    const currentItem = mediaItems[activeIndex];
    if (currentItem.type === 'reference' && onSessionClick) {
      onSessionClick();
    } else if (currentItem.type === 'image' && onImageClick) {
      // Calculate the actual image index (excluding reference)
      const imageIndex = post.reference?.item_id ? activeIndex - 1 : activeIndex;
      onImageClick(imageIndex);
    }
  };

  return (
    <div className="relative mt-2" style={{ height: 350 }}>
      {/* Carousel Container */}
      <div className="relative w-full h-full overflow-hidden rounded-xl">
        {/* Current Item */}
        <div
          className="w-full h-full cursor-pointer"
          onClick={handleMediaClick}
        >
          {mediaItems[activeIndex].type === 'reference' ? (
            <div className="w-full h-full flex items-center justify-center">
              <SessionPreview
                reference={mediaItems[activeIndex].data}
                fullWidth
              />
            </div>
          ) : (
            <img
              src={mediaItems[activeIndex].data}
              alt={`Media ${activeIndex + 1}`}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Navigation Arrows */}
        {mediaItems.length > 1 && (
          <>
            {activeIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition hover:opacity-90"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}
            {activeIndex < mediaItems.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition hover:opacity-90"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}
          </>
        )}

        {/* Indicator Badge */}
        {mediaItems.length > 1 && (
          <div
            className="absolute top-4 right-4 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          >
            <span className="text-white text-sm font-medium">
              {mediaItems[activeIndex].type === 'reference'
                ? 'Cover'
                : `${post.reference?.item_id ? activeIndex : activeIndex + 1} / ${post.images?.length || 0}`}
            </span>
          </div>
        )}

        {/* Dot Indicators */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {mediaItems.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDotClick(idx);
                }}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: idx === activeIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  transform: idx === activeIndex ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
