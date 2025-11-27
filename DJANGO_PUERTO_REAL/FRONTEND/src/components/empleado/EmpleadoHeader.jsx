import React from 'react';
import PropTypes from 'prop-types';

const EmpleadoHeader = ({
    title = 'Panel de Control',
    subtitle,
    right,
    className = '',
    containerProps = {}
}) => {
    return (
        <header
            {...containerProps}
            className={`mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
        >
            <div className="flex items-center">
                <div className="w-12 h-12 rounded-full mr-4 flex-shrink-0 flex items-center justify-center shadow-lg">
                    <img 
                        src="/logo1.jpg" 
                        alt="Puerto Real Logo" 
                        className="h-full w-full object-cover rounded-full border-2 border-pr-yellow"
                    />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">{title}</h1>
                    {subtitle && <p className="text-pr-gray text-sm mt-1">{subtitle}</p>}
                </div>
            </div>
            {right && <div className="mt-4 sm:mt-0">{right}</div>}
        </header>
    );
};

export default EmpleadoHeader;

EmpleadoHeader.propTypes = {
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    right: PropTypes.node,
    className: PropTypes.string,
    containerProps: PropTypes.object,
};
