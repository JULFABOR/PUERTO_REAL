import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileExport, faSync, faCalendarDays, faDollarSign, faChartLine,
    faSort, faSortUp, faSortDown, faSpinner, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import Chart from 'react-apexcharts';
import { Datepicker } from 'flowbite-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/apiClient';

// --- HELPER COMPONENTS ---
const SortIndicator = ({ direction }) => {
    if (!direction) return <FontAwesomeIcon icon={faSort} className="ml-2 text-gray-500 opacity-60" />;
    return direction === 'ascending'
        ? <FontAwesomeIcon icon={faSortUp} className="ml-2" />
        : <FontAwesomeIcon icon={faSortDown} className="ml-2" />;
};

const StatCard = ({ title, value, icon }) => (
    <div className="bg-pr-dark p-6 rounded-xl shadow-lg border border-pr-gray/20">
        <div className="flex justify-between items-center">
            <div>
                <p className="text-sm text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
            </div>
            {icon && <FontAwesomeIcon icon={icon} className="text-4xl text-pr-yellow opacity-20" />}
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
    const [summaryData, setSummaryData] = useState({ totalSales: 0, grossProfit: 0 });
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
        series: [ { name: 'Ventas', type: 'column', data: [] }, { name: 'Promedio 7d', type: 'line', data: [] } ]
    });
    const [salesByCategory, setSalesByCategory] = useState({
        options: {
            chart: { type: 'donut', height: 350 },
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
                        } catch (e) { return `$${Number(val).toLocaleString('es-AR')}`; }
                    }
                }
            },
            theme: { mode: 'dark' }
        },
        series: []
    });
    const [productProfitability, setProductProfitability] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'margin', direction: 'descending' });

    // --- Funciones Lógicas (Sin cambios) ---
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
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') { direction = 'descending'; } 
        else if (sortConfig.key === key) { direction = 'ascending'; }
        setSortConfig({ key, direction });
    };
    const formatDate = (date) => date.toISOString().split('T')[0];
    const formatCurrency = (value) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
    const onForceRefresh = () => setForceRefresh(f => f + 1);
    const hasData = () => (salesByDay.series[0]?.data.length > 0 || salesByCategory.series.length > 0 || productProfitability.length > 0);

    // --- useEffect / fetchData (Sin cambios) ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = formatDate(endDate);
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
                setSalesByDay(prev => ({ ...prev, options: { ...prev.options, xaxis: { ...prev.options.xaxis, categories } }, series: [ { name: 'Ventas', type: 'column', data: salesValues }, { name: 'Promedio 7d', type: 'line', data: ma7 } ] }));
                const categoryChartData = productTrendsData.category_performance || [];
                setSalesByCategory(prev => ({ ...prev, options: { ...prev.options, labels: categoryChartData.map(c => c.producto_det_vent__categoria_producto__nombre_categoria || c.name || 'Sin categoría') }, series: categoryChartData.map(c => c.total_revenue_category || 0) }));
                setProductProfitability(financialData.top_products || []);
                setLastUpdated(new Date());
            } catch (err) {
                let errorMsg = 'No se pudieron cargar los datos del reporte.';
                if (err.message?.includes('JSON')) { errorMsg = "Error: El servidor respondió con HTML en lugar de JSON. Verifica las URLs de la API."; } 
                else if (err.response?.data?.detail) { errorMsg = err.response.data.detail; } 
                else if (err.message) { errorMsg = err.message; }
                setError(errorMsg);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        };
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchData(), 500);
        return () => clearTimeout(debounceRef.current);
    }, [startDate, endDate, forceRefresh]);
    
    // --- useMemo / sortedData (Sin cambios) ---
    const sortedProductProfitability = useMemo(() => {
        let sortedProducts = [...productProfitability];
        if (sortConfig.key) {
            sortedProducts.sort((a, b) => {
                let aValue = a[sortConfig.key] || 0;
                let bValue = b[sortConfig.key] || 0;
                if (sortConfig.key === 'producto_det_vent__nombre_producto') {
                    return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                // Handle margin_percentage sorting as well
                if (sortConfig.key === 'margin_percentage') {
                    aValue = a.total_revenue ? (a.margin / a.total_revenue) * 100 : 0;
                    bValue = b.total_revenue ? (b.margin / b.total_revenue) * 100 : 0;
                }
                return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
            });
        }
        return sortedProducts;
    }, [productProfitability, sortConfig]);

    const top5ByGrossProfit = useMemo(() => {
        return [...productProfitability]
            .sort((a, b) => (b.margin || 0) - (a.margin || 0))
            .slice(0, 5);
    }, [productProfitability]);

    const top5ByTotalRevenue = useMemo(() => {
        return [...productProfitability]
            .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
            .slice(0, 5);
    }, [productProfitability]);


    // --- Función de Exportar (Sin cambios) ---
    const exportToPDF = () => {
        const pdfUrl = `/api/analisis/report/analisis-pdf/?start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`; 
        if (loading) { toast.error('Espera a que termine de cargar el reporte.'); return; }
        try { window.open(pdfUrl, '_blank'); toast('Se abrió la vista imprimible.', { icon: '📄' }); } 
        catch (err) { toast.error('No se pudo abrir la ventana para exportar.'); }
    };

    return (
        <div className="space-y-8">
            {/* Título y última actualización */}
            <div>
                <h1 className="text-3xl font-bold text-white">Reportes de Venta</h1>
                {lastUpdated && !loading && (
                    <p className="text-sm text-gray-400 mt-1">Última actualización: {new Date(lastUpdated).toLocaleString('es-ES')}</p>
                )}
            </div>

            {/* Panel de Controles */}
            <div className="bg-pr-dark border border-pr-gray/20 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 flex-1">
                        <Datepicker language="es-ES" label="Fecha de inicio" value={startDate.toLocaleDateString('es-ES')} onSelectedDateChanged={date => setStartDate(date)} />
                        <span className="text-gray-400">a</span>
                        <Datepicker language="es-ES" label="Fecha de fin" value={endDate.toLocaleDateString('es-ES')} onSelectedDateChanged={date => setEndDate(date)} />
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onForceRefresh} disabled={loading} className="text-white bg-pr-dark-gray border border-pr-gray hover:bg-pr-gray font-semibold rounded-lg text-sm px-4 py-2.5 flex items-center gap-2 transition-colors disabled:opacity-50">
                            <FontAwesomeIcon icon={loading ? faSpinner : faSync} className={loading ? 'animate-spin' : ''} />
                            <span>{loading ? 'Cargando...' : 'Recargar'}</span>
                        </button>
                        <button onClick={exportToPDF} disabled={loading || !hasData()} className="text-pr-dark bg-pr-yellow hover:bg-yellow-400 font-bold rounded-lg text-sm px-5 py-2.5 flex items-center justify-center gap-2 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                            <FontAwesomeIcon icon={faFileExport} />
                            <span>Exportar</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Estados de Carga y Error */}
            {loading && (
                <div className="flex justify-center items-center h-96 text-pr-yellow"><FontAwesomeIcon icon={faSpinner} className="animate-spin text-5xl" /></div>
            )}
            {error && !loading && (
                <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center" role="alert">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3 text-red-400" />
                    <div><strong className="font-bold">Error:</strong><span className="block sm:inline ml-2">{error}</span></div>
                </div>
            )}

            {/* Contenido Principal */}
            {!loading && !error && hasData() && (
                <div className="space-y-8">
                    {/* StatCards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <StatCard title="Ventas Totales" value={formatCurrency(summaryData.totalSales)} icon={faDollarSign} />
                        <StatCard title="Ganancia Bruta" value={formatCurrency(summaryData.grossProfit)} icon={faChartLine} />
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                        <div className="xl:col-span-3 bg-pr-dark p-6 rounded-xl shadow-lg border border-pr-gray/20">
                            <h2 className="text-xl font-bold text-white mb-4">Ventas por Día</h2>
                            <Chart options={salesByDay.options} series={salesByDay.series} type="bar" height={350} />
                        </div>
                        <div className="xl:col-span-2 bg-pr-dark p-6 rounded-xl shadow-lg border border-pr-gray/20">
                            <h2 className="text-xl font-bold text-white mb-4">Ventas por Categoría</h2>
                            <Chart options={salesByCategory.options} series={salesByCategory.series} type="donut" height={350} />
                        </div>
                    </div>

                    {/* Top Products Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-pr-dark p-6 rounded-xl shadow-lg border border-pr-gray/20">
                            <h2 className="text-xl font-bold text-white mb-4">Top 5 Productos por Ganancia Bruta</h2>
                            <ul className="space-y-3">
                                {top5ByGrossProfit.length > 0 ? top5ByGrossProfit.map((product, index) => (
                                    <li key={index} className="flex justify-between items-center text-gray-300 border-b border-pr-gray/30 pb-2">
                                        <span>{product.producto_det_vent__nombre_producto}</span>
                                        <span className="font-semibold text-pr-yellow">{formatCurrency(product.margin)}</span>
                                    </li>
                                )) : <li className="text-gray-500">No hay datos de productos.</li>}
                            </ul>
                        </div>
                        <div className="bg-pr-dark p-6 rounded-xl shadow-lg border border-pr-gray/20">
                            <h2 className="text-xl font-bold text-white mb-4">Top 5 Productos por Ingreso Total</h2>
                            <ul className="space-y-3">
                                {top5ByTotalRevenue.length > 0 ? top5ByTotalRevenue.map((product, index) => (
                                    <li key={index} className="flex justify-between items-center text-gray-300 border-b border-pr-gray/30 pb-2">
                                        <span>{product.producto_det_vent__nombre_producto}</span>
                                        <span className="font-semibold text-pr-yellow">{formatCurrency(product.total_revenue)}</span>
                                    </li>
                                )) : <li className="text-gray-500">No hay datos de productos.</li>}
                            </ul>
                        </div>
                    </div>

                    {/* Tabla de Rentabilidad */}
                    <div className="bg-pr-dark p-6 rounded-xl shadow-lg border border-pr-gray/20">
                        <h2 className="text-2xl font-bold text-white mb-6">Rentabilidad por Producto</h2>
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs text-white uppercase bg-pr-dark-gray">
                                    <tr>
                                        {[{key: 'producto_det_vent__nombre_producto', label: 'Producto', align: 'left'}, {key: 'total_quantity_sold', label: 'Uds. Vendidas', align: 'center'}, {key: 'total_revenue', label: 'Ingresos', align: 'right'}, {key: 'cogs', label: 'Costo Total', align: 'right', hidden: 'xl'}, {key: 'margin', label: 'Ganancia Bruta', align: 'right'}, {key: 'margin_percentage', label: 'Margen %', align: 'right'}].map(h => (
                                            <th key={h.key || h.label} scope="col" className={`px-6 py-3 ${h.hidden ? `hidden ${h.hidden}:table-cell` : ''} ${h.key ? 'cursor-pointer hover:bg-gray-700/50' : ''}`} onClick={() => h.key && requestSort(h.key)}>
                                                <div className={`flex items-center ${h.align === 'right' ? 'justify-end' : h.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                                                    {h.label} {h.key && <SortIndicator direction={sortConfig.key === h.key ? sortConfig.direction : null} />}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {sortedProductProfitability.map(product => (
                                        <tr key={product.producto_det_vent__nombre_producto} className="hover:bg-pr-dark-gray/50">
                                            <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap text-white">{product.producto_det_vent__nombre_producto}</th>
                                            <td className="px-6 py-4 text-center">{product.total_quantity_sold}</td>
                                            <td className="px-6 py-4 text-right">{formatCurrency(product.total_revenue)}</td>
                                            <td className="px-6 py-4 text-right hidden xl:table-cell">{formatCurrency(product.cogs)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-pr-yellow">{formatCurrency(product.margin)}</td>
                                            <td className="px-6 py-4 text-right text-gray-400">{product.total_revenue ? ((product.margin / product.total_revenue) * 100).toFixed(2) : '0.00'}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            {!loading && !error && !hasData() && (
                <div className="text-center text-gray-500 py-24">
                    <p className="text-lg">No hay datos de ventas para el rango de fechas seleccionado.</p>
                    <p className="mt-2">Intenta seleccionar un rango de fechas diferente.</p>
                </div>
            )}
        </div>
    );
};

export default JefeAnalysis;