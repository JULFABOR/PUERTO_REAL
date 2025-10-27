import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExport, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import Chart from 'react-apexcharts';
import { Datepicker } from 'flowbite-react';
import { toast } from 'react-hot-toast';

const StatCard = ({ title, value, icon }) => (
    <div className="bg-pr-dark p-6 rounded-lg shadow-lg">
        <p className="text-sm text-pr-gray">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
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

    const formatDate = (date) => date.toISOString().split('T')[0];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = formatDate(endDate);

            try {
                const [financialRes, productTrendsRes] = await Promise.all([
                    fetch(`/analisis/api/report/financial/?start_date=${formattedStartDate}&end_date=${formattedEndDate}`),
                    fetch(`/analisis/api/report/product-sales-trends/?start_date=${formattedStartDate}&end_date=${formattedEndDate}`)
                ]);

                if (!financialRes.ok || !productTrendsRes.ok) {
                    throw new Error('No se pudieron cargar todos los datos del reporte.');
                }
                
                const financialData = await financialRes.json();
                const productTrendsData = await productTrendsRes.json();

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
                setError(err.message);
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [startDate, endDate]);

    const exportToPDF = () => {
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);
        const pdfUrl = `/analisis/api/reporte/analisis-pdf/?start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
        window.open(pdfUrl, '_blank');
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Reportes de Venta</h1>
                <button onClick={exportToPDF} className="w-full sm:w-auto text-white bg-pr-dark hover:bg-gray-700 font-bold rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faFileExport} />
                    <span>Exportar a PDF</span>
                </button>
            </div>

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

            {loading && <p className="text-white text-center">Cargando datos...</p>}
            {error && <p className="text-red-500 text-center">Error: {error}</p>}

            {!loading && !error && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Ventas Totales" value={formatCurrency(summaryData.totalSales)} />
                        <StatCard title="Ganancia Bruta" value={formatCurrency(summaryData.grossProfit)} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-pr-dark p-6 rounded-lg shadow-lg">
                                <h2 className="text-xl font-bold text-white mb-4">Ventas por Día</h2>
                                <Chart options={salesByDay.options} series={salesByDay.series} type="bar" height={350} />
                            </div>
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-pr-dark p-6 rounded-lg shadow-lg">
                                <h2 className="text-xl font-bold text-white mb-4">Ventas por Categoría</h2>
                                <Chart options={salesByCategory.options} series={salesByCategory.series} type="donut" height={250} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 bg-pr-dark p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-white mb-4">Rentabilidad por Producto</h2>
                        <div className="relative overflow-x-auto rounded-lg">
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="text-xs text-white uppercase bg-pr-dark-gray">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Producto</th>
                                        <th scope="col" className="px-6 py-3 text-center">Uds. Vendidas</th>
                                        <th scope="col" className="px-6 py-3 text-right hidden sm:table-cell">Ingresos</th>
                                        <th scope="col" className="px-6 py-3 text-right hidden md:table-cell">Costo Total</th>
                                        <th scope="col" className="px-6 py-3 text-right">Ganancia Bruta</th>
                                        <th scope="col" className="px-6 py-3 text-right hidden lg:table-cell">Margen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productProfitability.map(product => (
                                        <tr key={product.producto_det_vent__nombre_producto} className="border-b bg-pr-dark border-gray-700">
                                            <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap text-white">{product.producto_det_vent__nombre_producto}</th>
                                            <td className="px-6 py-4 text-center">{product.total_quantity_sold}</td>
                                            <td className="px-6 py-4 text-right hidden sm:table-cell">{formatCurrency(product.total_revenue)}</td>
                                            <td className="px-6 py-4 text-right hidden md:table-cell">{formatCurrency(product.cogs)}</td>
                                            <td className="px-6 py-4 text-right">{formatCurrency(product.margin)}</td>
                                            <td className="px-6 py-4 text-right hidden lg:table-cell">{((product.margin / product.total_revenue) * 100).toFixed(2)}%</td>
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
