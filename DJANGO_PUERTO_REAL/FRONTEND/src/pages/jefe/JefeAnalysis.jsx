import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import apiClient from '@/api/apiClient'; // Nuestra instancia de Axios

// --- HELPER COMPONENT SORT INDICATOR (Sin cambios) ---
const SortIndicator = ({ direction }) => {
    if (!direction) return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-600 opacity-50" />;
    return direction === 'ascending'
        ? <FontAwesomeIcon icon={faSortUp} className="ml-1" />
        : <FontAwesomeIcon icon={faSortDown} className="ml-1" />;
};

// --- HELPER COMPONENT StatCard (Sin cambios) ---
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
    // --- Estados (Sin cambios) ---
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    });
    const [endDate, setEndDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [forceRefresh, setForceRefresh] = useState(0);
    const debounceRef = useRef(null);

    const [summaryData, setSummaryData] = useState({
        totalSales: 0,
        grossProfit: 0,
    });
    const [salesByDay, setSalesByDay] = useState({
        options: {
            chart: { type: 'bar', height: 350, toolbar: { show: true, tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true } }, zoom: { enabled: true } },
            plotOptions: { bar: { borderRadius: 6, horizontal: false, columnWidth: '48%' } },
            dataLabels: { enabled: false },
            stroke: { show: true, width: [0, 3], curve: 'smooth' },
            xaxis: { categories: [], labels: { rotate: -45, rotateAlways: false, style: { colors: '#9CA3AF' } } },
            yaxis: { labels: { style: { colors: '#9CA3AF' }, formatter: (val) => `$${val.toLocaleString('es-AR')}` } },
            fill: { type: ['gradient', 'solid'], gradient: { shade: 'dark', type: 'vertical', shadeIntensity: 0.35, gradientToColors: ['#FFD966'], inverseColors: false, opacityFrom: 0.9, opacityTo: 0.6, stops: [0, 90, 100] }, colors: ['#FFC700'] },
            tooltip: { theme: 'dark', shared: true, intersect: false, y: { formatter: (val) => `$${val.toLocaleString('es-AR')}` } },
            grid: { borderColor: '#374151' },
            legend: { show: true, labels: { colors: '#9CA3AF' } },
            markers: { size: 4 },
            theme: { mode: 'dark' }
        },
        // Mixed series: ventas (column) + promedio 7d (line)
        series: [
            { name: 'Ventas', type: 'column', data: [] },
            { name: 'Promedio 7d', type: 'line', data: [] }
        ]
    });

    // Helper: simple moving average
    const movingAverage = (arr, windowSize = 7) => {
        if (!Array.isArray(arr) || arr.length === 0) return [];
        const res = [];
        for (let i = 0; i < arr.length; i++) {
            const start = Math.max(0, i - windowSize + 1);
            const slice = arr.slice(start, i + 1);
            const sum = slice.reduce((a, b) => a + (Number(b) || 0), 0);
            res.push(Number((sum / slice.length).toFixed(2)));
        }
        return res;
    };
    const [salesByCategory, setSalesByCategory] = useState({
        options: {
            chart: { type: 'donut', height: 250 },
            labels: [],
            plotOptions: { pie: { donut: { size: '65%' } } },
            fill: { colors: ['#FFC700', '#FBBF24', '#F59E0B', '#D97706', '#B45309', '#78350F'] },
            stroke: { show: false },
            legend: { position: 'bottom', horizontalAlign: 'center', labels: { colors: '#9CA3AF' } },
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: function (val, opts) {
                        try {
                            const totals = opts.w.globals.seriesTotals ? opts.w.globals.seriesTotals.reduce((a, b) => a + b, 0) : opts.w.globals.seriesTotal || 0;
                            const percent = totals ? ((val / totals) * 100).toFixed(2) : '0.00';
                            return `$${Number(val).toLocaleString('es-AR')} (${percent}%)`;
                        } catch (e) {
                            return `$${Number(val).toLocaleString('es-AR')}`;
                        }
                    }
                }
            },
            theme: { mode: 'dark' }
        },
        series: []
    });
    // category filter state (clickable list)
    const [categoryFilter, setCategoryFilter] = useState(null);
    const [categoryList, setCategoryList] = useState([]);
    const TOP_CATEGORIES = 6;
    const [productProfitability, setProductProfitability] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'margin', direction: 'descending' });

    // --- Funciones (Sin cambios) ---
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

    // --- CAMBIOS EN useEffect / fetchData ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = formatDate(endDate);

            // Validación simple de rango
            if (new Date(formattedStartDate) > new Date(formattedEndDate)) {
                const msg = 'La fecha de inicio no puede ser posterior a la fecha de fin.';
                setError(msg);
                toast.error(msg);
                setLoading(false);
                return;
            }

            try {
                const params = { start_date: formattedStartDate, end_date: formattedEndDate };
                const [financialResponse, productTrendsResponse] = await Promise.all([
                    apiClient.get('/analisis/report/financial/', { params }),
                    apiClient.get('/analisis/report/product-sales-trends/', { params })
                ]);

                const financialData = financialResponse.data;
                const productTrendsData = productTrendsResponse.data;

                setSummaryData({ totalSales: financialData.total_income || 0, grossProfit: financialData.net_income || 0 });

                const salesChartData = financialData.time_series_data || [];
                const categories = salesChartData.map(d => new Date(d.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
                const salesValues = salesChartData.map(d => Number(d.income) || 0);
                const ma7 = movingAverage(salesValues, 7);

                setSalesByDay(prev => ({
                    ...prev,
                    options: { ...prev.options, xaxis: { ...prev.options.xaxis, categories } },
                    series: [
                        { name: 'Ventas', type: 'column', data: salesValues },
                        { name: 'Promedio 7d', type: 'line', data: ma7 }
                    ]
                }));

                const categoryChartData = productTrendsData.category_performance || [];
                setSalesByCategory(prev => ({
                    ...prev,
                    options: { ...prev.options, labels: categoryChartData.map(c => c.producto_det_vent__categoria_producto__nombre_categoria || c.name || 'Sin categoría') },
                    series: categoryChartData.map(c => c.total_revenue_category || 0)
                }));

                setProductProfitability(financialData.top_products || []);
                setLastUpdated(new Date());

            } catch (err) {
                let errorMsg = 'No se pudieron cargar todos los datos del reporte.';
                if (err.message && err.message.includes('JSON')) {
                    errorMsg = "Error: El servidor respondió con HTML en lugar de JSON. Verifica las URLs de la API.";
                } else if (err.response?.data?.detail) {
                    errorMsg = err.response.data.detail;
                } else if (err.message) {
                    errorMsg = err.message;
                }
                setError(errorMsg);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        // Debounce: espera 500ms antes de ejecutar la petición
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchData(), 500);

        return () => clearTimeout(debounceRef.current);
    }, [startDate, endDate, forceRefresh]);

    // --- useMemo de sortedProductProfitability (Sin cambios) ---
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

    // --- CAMBIO EN exportToPDF ---
    const exportToPDF = () => {
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);
        
        // --- CAMBIO 4: Corregida la URL ---
        // Antes: /analisis/api/reporte/analisis-pdf/... (Incorrecto)
        // Ahora: /api/analisis/report/analisis-pdf/... (Correcto para el proxy de Vite)
        const pdfUrl = `/api/analisis/report/analisis-pdf/?start_date=${formattedStartDate}&end_date=${formattedEndDate}`; 
        
        if (loading) {
            toast.error('Espera a que termine de cargar el reporte antes de exportar.');
            return;
        }

        // Abre la página imprimible en una nueva pestaña. El usuario puede guardar como PDF.
        try {
            window.open(pdfUrl, '_blank');
            toast('Se abrió la vista imprimible en una nueva pestaña.', { icon: '📄' });
        } catch (err) {
            toast.error('No se pudo abrir la ventana para exportar.');
        }
    };

    const onForceRefresh = () => {
        setForceRefresh(f => f + 1);
    }

    const hasData = () => {
        const salesDataPresent = Array.isArray(salesByDay.series) && salesByDay.series[0]?.data && salesByDay.series[0].data.length > 0;
        const categoryDataPresent = Array.isArray(salesByCategory.series) && salesByCategory.series.length > 0;
        const productDataPresent = Array.isArray(productProfitability) && productProfitability.length > 0;
        return salesDataPresent || categoryDataPresent || productDataPresent;
    };

    // --- formatCurrency (Sin cambios) ---
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
    };

    // --- RENDERIZADO (Sin cambios) ---
    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Reportes de Venta</h1>
                    {lastUpdated && (
                        <p className="text-sm text-gray-400">Última actualización: {new Date(lastUpdated).toLocaleString('es-ES')}</p>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button onClick={onForceRefresh} disabled={loading} className="text-white bg-transparent border border-gray-700 hover:bg-gray-700 font-semibold rounded-lg text-sm px-4 py-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarDays} />
                        <span>Recargar</span>
                    </button>

                    <button onClick={exportToPDF} disabled={loading || !hasData()} className={`w-full sm:w-auto text-white ${loading || !hasData() ? 'bg-gray-700/50 cursor-not-allowed' : 'bg-pr-dark hover:bg-gray-700'} font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2 border border-gray-700`}>
                        <FontAwesomeIcon icon={faFileExport} />
                        <span>Exportar a PDF</span>
                    </button>
                </div>
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
                                    {Array.isArray(salesByDay.series) && salesByDay.series[0]?.data && salesByDay.series[0].data.length > 0 ? (
                                        <Chart options={salesByDay.options} series={salesByDay.series} type="bar" height={350} />
                                    ) : (
                                        <div className="text-center text-gray-400 py-16">No hay datos para el rango seleccionado.</div>
                                    )}
                                </div>
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                                <h2 className="text-xl font-bold text-white mb-4">Ventas por Categoría</h2>
                                {Array.isArray(salesByCategory.series) && salesByCategory.series.length > 0 ? (
                                    <Chart options={salesByCategory.options} series={salesByCategory.series} type="donut" height={250} />
                                ) : (
                                    <div className="text-center text-gray-400 py-16">No hay datos de categoría para el rango seleccionado.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- Tabla de Rentabilidad Ordenable --- */}
                    <div className="mt-8 bg-pr-dark p-6 rounded-lg shadow-lg border border-pr-gray/20">
                        <h2 className="text-2xl font-bold text-white mb-4">Rentabilidad por Producto</h2>
                        <div className="relative overflow-x-auto rounded-lg">
                            <table className="w-full text-sm text-left text-gray-400">
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
                                            <td className="px-6 py-4 text-right hidden lg:table-cell">
                                                {product.total_revenue ? ((product.margin / product.total_revenue) * 100).toFixed(2) : '0.00'}%
                                            </td>
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