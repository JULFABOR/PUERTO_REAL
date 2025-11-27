import React, { useEffect, useState } from 'react';
import apiClient from '@/api/apiClient';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import PromoCard from '@/components/shared/PromoCard'; // Reusing PromoCard for product display
import { useSearch } from '@/contexts/SearchContext'; // Import useSearch

const ClienteProductos = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { searchTerm } = useSearch(); // Get searchTerm from context

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const url = searchTerm
                    ? `/stock/productos/?search=${encodeURIComponent(searchTerm)}`
                    : '/stock/productos/';
                const response = await apiClient.get(url);
                setProducts(response.data);
            } catch (error) {
                console.error('Error fetching products:', error);
                toast.error('Error al cargar productos.');
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchTerm]); // Add searchTerm to dependency array

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-white mb-6">Nuestro Catálogo de Productos</h1>

            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-pr-yellow" />
                </div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <PromoCard
                            key={product.id || product.pk}
                            title={product.nombre_producto}
                            description={product.descripcion || 'Sin descripción'}
                            icon={<FontAwesomeIcon icon={faBoxOpen} className="text-pr-yellow text-5xl" />}
                            // Assuming you might want a detail page for products later
                            to={`/cliente/producto/${product.id || product.pk}`} // Placeholder link
                            ctaText="Ver Detalles"
                        />
                    ))}
                </div>
            ) : (
                <p className="text-pr-gray text-center">No hay productos disponibles en este momento.</p>
            )}
        </div>
    );
};

export default ClienteProductos;