import { useState, useEffect } from 'react';
import SVG from 'react-inlinesvg';

interface CloudinarySVGProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
  fallbackColor?: string;
}

/**
 * Component to render SVG files from Cloudinary URLs
 * Uses react-inlinesvg for proper SVG rendering with inline support
 */
export default function CloudinarySVG({
  src,
  alt = 'SVG Icon',
  className = '',
  style = {},
  width = 48,
  height = 48,
  fallbackColor = '#6B7280',
}: CloudinarySVGProps) {
  const [error, setError] = useState(false);
  const [validatedSrc, setValidatedSrc] = useState<string>('');

  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }

    // Ensure URL is valid and uses https
    let url = src;
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    } else if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }

    setValidatedSrc(url);
    setError(false);
  }, [src]);

  if (error || !validatedSrc) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-gray-100 ${className}`}
        style={{ width, height, ...style }}
        title={alt}
      >
        <svg
          width={typeof width === 'number' ? width * 0.5 : 24}
          height={typeof height === 'number' ? height * 0.5 : 24}
          viewBox="0 0 24 24"
          fill="none"
          stroke={fallbackColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <SVG
      src={validatedSrc}
      width={width}
      height={height}
      className={className}
      style={style}
      title={alt}
      onError={() => setError(true)}
      loader={
        <div
          className={`flex items-center justify-center rounded-lg bg-gray-100 animate-pulse ${className}`}
          style={{ width, height, ...style }}
        />
      }
    />
  );
}
