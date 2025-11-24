import React from 'react';
import { Link } from 'react-router-dom';

const CTAButton = ({ to, onClick, children, className = '', type = 'button' }) => {
    // Combine the base button style with any additional classes passed in.
    const combinedClassName = `btn-primary ${className}`.trim();

    if (to) {
        return (
            <Link to={to} className={combinedClassName}>
                {children}
            </Link>
        );
    }

    return (
        <button type={type} onClick={onClick} className={combinedClassName}>
            {children}
        </button>
    );
};

export default CTAButton;
