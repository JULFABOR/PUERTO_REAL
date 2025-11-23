import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const SectionCard = ({
    to = '#',
    icon,
    title,
    description,
    className = '',
    onClick,
    children,
    ariaLabel
}) => {
    const baseClass = `card-base hover:shadow-pr-yellow/20 ${className}`.trim();
    const label = ariaLabel || title || 'section card';

    const content = (
        <>
            {icon}
            <h3 className="card-title">{title}</h3>
            <p className="text-pr-gray text-sm">{description}</p>
            {children}
        </>
    );

    if (onClick) {
        return (
            <button type="button" aria-label={label} onClick={onClick} className={baseClass}>
                {content}
            </button>
        );
    }

    const isLink = to && to !== '#';
    if (isLink) {
        return (
            <Link to={to} aria-label={label} className={baseClass}>
                {content}
            </Link>
        );
    }

    // Non-interactive container (useful for cards that are not links/buttons)
    return (
        <div role="group" aria-label={label} className={baseClass}>
            {content}
        </div>
    );
};

export default SectionCard;

SectionCard.propTypes = {
    to: PropTypes.string,
    icon: PropTypes.node,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    className: PropTypes.string,
    onClick: PropTypes.func,
    children: PropTypes.node,
    ariaLabel: PropTypes.string,
};
