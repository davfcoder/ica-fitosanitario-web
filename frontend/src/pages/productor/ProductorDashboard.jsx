import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_GESTION, API_INSPECCION } from '../../api/axiosConfig';
import {
    FiMapPin, FiLayers, FiClipboard, FiFileText,
    FiClock, FiCheck, FiXCircle, FiAlertCircle,
    FiArrowRight, FiPlus
} from 'react-icons/fi';

const ProductorDashboard = () => {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalLugares: 0,
        lugaresAprobados: 0,
        lugaresPendientes: 0,
        totalLotes: 0,
        solicitudesInspeccion: 0,
        inspeccionesCompletadas: 0
    });
    const [lugares, setLugares] = useState([]);
    const [solicitudes, setSolicitudes] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [lugaresRes, solicitudesRes] = await Promise.allSettled([
                API_GESTION.get('/lugares-produccion'),
                API_INSPECCION.get('/solicitudes')
            ]);

            const misLugares = lugaresRes.status === 'fulfilled'
                ? lugaresRes.value.data.data : [];
            const misSolicitudes = solicitudesRes.status === 'fulfilled'
                ? solicitudesRes.value.data.data : [];

            setLugares(misLugares);
            setSolicitudes(misSolicitudes);

            // Cargar lotes de lugares aprobados
            let totalLotes = 0;
            const lugaresAprobados = misLugares.filter(l => l.estado === 'aprobado');
            for (const lugar of lugaresAprobados) {
                try {
                    const lotesRes = await API_GESTION.get(`/lotes?lugar=${lugar.id_lugar_produccion}`);
                    totalLotes += lotesRes.data.data.length;
                } catch (err) {
                    // Silenciar
                }
            }

            setStats({
                totalLugares: misLugares.length,
                lugaresAprobados: lugaresAprobados.length,
                lugaresPendientes: misLugares.filter(l => l.estado === 'pendiente').length,
                totalLotes,
                solicitudesInspeccion: misSolicitudes.length,
                inspeccionesCompletadas: misSolicitudes.filter(s => s.estado === 'completada').length
            });
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setCargando(false);
        }
    };

    const getEstadoBadge = (estado) => {
        const config = {
            'pendiente': { clase: 'bg-warning text-dark', icono: <FiClock size={12} /> },
            'aprobado': { clase: 'bg-success', icono: <FiCheck size={12} /> },
            'rechazado': { clase: 'bg-danger', icono: <FiXCircle size={12} /> },
            'devuelto': { clase: 'bg-info text-dark', icono: <FiAlertCircle size={12} /> },
            'asignada': { clase: 'bg-primary', icono: <FiCheck size={12} /> },
            'en_proceso': { clase: 'bg-info text-dark', icono: <FiClock size={12} /> },
            'completada': { clase: 'bg-success', icono: <FiCheck size={12} /> }
        };
        const c = config[estado] || { clase: 'bg-secondary', icono: null };
        return <span className={`badge ${c.clase} d-inline-flex align-items-center gap-1`}>{c.icono} {estado}</span>;
    };

    if (cargando) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border" style={{ color: 'var(--color-productor)' }} role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Bienvenida */}
            <div className="mb-4">
                <h4 style={{ fontWeight: 700 }}>
                    Bienvenido, {usuario?.nombres}
                </h4>
                <p className="text-muted">Resumen de sus lugares de producción e inspecciones</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/productor/lugares')}>
                    <div className="stat-icon" style={{ background: '#ff8c42' }}>
                        <FiMapPin />
                    </div>
                    <div className="stat-value">{stats.totalLugares}</div>
                    <div className="stat-label">Lugares de Producción</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#10b981' }}>
                        <FiCheck />
                    </div>
                    <div className="stat-value">{stats.lugaresAprobados}</div>
                    <div className="stat-label">Lugares Aprobados</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#f59e0b' }}>
                        <FiClock />
                    </div>
                    <div className="stat-value">{stats.lugaresPendientes}</div>
                    <div className="stat-label">Pendientes de Aprobación</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#3b82f6' }}>
                        <FiLayers />
                    </div>
                    <div className="stat-value">{stats.totalLotes}</div>
                    <div className="stat-label">Total de Lotes</div>
                </div>

                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/productor/inspecciones')}>
                    <div className="stat-icon" style={{ background: '#8b5cf6' }}>
                        <FiClipboard />
                    </div>
                    <div className="stat-value">{stats.solicitudesInspeccion}</div>
                    <div className="stat-label">Solicitudes de Inspección</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#06b6d4' }}>
                        <FiFileText />
                    </div>
                    <div className="stat-value">{stats.inspeccionesCompletadas}</div>
                    <div className="stat-label">Inspecciones Completadas</div>
                </div>
            </div>

            {/* Sección de accesos rápidos + info reciente */}
            <div className="row g-4 mt-2">
                {/* Accesos rápidos */}
                <div className="col-lg-4">
                    <div className="content-card h-100">
                        <h6 className="fw-bold mb-3">Acciones Rápidas</h6>
                        <div className="d-grid gap-2">
                            <button
                                className="btn btn-primary-productor text-white d-flex align-items-center justify-content-between"
                                onClick={() => navigate('/productor/lugares')}
                            >
                                <span><FiPlus className="me-2" /> Solicitar Lugar de Producción</span>
                                <FiArrowRight />
                            </button>
                            <button
                                className="btn btn-outline-secondary d-flex align-items-center justify-content-between"
                                onClick={() => navigate('/productor/inspecciones')}
                            >
                                <span><FiClipboard className="me-2" /> Solicitar Inspección</span>
                                <FiArrowRight />
                            </button>
                            <button
                                className="btn btn-outline-secondary d-flex align-items-center justify-content-between"
                                onClick={() => navigate('/productor/reportes')}
                            >
                                <span><FiFileText className="me-2" /> Ver Reportes</span>
                                <FiArrowRight />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mis lugares recientes */}
                <div className="col-lg-8">
                    <div className="content-card h-100">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0">Mis Lugares de Producción</h6>
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => navigate('/productor/lugares')}
                            >
                                Ver todos <FiArrowRight className="ms-1" />
                            </button>
                        </div>

                        {lugares.length === 0 ? (
                            <div className="text-center text-muted py-4">
                                <FiMapPin size={32} className="mb-2 opacity-50" />
                                <p className="mb-0">Aún no tiene lugares de producción</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-sm table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Registro ICA</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lugares.slice(0, 5).map(lugar => (
                                            <tr key={lugar.id_lugar_produccion}>
                                                <td className="fw-semibold">{lugar.nom_lugar_produccion}</td>
                                                <td>
                                                    {lugar.nro_registro_ica || (
                                                        <span className="text-muted small">Pendiente</span>
                                                    )}
                                                </td>
                                                <td>{getEstadoBadge(lugar.estado)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Solicitudes de inspección recientes */}
            {solicitudes.length > 0 && (
                <div className="content-card mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">Últimas Solicitudes de Inspección</h6>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => navigate('/productor/inspecciones')}
                        >
                            Ver todas <FiArrowRight className="ms-1" />
                        </button>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-sm table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Lugar</th>
                                    <th>Motivo</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {solicitudes.slice(0, 5).map(sol => (
                                    <tr key={sol.id_solicitud}>
                                        <td><strong>#{sol.id_solicitud}</strong></td>
                                        <td>{sol.nom_lugar_produccion}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{sol.motivo}</td>
                                        <td>{getEstadoBadge(sol.estado)}</td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {sol.fec_solicitud
                                                ? new Date(sol.fec_solicitud).toLocaleDateString('es-CO')
                                                : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductorDashboard;