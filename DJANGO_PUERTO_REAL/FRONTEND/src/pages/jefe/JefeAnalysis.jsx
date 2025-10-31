import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileExport,
    faCalendarDays,
    faDollarSign,
    faChartLine,
    faSort,
    faSortUp,
    faSortDown,
    faSpinner,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import Chart from 'react-apexcharts';
import { Datepicker } from 'flowbite-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';

// --- HELPER COMPONENT SORT INDICATOR ---
const SortIndicator = ({ direction }) => {
    if (!direction) return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-600 opacity-50" />;
    return direction === 'ascending'
        ? <FontAwesomeIcon icon={faSortUp} className="ml-1" />
        : <FontAwesomeIcon icon={faSortDown} className="ml-1" />;
};

const StatCard = ({ title, value, icon }) => (
    <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
        <div className="flex justify-between items-center">
            <div>
                <p className="text-sm text-pr-gray">{title}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
            </div>
            {icon && (
                <FontAwesomeIcon icon={icon} className="text-3xl text-pr-yellow opacity-30" />
            )}
        </div>
    </div>
);

const JefeAnalysis = () => {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    });
    const [endDate, setEndDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [summaryData, setSummaryData] = useState({
        totalSales: 0,
        grossProfit: 0,
    });

    const [salesByDay, setSalesByDay] = useState({
        options: {
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { bar: { borderRadius: 4, horizontal: false, columnWidth: '50%' } },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            xaxis: { categories: [], labels: { style: { colors: '#9CA3AF' } } },
            yaxis: { labels: { style: { colors: '#9CA3AF' }, formatter: (val) => `$${val.toLocaleString('es-AR')}` } },
            fill: { colors: ['#FFC700'] },
            tooltip: { theme: 'dark', y: { formatter: (val) => `$${val.toLocaleString('es-AR')}` } },
            grid: { borderColor: '#374151' },
            theme: { mode: 'dark' }
        },
        series: [{ name: 'Ventas', data: [] }]
    });

    const [salesByCategory, setSalesByCategory] = useState({
        options: {
            chart: { type: 'donut', height: 250 },
            labels: [],
            plotOptions: { pie: { donut: { size: '65%' } } },
            fill: { colors: ['#FFC700', '#FBBF24', '#F59E0B', '#D97706', '#B45309', '#78350F'] },
            stroke: { show: false },
            legend: { position: 'bottom', horizontalAlign: 'center', labels: { colors: '#9CA3AF' } },
            theme: { mode: 'dark' }
        },
        series: []
    });
    
    
    const [productProfitability, setProductProfitability] = useState([]);

    const [sortConfig, setSortConfig] = useState({ key: 'margin', direction: 'descending' });

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig.key === key) {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };
    
    const formatDate = (date) => date.toISOString().split('T')[0];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = formatDate(endDate);

            try {
                const [financialData, productTrendsData] = await Promise.all([
                    
                    // --- CORREGIDO ---
                    // Asumiendo que tu URL principal es /api/analisis/
                    // y la URL de tu app es report/financial/
                    apiClient(`/api/analisis/report/financial/?start_date=${formattedStartDate}&end_date=${formattedEndDate}`),
                    
                    // --- CORREGIDO ---
                    // Asumiendo que tu URL principal es /api/analisis/
                    // y la URL de tu app es report/product-sales-trends/
                    apiClient(`/api/analisis/report/product-sales-trends/?start_date=${formattedStartDate}&end_date=${formattedEndDate}`)
                
                ]);

                // (Lógica de seteo de datos)
                setSummaryData({
                    totalSales: financialData.total_income || 0,
                    grossProfit: financialData.net_income || 0,
                });

                const salesChartData = financialData.time_series_data || [];
                setSalesByDay(prev => ({
                    ...prev,
                    options: { ...prev.options, xaxis: { ...prev.options.xaxis, categories: salesChartData.map(d => new Date(d.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })) } },
                    series: [{ name: 'Ventas', data: salesChartData.map(d => d.income) }]
                }));

                const categoryChartData = productTrendsData.category_performance || [];
                setSalesByCategory(prev => ({
                    ...prev,
                    options: { ...prev.options, labels: categoryChartData.map(c => c.producto_det_vent__categoria_producto__nombre_categoria) },
                    series: categoryChartData.map(c => c.total_revenue_category)
                }));

                setProductProfitability(financialData.top_products || []);

            } catch (err) {
                // --- MANEJO DE ERROR MEJORADO ---
                let errorMsg = 'No se pudieron cargar todos los datos del reporte.';
                if (err.message && err.message.includes('JSON')) {
                    errorMsg = "Error: El servidor respondió con HTML en lugar de JSON. Verifica las URLs de la API.";
                } else if (err.data?.detail) {
                    errorMsg = err.data.detail;
                } else if (err.message) {
                    errorMsg = err.message;
                }
                
                setError(errorMsg);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [startDate, endDate]);

    const sortedProductProfitability = useMemo(() => {
        let sortedProducts = [...productProfitability];
        if (sortConfig.key) {
            sortedProducts.sort((a, b) => {
                let aValue = a[sortConfig.key] || 0;
                let bValue = b[sortConfig.key] || 0;
                
                if (sortConfig.key === 'producto_det_vent__nombre_producto') {
                    aValue = a[sortConfig.key] || '';
                    bValue = b[sortConfig.key] || '';
                    const comparison = aValue.localeCompare(bValue);
                    return sortConfig.direction === 'ascending' ? comparison : -comparison;
                }
                
                return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
            });
        }
        return sortedProducts;
    }, [productProfitability, sortConfig]);

    const exportToPDF = () => {
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);
        
        // --- ¡OJO! REVISAR ESTA URL ---
        // La ruta '/analisis/api/reporte/analisis-pdf/' NO EXISTE en tu urls.py
        // Debes crearla en Django y luego poner la URL correcta aquí.
        // La URL correcta probablemente sea algo como:
        // const pdfUrl = `/api/analisis/reporte/analisis-pdf/?start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
        
        const pdfUrl = `/analisis/api/reporte/analisis-pdf/?start_date=${formattedStartDate}&end_date=${formattedEndDate}`; // <-- URL PROBABLEMENTE INCORRECTA
        
        toast.error("La exportación a PDF aún no está configurada. Revisa la URL en Django.");
        // window.open(pdfUrl, '_blank'); // <-- Descomentar cuando la URL sea correcta
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Reportes de Venta</h1>
                <button onClick={exportToPDF} className="w-full sm:w-auto text-white bg-pr-dark hover:bg-gray-700 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2 border border-gray-700">
                    <FontAwesomeIcon icon={faFileExport} />
                    <span>Exportar a PDF</span>
                </button>
            </div>

            {/* --- Filtros de Fecha --- */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
                <div className="w-full md:w-auto">
                    <Datepicker
                        language="es-ES"
                        label="Fecha de inicio"
                        value={startDate.toLocaleDateString('es-ES')}
                        onSelectedDateChanged={date => setStartDate(date)}
                    />
                </div>
                <span className="mx-4 text-gray-400 hidden md:block">a</span>
                <div className="w-full md:w-auto">
                    <Datepicker
                        language="es-ES"
                        label="Fecha de fin"
                        value={endDate.toLocaleDateString('es-ES')}
                        onSelectedDateChanged={date => setEndDate(date)}
                    />
                </div>
            </div>

            {/* --- Estados de Carga y Error --- */}
            {loading && (
                <div className="flex justify-center items-center h-64 text-pr-yellow">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl" />
                </div>
            )}
            
            {error && !loading && (
                <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center" role="alert">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3 text-red-400" />
                    <div>
                        <strong className="font-bold">Error al cargar el reporte:</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* --- StatCards con Iconos --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard 
                            title="Ventas Totales" 
                            value={formatCurrency(summaryData.totalSales)} 
                            icon={faDollarSign}
                        />
                        <StatCard 
                            title="Ganancia Bruta" 
                            value={formatCurrency(summaryData.grossProfit)} 
                            icon={faChartLine}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                                <h2 className="text-xl font-bold text-white mb-4">Ventas por Día</h2>
                                <Chart options={salesByDay.options} series={salesByDay.series} type="bar" height={350} />
                            </div>
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                                <h2 className="text-xl font-bold text-white mb-4">Ventas por Categoría</h2>
                                <Chart options={salesByCategory.options} series={salesByCategory.series} type="donut" height={250} />
                            </div>
                        </div>
                    </div>

                    {/* --- Tabla de Rentabilidad Ordenable --- */}
                    <div className="mt-8 bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                        <h2 className="text-2xl font-bold text-white mb-4">Rentabilidad por Producto</h2>
                        <div className="relative overflow-x-auto rounded-lg">
                            <table className="w-full text-sm text-left text-gray-400">
                                
                                {/* --- SECCIÓN CORREGIDA --- */}
                                <thead className="text-xs text-white uppercase bg-pr-dark-gray border-b border-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-700" onClick={() => requestSort('producto_det_vent__nombre_producto')}>
                                            <div className="flex items-center">
                                                Producto <SortIndicator direction={sortConfig.key === 'producto_det_vent__nombre_producto' ? sortConfig.direction : null} />
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center cursor-pointer hover:bg-gray-700" onClick={() => requestSort('total_quantity_sold')}>
                                            <div className="flex items-center justify-center">
                                                Uds. Vendidas <SortIndicator direction={sortConfig.key === 'total_quantity_sold' ? sortConfig.direction : null} />
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right hidden sm:table-cell cursor-pointer hover:bg-gray-700" onClick={() => requestSort('total_revenue')}>
                                            <div className="flex items-center justify-end">
                                                Ingresos <SortIndicator direction={sortConfig.key === 'total_revenue' ? sortConfig.direction : null} />
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right hidden md:table-cell cursor-pointer hover:bg-gray-700" onClick={() => requestSort('cogs')}>
                                            <div className="flex items-center justify-end">
                                                Costo Total <SortIndicator direction={sortConfig.key === 'cogs' ? sortConfig.direction : null} />
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right cursor-pointer hover:bg-gray-700" onClick={() => requestSort('margin')}>
                                            <div className="flex items-center justify-end">
                                                Ganancia Bruta <SortIndicator direction={sortConfig.key === 'margin' ? sortConfig.direction : null} />
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right hidden lg:table-cell">Margen</th>
                                    </tr>
                                </thead> 
                                <tbody className="divide-y divide-gray-700">
                                    {sortedProductProfitability.map(product => (
                                        <tr key={product.producto_det_vent__nombre_producto} className="border-b bg-pr-dark hover:bg-pr-dark-gray">
                                            <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap text-white">{product.producto_det_vent__nombre_producto}</th>
                                            <td className="px-6 py-4 text-center">{product.total_quantity_sold}</td>
                                            <td className="px-6 py-4 text-right hidden sm:table-cell">{formatCurrency(product.total_revenue)}</td>
                                            <td className="px-6 py-4 text-right hidden md:table-cell">{formatCurrency(product.cogs)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-pr-yellow">{formatCurrency(product.margin)}</td>
                                            <td className="px-6 py-4 text-right hidden lg:table-cell">{((product.margin / product.total_revenue) * 100 || 0).toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default JefeAnalysis;