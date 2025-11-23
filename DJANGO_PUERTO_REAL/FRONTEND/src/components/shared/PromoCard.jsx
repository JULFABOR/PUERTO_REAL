import React from 'react';
import { Link } from 'react-router-dom';

const PromoCard = ({ to, icon, title, description, points, ctaText = 'Ver Detalles', onClick, disabled = false, className = '' }) => {
    const iconNode = typeof icon === 'function' || React.isValidElement(icon) ? (React.isValidElement(icon) ? icon : React.createElement(icon)) : icon;

    const body = (
        <div className="flex flex-col justify-between h-full">
            <div>
                <div className="text-pr-yellow text-5xl mb-4">{iconNode}</div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-pr-gray mb-4">{description}</p>
            </div>
            <div>
                {points !== undefined && <div className="text-2xl font-semibold text-pr-yellow mb-4">{points}</div>}
                {to ? (
                    <Link to={to} className="w-full inline-block bg-pr-dark-gray text-white font-bold py-2 px-4 rounded-lg hover:bg-pr-yellow hover:text-pr-dark transition-colors duration-300 text-center">
                        {ctaText}
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
                                <span>{ctaText}</span>
                            </span>
                        ) : (
                            ctaText
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

export default PromoCard;
