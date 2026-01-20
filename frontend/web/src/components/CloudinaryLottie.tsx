import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Image } from 'lucide-react';

interface CloudinaryLottieProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
  loop?: boolean;
  autoplay?: boolean;
  fallbackColor?: string;
}

/**
 * Component to render Lottie animations from Cloudinary URLs
 * Fetches the JSON data and renders using lottie-react
 */
export default function CloudinaryLottie({
  src,
  alt = 'Animation',
  className = '',
  style = {},
  width = 64,
  height = 64,
  loop = true,
  autoplay = true,
  fallbackColor = '#6B7280',
}: CloudinaryLottieProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }

    const fetchAnimation = async () => {
      try {
        setLoading(true);
        setError(false);

        // Ensure URL is valid and uses https
        let url = src;
        if (!url.startsWith('http')) {
          url = `https://${url}`;
        } else if (url.startsWith('http://')) {
          url = url.replace('http://', 'https://');
        }

        // For Cloudinary URLs, add dl=1 parameter to force download as JSON
        if (url.includes('cloudinary.com')) {
          url = url.includes('?') ? `${url}&dl=1` : `${url}?dl=1`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setAnimationData(data);
      } catch (err) {
        console.error('[CloudinaryLottie] Error fetching animation:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimation();
  }, [src]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-gray-100 animate-pulse ${className}`}
        style={{ width, height, ...style }}
        title={`Loading ${alt}...`}
      />
    );
  }

  if (error || !animationData) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-gray-100 ${className}`}
        style={{ width, height, ...style }}
        title={alt}
      >
        <Image
          size={typeof width === 'number' ? width * 0.4 : 24}
          color={fallbackColor}
        />
      </div>
    );
  }

  return (
    <div className={className} style={{ width, height, ...style }}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
