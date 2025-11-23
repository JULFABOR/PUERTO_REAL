import React from 'react';
import { Link } from 'react-router-dom';

const CTAButton = ({ to, onClick, children, className = '', type = 'button' }) => {
    const base = `inline-block font-bold py-2 px-4 rounded-lg transition-colors ${className}`;
    if (to) {
        return (
            <Link to={to} className={`${base} bg-pr-dark-gray text-white hover:bg-pr-yellow hover:text-pr-dark text-center`}>
                {children}
            </Link>
        );
    }
    return (
        <button type={type} onClick={onClick} className={`${base} bg-pr-dark-gray text-white hover:bg-pr-yellow hover:text-pr-dark`}>
            {children}
        </button>
    );
};

export default CTAButton;
