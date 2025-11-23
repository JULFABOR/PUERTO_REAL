import React from 'react';

const Card = ({ children, className = '', ...props }) => {
    return (
        <div className={`bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20 ${className}`} {...props}>
            {children}
        </div>
    );
};

export default Card;
