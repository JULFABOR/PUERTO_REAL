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
                <div className="w-12 h-12 rounded-full bg-pr-yellow mr-4 flex-shrink-0">
                    {/* Placeholder for the logo */}
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
