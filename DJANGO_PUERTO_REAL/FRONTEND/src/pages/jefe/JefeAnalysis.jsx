import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExport, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import Chart from 'react-apexcharts';
import jsPDF from 'jspdf';

const JefeAnalysis = () => {
    // TODO: Fetch data from API
    const [salesBarChart, setSalesBarChart] = useState({
        options: {
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { bar: { borderRadius: 4, horizontal: false, columnWidth: '50%' } },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            xaxis: { categories: [], labels: { style: { colors: '#9CA3AF' } } },
            yaxis: { labels: { style: { colors: '#9CA3AF' }, formatter: (val) => `${val.toLocaleString('es-AR')}` } },
            fill: { colors: ['#FFC700'] },
            tooltip: { theme: 'dark', y: { formatter: (val) => `${val.toLocaleString('es-AR')}` } },
            grid: { borderColor: '#374151' },
            theme: { mode: 'dark' }
        },
        series: [{ name: 'Ventas', data: [] }]
    });

    // TODO: Fetch data from API
    const [categoryDonutChart, setCategoryDonutChart] = useState({
        options: {
            chart: { type: 'donut', height: 250 },
            labels: [],
            plotOptions: { pie: { donut: { size: '65%' } } },
            fill: { colors: ['#FFC700', '#FBBF24', '#F59E0B', '#D97706'] },
            stroke: { show: false },
            legend: { position: 'bottom', horizontalAlign: 'center', labels: { colors: '#9CA3AF' } },
            theme: { mode: 'dark' }
        },
        series: []
    });

    const exportToPDF = () => {
        const doc = new jsPDF();
        const today = new Date().toLocaleDateString('es-AR');

        doc.setFontSize(20);
        doc.text("Reporte de Ventas - PUERTO REAL", 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Periodo: 01/09/2025 - 07/09/2025`, 105, 28, { align: 'center' });

        doc.setFontSize(14);
        doc.text("Indicadores Principales", 14, 45);
        doc.setFontSize(10);
        doc.text("- Ventas Totales: $0.00", 14, 52);
        doc.text("- Ganancia Bruta: $0.00", 14, 59);
        doc.text("- Nº Transacciones: 0", 105, 52);
        doc.text("- Ticket Promedio: $0.00", 105, 59);

        doc.save(`reporte-ventas-${today}.pdf`);
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

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex items-center w-full md:w-auto">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"><FontAwesomeIcon icon={faCalendarDays} className="text-gray-400" /></div>
                        <input name="start" type="text" className="border text-sm rounded-lg block w-full ps-10 p-2.5 bg-pr-dark-gray border-gray-600 text-white" placeholder="Fecha de inicio" />
                    </div>
                    <span className="mx-4 text-gray-400 hidden sm:block">a</span>
                    <div className="relative w-full mt-2 sm:mt-0">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"><FontAwesomeIcon icon={faCalendarDays} className="text-gray-400" /></div>
                        <input name="end" type="text" className="border text-sm rounded-lg block w-full ps-10 p-2.5 bg-pr-dark-gray border-gray-600 text-white" placeholder="Fecha de fin" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Ventas Totales</p><p className="text-3xl font-bold text-white">$0.00</p></div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Ganancia Bruta</p><p className="text-3xl font-bold text-green-500">$0.00</p></div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Nº Transacciones</p><p className="text-3xl font-bold text-white">0</p></div>
                <div className="bg-pr-dark p-6 rounded-lg shadow-lg"><p className="text-sm text-pr-gray">Ticket Promedio</p><p className="text-3xl font-bold text-white">$0.00</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Ventas por Día</h2>
                        <Chart options={salesBarChart.options} series={salesBarChart.series} type="bar" height={350} />
                    </div>
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Ventas por Categoría</h2>
                        <Chart options={categoryDonutChart.options} series={categoryDonutChart.series} type="donut" height={250} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-pr-dark p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Ventas por Medio de Pago</h2>
                        {/* TODO: Fetch data from API */}
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center"><span className="text-gray-300">Efectivo</span><span className="font-bold text-white">$0</span></li>
                            <li className="flex justify-between items-center"><span className="text-gray-300">Tarjeta de Crédito</span><span className="font-bold text-white">$0</span></li>
                            <li className="flex justify-between items-center"><span className="text-gray-300">Tarjeta de Débito</span><span className="font-bold text-white">$0</span></li>
                            <li className="flex justify-between items-center"><span className="text-gray-300">Transferencia / QR</span><span className="font-bold text-white">$0</span></li>
                        </ul>
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
.                               <th scope="col" className="px-6 py-3 text-right hidden sm:table-cell">Ingresos</th>
                                <th scope="col" className="px-6 py-3 text-right hidden md:table-cell">Costo Total</th>
                                <th scope="col" className="px-6 py-3 text-right">Ganancia Bruta</th>
                                <th scope="col" className="px-6 py-3 text-right hidden lg:table-cell">Margen</th>
                            </tr>
                        </thead>
                        {/* TODO: Fetch data from API */}
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default JefeAnalysis;
