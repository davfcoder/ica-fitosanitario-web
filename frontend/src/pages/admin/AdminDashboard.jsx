import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_GESTION, API_INSPECCION } from '../../api/axiosConfig';
import { FiUsers, FiMapPin, FiClipboard, FiCheckSquare, FiAlertCircle, FiFileText } from 'react-icons/fi';

const AdminDashboard = () => {
    const { usuario } = useAuth();
    const [stats, setStats] = useState({
        totalUsuarios: 0,
        totalProductores: 0,
        totalAsistentes: 0,
        solicitudesPendientes: 0,
        inspeccionesTotales: 0,
        inspeccionesMes: 0
    });
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarEstadisticas();
    }, []);

    const cargarEstadisticas = async () => {
        try {
            const [usuarios, contadores, statsInsp] = await Promise.allSettled([
                API_GESTION.get('/usuarios'),
                API_INSPECCION.get('/solicitudes/contadores'),
                API_INSPECCION.get('/inspecciones/estadisticas')
            ]);

            const listaUsuarios = usuarios.status === 'fulfilled' ? usuarios.value.data.data : [];
            const cont = contadores.status === 'fulfilled' ? contadores.value.data.data : {};
            const insp = statsInsp.status === 'fulfilled' ? statsInsp.value.data.data : {};

            setStats({
                totalUsuarios: listaUsuarios.length,
                totalProductores: listaUsuarios.filter(u => u.nom_rol === 'Productor').length,
                totalAsistentes: listaUsuarios.filter(u => u.nom_rol === 'Asistente Técnico').length,
                solicitudesPendientes: cont.pendientes || 0,
                inspeccionesTotales: insp.total_inspecciones || 0,
                inspeccionesMes: insp.inspecciones_mes || 0
            });
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        } finally {
            setCargando(false);
        }
    };

    if (cargando) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4">
                <h4 style={{ fontWeight: 700 }}>Dashboard Principal</h4>
                <p className="text-muted">Resumen general del sistema de inspecciones fitosanitarias</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#f59e0b' }}>
                        <FiClipboard />
                    </div>
                    <div className="stat-value">{stats.solicitudesPendientes}</div>
                    <div className="stat-label">Solicitudes de Inspección Pendientes</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#ef4444' }}>
                        <FiAlertCircle />
                    </div>
                    <div className="stat-value">{stats.solicitudesPendientes}</div>
                    <div className="stat-label">Inspecciones Pendientes</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#3b82f6' }}>
                        <FiUsers />
                    </div>
                    <div className="stat-value">{stats.totalProductores}</div>
                    <div className="stat-label">Total Productores Registrados</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#8b5cf6' }}>
                        <FiMapPin />
                    </div>
                    <div className="stat-value">{stats.totalAsistentes}</div>
                    <div className="stat-label">Total Asistentes Técnicos</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#10b981' }}>
                        <FiCheckSquare />
                    </div>
                    <div className="stat-value">{stats.inspeccionesMes}</div>
                    <div className="stat-label">Inspecciones del Mes</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#06b6d4' }}>
                        <FiFileText />
                    </div>
                    <div className="stat-value">{stats.inspeccionesTotales}</div>
                    <div className="stat-label">Inspecciones Totales</div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;