import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const SearchContext = createContext();

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const q = queryParams.get('q');
        setSearchTerm(q || '');
    }, [location.search]);

    const handleSearchSubmit = (term) => {
        const trimmedTerm = term.trim();
        if (trimmedTerm) {
            navigate(`/cliente/search?q=${encodeURIComponent(trimmedTerm)}`);
        } else {
            // If search term is empty, navigate to products page without search query
            navigate('/cliente/productos');
        }
    };

    // This function can be used by the search input in ClienteLayout
    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // This function can be used when the user presses Enter in the search input
    const triggerSearchFromInput = (term) => {
        handleSearchSubmit(term);
    };


    return (
        <SearchContext.Provider value={{ searchTerm, setSearchTerm, handleSearchSubmit, handleSearchInputChange, triggerSearchFromInput }}>
            {children}
        </SearchContext.Provider>
    );
};
