import React, { useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  aspectRatio?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images, 
  alt, 
  className,
  aspectRatio = "aspect-[4/5]"
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleError = (index: number) => {
    setImgError(prev => ({ ...prev, [index]: true }));
  };

  const validImages = images && images.length > 0 ? images : [];
  
  // Direct placeholder link (NO PROXY)
  const placeholder = "https://img-wrapper.vercel.app/image?url=https://placehold.co/600x800/1e293b/FFF?text=No+Image";

  if (validImages.length === 0) {
    return (
      <div className={cn("relative overflow-hidden w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center", aspectRatio, className)}>
        <div className="text-center text-gray-400">
            <ImageOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <span className="text-xs font-medium">No Image</span>
        </div>
      </div>
    );
  }

  if (validImages.length === 1) {
    return (
      <div className={cn("relative overflow-hidden w-full h-full bg-gray-100 dark:bg-gray-800", aspectRatio, className)}>
        <img 
          src={imgError[0] ? placeholder : validImages[0]} 
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          onError={() => handleError(0)}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative group w-full h-full bg-gray-100 dark:bg-gray-800", aspectRatio, className)}>
      <div className="overflow-hidden w-full h-full" ref={emblaRef}>
        <div className="flex w-full h-full">
          {validImages.map((src, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 relative h-full">
              <img 
                src={imgError[index] ? placeholder : src} 
                alt={`${alt} ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                onError={() => handleError(index)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={scrollPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 z-10"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 z-10"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
        {validImages.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all shadow-sm",
              index === selectedIndex ? "bg-white scale-110" : "bg-white/50"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
