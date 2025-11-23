import React from 'react';

const HeaderSearch = ({ value, onChange, placeholder = 'Buscar...' }) => {
    return (
        <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.386-1.414 1.415-4.387-4.387zM8 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd"></path></svg>
            </div>
            <input
                type="text"
                value={value}
                onChange={onChange}
                className="block w-full p-2 pl-10 text-sm text-white border border-pr-gray rounded-lg bg-pr-dark focus:ring-pr-yellow focus:border-pr-yellow"
                placeholder={placeholder}
                aria-label={placeholder}
            />
        </div>
    );
};

export default HeaderSearch;
