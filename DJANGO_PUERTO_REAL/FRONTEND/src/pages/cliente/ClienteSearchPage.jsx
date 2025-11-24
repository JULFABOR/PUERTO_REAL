import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import PromoCard from '@/components/shared/PromoCard'; // Assuming PromoCard can display products
import { useSearch } from '@/contexts/SearchContext';
const ClienteSearchPage = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const { searchTerm } = useSearch(); // Get searchTerm from context

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!searchTerm) {
                setSearchResults([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Assuming there's an API endpoint for product search
                // You might need to adjust this endpoint and parameter based on your backend
                const response = await apiClient.get(`/control_stock/productos/?search=${encodeURIComponent(searchTerm)}`);
                setSearchResults(response.data);
            } catch (error) {
                console.error('Error fetching search results:', error);
                toast.error('Error al buscar productos.');
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [searchTerm]); // Depend on searchTerm from context

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-white mb-6">Resultados de Búsqueda para "{searchTerm}"</h1>

            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-pr-yellow" />
                </div>
            ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchResults.map((product) => (
                        <PromoCard
                            key={product.id || product.pk}
                            title={product.nombre_producto}
                            description={product.descripcion || 'Sin descripción'}
                            icon={<FontAwesomeIcon icon={faBoxOpen} className="text-pr-yellow text-5xl" />}
                            // You might want to adjust the 'to' link based on your product detail page
                            // For now, let's just make it a placeholder
                            to={`/cliente/producto/${product.id || product.pk}`}
                            ctaText="Ver Producto"
                        />
                    ))}
                </div>
            ) : (
                <p className="text-pr-gray text-center">No se encontraron productos que coincidan con "{searchTerm}".</p>
            )}
        </div>
    );
};

export default ClienteSearchPage;
