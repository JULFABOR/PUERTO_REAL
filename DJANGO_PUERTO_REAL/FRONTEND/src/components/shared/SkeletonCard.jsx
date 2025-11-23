import React from 'react';

const SkeletonCard = ({ className = '' }) => {
    return (
        <div className={`card-base animate-pulse ${className}`.trim()}>
            <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gray-600 rounded-full" />
                <div className="flex-1">
                    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-600 rounded w-1/2" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-gray-600 rounded w-5/6" />
                <div className="h-3 bg-gray-600 rounded w-2/3" />
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="h-8 bg-gray-600 rounded w-32 ml-auto" />
            </div>
        </div>
    );
};

export default SkeletonCard;
