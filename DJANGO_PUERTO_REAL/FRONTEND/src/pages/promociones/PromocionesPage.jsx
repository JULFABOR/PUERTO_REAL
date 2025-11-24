import React from 'react';
import PromoCard from '@/components/shared/PromoCard';

const mockPromotions = [
  {
    id_promo_desc: 1,
    nombre_promo_desc: "Descuento de Verano",
    descripcion_promo_desc: "Aprovecha un 10% de descuento en tu próxima compra.",
    puntos_requeridos_promo_desc: 100,
    descuento_porcentaje_promo_desc: 10,
    descuento_monto_promo_desc: 0,
    fecha_inicio_promo_desc: "2025-11-01",
    fecha_vencimiento_promo_desc: "2025-11-30",
  },
  {
    id_promo_desc: 2,
    nombre_promo_desc: "Ahorro de $5",
    descripcion_promo_desc: "Canjea tus puntos por un descuento de $5.",
    puntos_requeridos_promo_desc: 200,
    descuento_porcentaje_promo_desc: 0,
    descuento_monto_promo_desc: 5,
    fecha_inicio_promo_desc: "2025-11-15",
    fecha_vencimiento_promo_desc: "2025-12-15",
  },
  {
    id_promo_desc: 3,
    nombre_promo_desc: "Promo Especial",
    descripcion_promo_desc: "20% de descuento para nuestros clientes fieles.",
    puntos_requeridos_promo_desc: 500,
    descuento_porcentaje_promo_desc: 20,
    descuento_monto_promo_desc: 0,
    fecha_inicio_promo_desc: "2025-11-20",
    fecha_vencimiento_promo_desc: "2025-12-20",
  }
];

const PromocionesPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Promociones Disponibles</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockPromotions.map(promo => (
          <PromoCard key={promo.id_promo_desc} promotion={promo} />
        ))}
      </div>
    </div>
  );
};

export default PromocionesPage;
