import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';

const ProductImage = ({ 
    imagenProducto, 
    imagenUrl, 
    nombreProducto, 
    className = '',
    showPlaceholder = true 
}) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    // Función para obtener la URL correcta de la imagen
    const getImageUrl = () => {
        // Prioridad 1: imagen_url (URL completa del backend)
        if (imagenUrl) {
            return imagenUrl;
        }
        
        // Prioridad 2: imagen_producto (puede ser relativa o absoluta)
        if (imagenProducto) {
            // Si ya es una URL completa (empieza con http/https)
            if (imagenProducto.startsWith('http')) {
                return imagenProducto;
            }
            
            // Si es una ruta relativa, construir URL completa
            // Asegurarse de que empiece con /
            const path = imagenProducto.startsWith('/') ? imagenProducto : `/${imagenProducto}`;
            return `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}${path}`;
        }
        
        return null;
    };

    const imageUrl = getImageUrl();
    const shouldShowImage = imageUrl && !imageError;

    const handleImageLoad = () => {
        setImageLoading(false);
    };

    const handleImageError = () => {
        setImageError(true);
        setImageLoading(false);
        console.error(`Error al cargar imagen: ${imageUrl}`);
    };

    return (
        <div className={`relative overflow-hidden bg-pr-dark-gray ${className}`}>
            {shouldShowImage ? (
                <>
                    {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-pr-dark-gray">
                            <div className="animate-pulse">
                                <FontAwesomeIcon icon={faImage} className="text-gray-600 text-4xl" />
                            </div>
                        </div>
                    )}
                    <img
                        src={imageUrl}
                        alt={nombreProducto || 'Producto'}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                            imageLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        loading="lazy"
                    />
                </>
            ) : showPlaceholder ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <FontAwesomeIcon 
                        icon={faImage} 
                        className="text-gray-600 text-5xl mb-2" 
                    />
                    <span className="text-gray-400 text-xs text-center px-2">
                        Sin imagen
                    </span>
                </div>
            ) : null}
        </div>
    );
};

export default ProductImage;