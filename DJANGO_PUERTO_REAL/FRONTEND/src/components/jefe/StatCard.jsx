import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const StatCard = ({ icon, title, value, change, changeType }) => {
    const isPositive = changeType === 'positive';
    const changeColor = isPositive ? 'text-green-400' : 'text-red-400';

    return (
        <div className="bg-pr-dark p-6 rounded-xl border border-pr-gray/20 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-400">{title}</h4>
                <FontAwesomeIcon icon={icon} className="text-pr-yellow text-2xl" />
            </div>
            <div>
                <p className="text-3xl font-bold text-white">{value}</p>
                {change && (
                    <p className={`text-sm ${changeColor}`}>
                        {isPositive ? '▲' : '▼'} {change}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatCard;
