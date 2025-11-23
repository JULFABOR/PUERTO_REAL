import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBeer, faAddressBook, faPercent, faWineBottle, faGift, faBoxOpen, faCoins, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/api/apiClient';
import { toast } from 'react-hot-toast';
import PromoCard from '@/components/shared/PromoCard';
import CTAButton from '@/components/shared/CTAButton';
import { Link } from 'react-router-dom';
import ConfirmActionModal from '@/components/Modals/ConfirmActionModal';

const ClienteHome = () => {
    const { user } = useAuth();

    const [promos, setPromos] = useState([]);
    const [myCoupons, setMyCoupons] = useState([]);
    const [points, setPoints] = useState(null);
    const [loading, setLoading] = useState(true);
    const [orderedPromos, setOrderedPromos] = useState([]);
    const [redeemingIds, setRedeemingIds] = useState(new Set());
    const [redeemedIds, setRedeemedIds] = useState(new Set());
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [promoToConfirm, setPromoToConfirm] = useState(null);
    // Extraemos la lógica de carga para reusarla tras canjear
    const fetchData = async () => {
        setLoading(true);
        try {
            // Promociones generales (publicas)
            const promosResp = await apiClient.get('/fidelizacion/promos-clientes/');
            // Cupones del usuario (requiere auth)
            let myCouponsResp = { data: [] };
            try {
                myCouponsResp = await apiClient.get('/fidelizacion/promos-clientes/mis_cupones/');
            } catch (e) {
                console.debug('No se pudo obtener mis cupones:', e?.response?.status);
            }

            // Intentar obtener puntos del cliente mediante distintos caminos según la forma del user
            let puntosResp = null;
            try {
                const clienteId = user?.cliente?.id_cliente || user?.cliente_id || user?.clienteId || user?.cliente?.id;
                if (clienteId) {
                    const resp = await apiClient.get(`/fidelizacion/clientes/${clienteId}/mis_puntos/`);
                    puntosResp = resp.data?.puntos_actuales ?? resp.data?.puntos ?? null;
                } else {
                    const clientesList = await apiClient.get('/fidelizacion/clientes/');
                    const found = (clientesList.data || []).find(c => {
                        const email = c.user_email || (c.user_cliente && c.user_cliente.email) || '';
                        const username = c.user_first_name || '';
                        return (user?.email && user.email === email) || (user?.username && user.username === username);
                    });
                    if (found) {
                        const resp = await apiClient.get(`/fidelizacion/clientes/${found.id_cliente}/mis_puntos/`);
                        puntosResp = resp.data?.puntos_actuales ?? resp.data?.puntos ?? null;
                    }
                }
            } catch (e) {
                console.debug('No se pudo obtener puntos del cliente:', e?.response?.status);
            }

            const fetchedPromos = promosResp.data || [];
            setPromos(fetchedPromos);
            setMyCoupons(myCouponsResp.data || []);
            setPoints(puntosResp);

            // Calcular prioridad y ordenar promos para cada usuario
            try {
                const myCouponIds = new Set((myCouponsResp.data || []).map(c => c.id || c.pk || c.id_promo));
                const scored = (fetchedPromos || []).map((pr) => {
                    const puntosReq = Number(pr?.cupon_descuento_promo_cli?.puntos_requeridos_promo_desc || pr?.puntos_requeridos || pr?.puntos || 0) || 0;
                    let score = 0;

                    // Más prioridad si ya es un cupón asignado al cliente
                    if (myCouponIds.has(pr.id) || myCouponIds.has(pr.pk) || myCouponIds.has(pr.id_promo)) score += 50;

                    // Si el usuario tiene puntos y puede canjear, subir prioridad
                    if (points != null && puntosReq > 0 && puntosReq <= puntosResp) score += 30;

                    // Menor requisito de puntos => más prioridad
                    if (puntosReq > 0) score += Math.max(0, 20 - Math.min(20, Math.floor(puntosReq / 10)));

                    // Fecha de vencimiento próxima => subir un poco
                    const venc = pr?.cupon_descuento_promo_cli?.fecha_vencimiento_promo_desc || pr?.fecha_vencimiento;
                    if (venc) {
                        try {
                            const daysLeft = Math.ceil((new Date(venc) - new Date()) / (1000 * 60 * 60 * 24));
                            if (!isNaN(daysLeft)) {
                                if (daysLeft <= 7) score += 8;
                                else if (daysLeft <= 30) score += 4;
                            }
                        } catch (e) {}
                    }

                    return { promo: pr, score };
                });

                scored.sort((a, b) => b.score - a.score);
                setOrderedPromos(scored.map(s => s.promo));
            } catch (e) {
                console.debug('Error al calcular orden de promociones:', e);
                setOrderedPromos(fetchedPromos);
            }
        } catch (error) {
            console.error('Error cargando datos de fidelización:', error);
            try { toast.error('No se pudieron cargar las promociones.'); } catch(e){}
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        if (mounted) fetchData();
        return () => { mounted = false; };
    }, [user]);

    const redeemPromo = async (promo) => {
        const promoId = promo?.id || promo?.id_promo || promo?.pk;
        if (!promoId) {
            toast.error('ID de promoción no disponible.');
            return;
        }

        // puntos requeridos (compatibilidad)
        const puntosReq = Number(promo?.cupon_descuento_promo_cli?.puntos_requeridos_promo_desc || promo?.puntos_requeridos || promo?.puntos || 0);
        if (points != null && puntosReq > points) {
            toast.error('No tienes puntos suficientes para canjear esta promoción.');
            return;
        }

        // Marcar como en proceso
        setRedeemingIds(prev => {
            const s = new Set(prev);
            s.add(promoId);
            return s;
        });

        try {
            await apiClient.post(`/fidelizacion/promos-clientes/${promoId}/canjear/`);
            toast.success('Cupón canjeado correctamente.');
            // Marcar como canjeado
            setRedeemedIds(prev => {
                const s = new Set(prev);
                s.add(promoId);
                return s;
            });
            // Refresh data (promos, myCoupons, points)
            await fetchData();
        } catch (e) {
            console.error('Error al canjear cupón:', e);
            const msg = e?.response?.data?.error || e?.response?.data?.detail || 'No se pudo canjear el cupón.';
            toast.error(msg);
        } finally {
            // Quitar del set de en proceso
            setRedeemingIds(prev => {
                const s = new Set(prev);
                s.delete(promoId);
                return s;
            });
        }
    };

    const openConfirm = (promo) => {
        setPromoToConfirm(promo);
        setShowConfirmModal(true);
    };

    const closeConfirm = () => {
        setPromoToConfirm(null);
        setShowConfirmModal(false);
    };

    const handleConfirmRedeem = async () => {
        if (!promoToConfirm) return;
        await redeemPromo(promoToConfirm);
        closeConfirm();
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-white mb-6">Bienvenido, {user?.username || 'Cliente'}!</h1>

            {loading ? (
                <p className="text-pr-gray">Cargando promociones...</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <PromoCard to="/cliente/home" icon={<FontAwesomeIcon icon={faBeer} className="text-pr-yellow text-4xl mb-4" />} title="Ver Productos" description="Explora nuestro catálogo completo." />
                        <PromoCard to="/cliente/perfil" icon={<FontAwesomeIcon icon={faAddressBook} className="text-pr-yellow text-4xl mb-4" />} title="Mi Perfil" description="Consulta y administra tu información personal." />
                    </div>

                    {/* Sección de Promociones por Puntos */}
                    <div className="mt-12">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white mb-6">Promociones por Puntos</h2>
                            <div className="text-pr-gray">Saldo: {points != null ? `${points} pts` : '--'}</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {((orderedPromos && orderedPromos.length > 0) ? orderedPromos : promos).length > 0 ? (
                                (orderedPromos && orderedPromos.length > 0 ? orderedPromos : promos).map((p) => {
                                    // Compatibilidad con serializer: algunos campos anidados pueden variar
                                    const title = p.cupon_nombre || p.cupon_descuento_promo_cli?.nombre_promo_desc || p.cupon_descuunto_promo_cli || 'Promoción';
                                    const description = p.descripcion || p.cupon_descuento_promo_cli?.descripcion_promo_desc || p.descripcion_promo || '';
                                    const puntosReq = p.cupon_descuento_promo_cli?.puntos_requeridos_promo_desc || p.puntos_requeridos || '';
                                    const promoId = p?.id || p?.id_promo || p?.pk;
                                    const isRedeeming = promoId && redeemingIds.has(promoId);
                                    const isRedeemed = promoId && redeemedIds.has(promoId);
                                    const ctaDefault = puntosReq ? 'Canjear' : 'Ver';
                                    const ctaText = isRedeemed ? 'Canjeado' : (isRedeeming ? 'Canjeando...' : ctaDefault);

                                    return (
                                        <PromoCard
                                            key={promoId || Math.random()}
                                            icon={<FontAwesomeIcon icon={faPercent} className="text-pr-yellow text-5xl" />}
                                            title={title}
                                            description={description}
                                            points={puntosReq ? `${puntosReq} Puntos` : undefined}
                                            ctaText={ctaText}
                                            onClick={() => puntosReq && !isRedeeming && !isRedeemed ? openConfirm(p) : null}
                                            disabled={isRedeeming || isRedeemed}
                                        />
                                    );
                                })
                            ) : (
                                // Fallback: mostrar cards estáticas si no hay promos
                                <>
                                    <PromoCard icon={<FontAwesomeIcon icon={faPercent} className="text-pr-yellow text-5xl" />} title="Promoción Especial 1" description="Detalles de la promoción disponibles pronto." points="XXX Puntos" />
                                    <PromoCard icon={<FontAwesomeIcon icon={faWineBottle} className="text-pr-yellow text-5xl" />} title="Promoción Especial 2" description="Más detalles de la promoción aquí." points="XXX Puntos" />
                                    <PromoCard icon={<FontAwesomeIcon icon={faGift} className="text-pr-yellow text-5xl" />} title="Promoción Especial 3" description="Condiciones de la promoción a definir." points="XXX Puntos" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sección de Acceso Rápido */}
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Acceso Rápido</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <PromoCard icon={<FontAwesomeIcon icon={faBoxOpen} className="text-pr-yellow text-5xl" />} title="Pedidos Recientes" description="Consulta el estado de tus últimos pedidos." ctaText="Ver Pedidos" />
                            <PromoCard icon={<FontAwesomeIcon icon={faCoins} className="text-pr-yellow text-5xl" />} title="Puntos de Lealtad" description={`Saldo: ${points != null ? `${points} pts` : '--'}`} ctaText="Mis Puntos" />
                            <PromoCard icon={<FontAwesomeIcon icon={faLightbulb} className="text-pr-yellow text-5xl" />} title="Productos Recomendados" description="Descubre productos basados en tus preferencias." ctaText="Ver Recomendaciones" />

                        </div>
                    </div>
                    <ConfirmActionModal
                        isOpen={showConfirmModal}
                        onClose={closeConfirm}
                        onConfirm={handleConfirmRedeem}
                        title={`Canjear cupón`}
                        description={promoToConfirm ? `¿Deseas canjear "${promoToConfirm?.cupon_nombre || promoToConfirm?.cupon_descuento_promo_cli?.nombre_promo_desc || promoToConfirm?.nombre || promoToConfirm?.titulo || 'esta promoción'}" por ${promoToConfirm?.cupon_descuento_promo_cli?.puntos_requeridos_promo_desc || promoToConfirm?.puntos_requeridos || ''} puntos?` : ''}
                        confirmText="Canjear"
                        cancelText="Cancelar"
                        loading={promoToConfirm ? (redeemingIds.has(promoToConfirm?.id || promoToConfirm?.id_promo || promoToConfirm?.pk)) : false}
                    />
                </>
            )}
        </>
    );
};

export default ClienteHome;