import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const PromoCard = ({ promotion, to, icon, title, description, points, ctaText = 'Ver Detalles', onClick, disabled = false, className = '' }) => {
    // Normalize props: if `promotion` object is provided, map its fields to the UI props
    let finalTo = to;
    let finalIcon = icon;
    let finalTitle = title;
    let finalDescription = description;
    let finalPoints = points;
    let finalCta = ctaText;

    if (promotion) {
        const {
            id_promo_desc,
            nombre_promo_desc,
            descripcion_promo_desc,
            puntos_requeridos_promo_desc,
            descuento_porcentaje_promo_desc,
            descuento_monto_promo_desc,
            image,
        } = promotion;

        finalTo = finalTo || `/promociones/${id_promo_desc || promotion.id}`;
        finalTitle = finalTitle || nombre_promo_desc || promotion.nombre || 'Promoción';
        finalDescription = finalDescription || descripcion_promo_desc || promotion.descripcion || '';
        finalPoints = finalPoints !== undefined ? finalPoints : (puntos_requeridos_promo_desc != null ? `${puntos_requeridos_promo_desc} Puntos` : undefined);
        finalCta = ctaText || 'Canjear';

        // If no explicit icon provided, use the image as an icon (small avatar) or a placeholder
        if (!finalIcon) {
            const src = image || promotion.image || 'https://via.placeholder.com/80x80.png?text=%F0%9F%8D%BA';
            finalIcon = <img src={src} alt={finalTitle} className="mx-auto w-20 h-20 object-cover rounded-full mb-4" />;
        }
    }

    const iconNode = typeof finalIcon === 'function' || React.isValidElement(finalIcon) ? (React.isValidElement(finalIcon) ? finalIcon : React.createElement(finalIcon)) : finalIcon;

    const body = (
        <div className="flex flex-col justify-between h-full">
            <div>
                <div className="text-pr-yellow text-5xl mb-4">{iconNode}</div>
                <h3 className="text-xl font-bold text-white mb-2">{finalTitle}</h3>
                <p className="text-pr-gray mb-4">{finalDescription}</p>
            </div>
            <div>
                {finalPoints !== undefined && <div className="text-2xl font-semibold text-pr-yellow mb-4">{finalPoints}</div>}
                {finalTo ? (
                    <Link to={finalTo} className="w-full inline-block bg-pr-dark-gray text-white font-bold py-2 px-4 rounded-lg hover:bg-pr-yellow hover:text-pr-dark transition-colors duration-300 text-center">
                        {finalCta}
                    </Link>
                ) : (
                    <button
                        onClick={onClick}
                        disabled={disabled}
                        className={`w-full bg-pr-dark-gray text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-pr-yellow hover:text-pr-dark'}`}>
                        {disabled ? (
                            <span className="inline-flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                                <span>{finalCta}</span>
                            </span>
                        ) : (
                            finalCta
                        )}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className={`bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20 text-center flex flex-col justify-between ${className}`}>
            {body}
        </div>
    );
};

PromoCard.propTypes = {
    promotion: PropTypes.object,
    to: PropTypes.string,
    icon: PropTypes.node,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    points: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ctaText: PropTypes.string,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    className: PropTypes.string,
};

export default PromoCard;
