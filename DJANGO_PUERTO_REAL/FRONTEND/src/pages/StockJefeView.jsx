import React, { useState, useEffect } from 'react';
import { Card, Spinner, Datepicker } from 'flowbite-react';
import Chart from 'react-apexcharts';
import apiClient from '../api/apiClient'; // Import the apiClient
import { format, subDays } from 'date-fns'; // For date formatting and calculations

const StockJefeView = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stockSummary, setStockSummary] = useState(null);
    const [productStockHistory, setProductStockHistory] = useState([]);
    const [topProductsByStock, setTopProductsByStock] = useState([]);
    const [productSalesPerformance, setProductSalesPerformance] = useState([]);

    // State for date range selection
    const [startDate, setStartDate] = useState(subDays(new Date(), 30));
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const formattedStartDate = format(startDate, 'yyyy-MM-dd');
                const formattedEndDate = format(endDate, 'yyyy-MM-dd');

                // Fetch Stock Movement Summary
                const summaryResponse = await apiClient.get('/stock/stock-movement-summary/', {
                    params: {
                        start_date: formattedStartDate,
                        end_date: formattedEndDate,
                    },
                });
                setStockSummary(summaryResponse.data);

                // Fetch Product Stock History (example for a specific product ID, will need a selector later)
                // For now, let's pick a dummy product ID, or fetch a list of products first.
                // Assuming product with ID 1 exists for demonstration.
                const productHistoryResponse = await apiClient.get('/stock/historial-producto/1/', {
                    params: {
                        start_date: formattedStartDate,
                        end_date: formattedEndDate,
                    },
                });
                setProductStockHistory(productHistoryResponse.data);

                // Fetch Top Products By Stock
                const topProductsResponse = await apiClient.get('/stock/top-products-by-stock/', {
                    params: {
                        limit: 10, // Fetch top 10 products
                        order_by: '-total_stock' // Order by highest stock
                    }
                });
                setTopProductsByStock(topProductsResponse.data);

                // Fetch Product Sales Performance
                const salesPerformanceResponse = await apiClient.get('/ventas/sales-performance/', {
                    params: {
                        start_date: formattedStartDate,
                        end_date: formattedEndDate,
                        limit: 5, // Top 5 products by sales
                    },
                });
                setProductSalesPerformance(salesPerformanceResponse.data);

            } catch (err) {
                console.error("Error fetching data for Stock Jefe View:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [startDate, endDate]); // Re-run effect when dates change

    if (loading) {
        return (
            <div className="text-center p-4">
                <Spinner aria-label="Cargando datos..." size="xl" />
                <p className="text-gray-500 mt-2">Cargando datos estratégicos...</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 p-4">Error al cargar los datos: {error.message}</div>;
    }

    // ApexCharts options and series for Stock History
    const stockHistoryDates = productStockHistory.map(item => format(new Date(item.fecha_movimiento_hstock), 'dd/MM'));
    const stockHistoryQuantities = productStockHistory.map(item => parseFloat(item.cantidad_hstock)); // Ensure quantity is a number

    const stockHistoryOptions = {
        chart: {
            id: 'stock-history-chart',
            toolbar: {
                show: true
            }
        },
        xaxis: {
            categories: stockHistoryDates,
            title: {
                text: 'Fecha'
            }
        },
        yaxis: {
            title: {
                text: 'Cantidad'
            }
        },
        tooltip: {
            x: {
                format: 'dd/MM/yyyy'
            }
        }
    };
    const stockHistorySeries = [{
        name: 'Stock',
        data: stockHistoryQuantities
    }];

    // ApexCharts options and series for Product Sales Performance (Bar Chart)
    const salesProductNames = productSalesPerformance.map(item => item.producto_nombre);
    const salesQuantities = productSalesPerformance.map(item => item.total_quantity_sold);
    const salesRevenues = productSalesPerformance.map(item => parseFloat(item.total_revenue));

    const salesPerformanceOptions = {
        chart: {
            id: 'sales-performance-chart',
            toolbar: {
                show: true
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: salesProductNames,
            title: {
                text: 'Producto'
            }
        },
        yaxis: {
            title: {
                text: 'Cantidad Vendida / Ingresos'
            }
        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + " unidades / $" + val
                }
            }
        }
    };

    const salesPerformanceSeries = [{
        name: 'Cantidad Vendida',
        data: salesQuantities
    }, {
        name: 'Ingresos Totales',
        data: salesRevenues
    }];

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Dashboard de Gestión de Stock (Jefe)</h1>

            {/* Date Range Selector */}
            <div className="mb-4 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Desde:</label>
                    <Datepicker
                        id="startDate"
                        value={format(startDate, 'dd/MM/yyyy')}
                        onSelectedDateChanged={date => setStartDate(date)}
                        labelTodayButton="Hoy"
                        labelClearButton="Limpiar"
                        maxDate={endDate} // Ensure start date is not after end date
                    />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hasta:</label>
                    <Datepicker
                        id="endDate"
                        value={format(endDate, 'dd/MM/yyyy')}
                        onSelectedDateChanged={date => setEndDate(date)}
                        labelTodayButton="Hoy"
                        labelClearButton="Limpiar"
                        minDate={startDate} // Ensure end date is not before start date
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Card className="text-center">
                    <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Total Entradas ({format(startDate, 'dd/MM')} - {format(endDate, 'dd/MM')})
                    </h5>
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        {stockSummary?.total_entries ?? 'N/A'}
                    </p>
                </Card>
                <Card className="text-center">
                    <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Total Salidas ({format(startDate, 'dd/MM')} - {format(endDate, 'dd/MM')})
                    </h5>
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        {stockSummary?.total_exits ?? 'N/A'}
                    </p>
                </Card>
                <Card className="text-center">
                    <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Productos con bajo stock
                    </h5>
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        {topProductsByStock.filter(p => p.total_stock < 10).length}
                    </p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <Card>
                    <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Historial de Stock de un Producto (ID 1)
                    </h5>
                    <Chart options={stockHistoryOptions} series={stockHistorySeries} type="line" height={350} />
                </Card>
                <Card>
                    <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Top 5 Productos Más Vendidos por Cantidad e Ingresos
                    </h5>
                    <Chart options={salesPerformanceOptions} series={salesPerformanceSeries} type="bar" height={350} />
                </Card>
            </div>

            <div className="grid grid-cols-1">
                <Card>
                    <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Productos con Mayor/Menor Stock
                    </h5>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                        Producto
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                        Stock Actual
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                {topProductsByStock.map(product => (
                                    <tr key={product.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {product.nombre_producto}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {product.total_stock}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StockJefeView;