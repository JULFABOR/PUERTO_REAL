import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';

/**
 * ProductImage
 * - Lazy-loads images using IntersectionObserver
 * - Shows an animated skeleton placeholder while loading
 * - Handles data-URI/base64 and relative media paths from backend
 * - Falls back to an icon when the image fails to load
 */
const ProductImage = ({ 
  imagenProducto, 
  imagenUrl, 
  nombreProducto = 'Producto',
  className = 'w-full h-48',
  showPlaceholder = true,
  eager = false,
  apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
}) => {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(eager);
  const [imgSrc, setImgSrc] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const computeUrl = () => {
    let image = imagenUrl || imagenProducto || null;
    if (!image) return null;

    if (typeof image === 'string' && (image.startsWith('data:') || image.includes('base64,'))) {
      return image;
    }

    if (typeof image === 'string' && !image.startsWith('http')) {
      const base = apiUrl.replace(/\/api\/?$/, '');
      if (image.startsWith('/')) image = `${base}${image}`;
      else if (image.includes('/media/')) image = `${base}/${image}`.replace(/([^:])\/\//g, '$1/');
      else image = `${base}/media/${image}`;
    }
    return image;
  };

  useEffect(() => {
    if (inView) {
      const final = computeUrl();
      setImgSrc(final);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, imagenProducto, imagenUrl]);

  useEffect(() => {
    if (eager) return;
    if (!containerRef.current) return;
    if (inView) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      });
    }, { rootMargin: '200px' });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [eager, inView]);

  const finalSrc = imgSrc;

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className} bg-pr-dark-gray rounded-t-lg`}>
      {!finalSrc && showPlaceholder && (
        <div className={`absolute inset-0 flex items-center justify-center animate-pulse bg-gradient-to-r from-gray-800 to-gray-700`}>
          <FontAwesomeIcon icon={faImage} className="text-gray-600 text-2xl" />
        </div>
      )}

      {finalSrc && !hasError && (
        <img
          src={finalSrc}
          alt={nombreProducto}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}

      {hasError && showPlaceholder && (
        <div className={`absolute inset-0 flex items-center justify-center bg-pr-dark-gray`}>
          <FontAwesomeIcon icon={faImage} className="text-gray-500 text-2xl" />
        </div>
      )}
    </div>
  );
};

export default ProductImage;
