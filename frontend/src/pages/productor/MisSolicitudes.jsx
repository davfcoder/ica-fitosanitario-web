import { useState, useEffect } from 'react';
import { API_GESTION, API_INSPECCION } from '../../api/axiosConfig';
import {
    FiPlus, FiSearch, FiSave, FiX, FiClipboard,
    FiAlertCircle, FiEye, FiClock, FiCheck, FiXCircle,
    FiUser, FiCalendar, FiFilter
} from 'react-icons/fi';

const MisSolicitudes = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [lugares, setLugares] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // Formulario
    const [mostrarForm, setMostrarForm] = useState(false);
    const [form, setForm] = useState({ id_lugar_produccion: '', motivo: '', observaciones_productor: '' });
    const [guardando, setGuardando] = useState(false);

    // Modal detalle
    const [modalDetalle, setModalDetalle] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [solicitudesRes, lugaresRes] = await Promise.all([
                API_INSPECCION.get('/solicitudes'),
                API_GESTION.get('/lugares-produccion')
            ]);
            setSolicitudes(solicitudesRes.data.data);
            // Solo lugares aprobados con lotes para solicitar inspección
            setLugares(lugaresRes.data.data.filter(l => l.estado === 'aprobado'));
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar datos');
        } finally {
            setCargando(false);
        }
    };

    const abrirFormCrear = () => {
        setForm({ id_lugar_produccion: '', motivo: '', observaciones_productor: '' });
        setMostrarForm(true);
        setError('');
        setExito('');
    };

    const cerrarForm = () => {
        setMostrarForm(false);
        setForm({ id_lugar_produccion: '', motivo: '' });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');
        setGuardando(true);

        try {
           await API_INSPECCION.post('/solicitudes', {
            id_lugar_produccion: Number(form.id_lugar_produccion),
            motivo: form.motivo,
            observaciones_productor: form.observaciones_productor || null
        });
            setExito('Solicitud de inspección creada exitosamente');
            cerrarForm();
            cargarDatos();
            setTimeout(() => setExito(''), 4000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al crear solicitud');
        } finally {
            setGuardando(false);
        }
    };

    const getEstadoBadge = (estado) => {
        const config = {
            'pendiente': { clase: 'bg-warning text-dark', icono: <FiClock size={12} className="me-1" /> },
            'asignada': { clase: 'bg-info text-dark', icono: <FiUser size={12} className="me-1" /> },
            'en_proceso': { clase: 'bg-primary', icono: <FiClipboard size={12} className="me-1" /> },
            'completada': { clase: 'bg-success', icono: <FiCheck size={12} className="me-1" /> }
        };
        const c = config[estado] || { clase: 'bg-secondary', icono: null };
        const etiquetas = { 'en_proceso': 'En proceso' };
        return <span className={`badge ${c.clase}`}>{c.icono}{etiquetas[estado] || estado}</span>;
    };

    const solicitudesFiltradas = solicitudes.filter(s => {
        const coincideBusqueda =
            s.nom_lugar_produccion?.toLowerCase().includes(busqueda.toLowerCase()) ||
            s.motivo?.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEstado = !filtroEstado || s.estado === filtroEstado;
        return coincideBusqueda && coincideEstado;
    });

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
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h4 style={{ fontWeight: 700 }}>
                        <FiClipboard className="me-2" /> Mis Solicitudes de Inspección
                    </h4>
                    <p className="text-muted mb-0">Solicite y haga seguimiento de inspecciones fitosanitarias</p>
                </div>
                {lugares.length > 0 && (
                    <button className="btn btn-primary-productor text-white" onClick={abrirFormCrear}>
                        <FiPlus className="me-2" /> Nueva Solicitud
                    </button>
                )}
            </div>

            {exito && <div className="alert alert-success py-2">{exito}</div>}

            {lugares.length === 0 && (
                <div className="alert alert-info">
                    <FiAlertCircle className="me-2" />
                    No tiene lugares de producción aprobados. Debe tener un lugar aprobado para solicitar inspecciones.
                </div>
            )}

            {/* Formulario */}
            {mostrarForm && (
                <div className="content-card mb-4 border-start border-4" style={{ borderColor: 'var(--color-productor)' }}>
                    <h6 className="fw-bold mb-3">Nueva Solicitud de Inspección</h6>
                    {error && (
                        <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                            <FiAlertCircle /> <span>{error}</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Lugar de Producción *</label>
                                <select
                                    className="form-select" value={form.id_lugar_produccion}
                                    onChange={(e) => setForm(prev => ({ ...prev, id_lugar_produccion: e.target.value }))}
                                    required
                                >
                                    <option value="">Seleccione lugar...</option>
                                    {lugares.map(l => (
                                        <option key={l.id_lugar_produccion} value={l.id_lugar_produccion}>
                                            {l.nom_lugar_produccion}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Motivo de la Inspección *</label>
                                <select
                                    className="form-select" value={form.motivo}
                                    onChange={(e) => setForm(prev => ({ ...prev, motivo: e.target.value }))}
                                    required
                                >
                                    <option value="">Seleccione motivo...</option>
                                    <option value="Inspección de rutina">Inspección de rutina</option>
                                    <option value="Sospecha de plaga">Sospecha de plaga</option>
                                    <option value="Certificación para exportación">Certificación para exportación</option>
                                    <option value="Seguimiento fitosanitario">Seguimiento fitosanitario</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-semibold">Observaciones (opcional)</label>
                                <textarea
                                    className="form-control" rows="3"
                                    value={form.observaciones_productor}
                                    onChange={(e) => setForm(prev => ({ ...prev, observaciones_productor: e.target.value }))}
                                    placeholder="Detalles adicionales sobre la solicitud..."
                                />
                            </div>
                        </div>
                        <div className="d-flex gap-2 mt-3 pt-3 border-top">
                            <button type="submit" className="btn btn-primary-productor text-white" disabled={guardando}>
                                <FiSave className="me-2" />
                                {guardando ? 'Enviando...' : 'Enviar Solicitud'}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={cerrarForm}>
                                <FiX className="me-2" /> Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filtros */}
            <div className="content-card mb-4">
                <div className="row g-3">
                    <div className="col-md-8">
                        <div className="input-group">
                            <span className="input-group-text"><FiSearch /></span>
                            <input type="text" className="form-control"
                                placeholder="Buscar por lugar o motivo..."
                                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="input-group">
                            <span className="input-group-text"><FiFilter /></span>
                            <select className="form-select" value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}>
                                <option value="">Todos los estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="asignada">Asignada</option>
                                <option value="en_proceso">En proceso</option>
                                <option value="completada">Completada</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="content-card">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>#</th>
                                <th>Lugar de Producción</th>
                                <th>Motivo</th>
                                <th>Estado</th>
                                <th>Asistente</th>
                                <th>Fecha Programada</th>
                                <th>Fecha Solicitud</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {solicitudesFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center text-muted py-4">
                                        No se encontraron solicitudes
                                    </td>
                                </tr>
                            ) : (
                                solicitudesFiltradas.map(sol => (
                                    <tr key={sol.id_solicitud}>
                                        <td><strong>{sol.id_solicitud}</strong></td>
                                        <td>{sol.nom_lugar_produccion}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{sol.motivo}</td>
                                        <td>{getEstadoBadge(sol.estado)}</td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {sol.asistente_nombres
                                                ? `${sol.asistente_nombres} ${sol.asistente_apellidos}`
                                                : <span className="text-muted">Sin asignar</span>}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {sol.fec_programada
                                                ? new Date(sol.fec_programada).toLocaleDateString('es-CO')
                                                : '-'}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {new Date(sol.fec_solicitud).toLocaleDateString('es-CO')}
                                        </td>
                                        <td className="text-center">
                                            <button className="btn btn-sm btn-outline-secondary"
                                                onClick={() => setModalDetalle(sol)} title="Ver detalle">
                                                <FiEye />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-3 text-muted small">
                    Mostrando {solicitudesFiltradas.length} de {solicitudes.length} solicitudes
                </div>
            </div>

            {/* Modal Detalle */}
            {modalDetalle && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Solicitud #{modalDetalle.id_solicitud}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setModalDetalle(null)} />
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-6">
                                        <strong>Lugar:</strong>
                                        <div>{modalDetalle.nom_lugar_produccion}</div>
                                    </div>
                                    <div className="col-6">
                                        <strong>Estado:</strong>
                                        <div>{getEstadoBadge(modalDetalle.estado)}</div>
                                    </div>
                                    <div className="col-12">
                                        <strong>Motivo:</strong>
                                        <div>{modalDetalle.motivo}</div>
                                    </div>
                                    <div className="col-6">
                                        <strong>Fecha solicitud:</strong>
                                        <div>{new Date(modalDetalle.fec_solicitud).toLocaleDateString('es-CO')}</div>
                                    </div>
                                    <div className="col-6">
                                        <strong>Fecha programada:</strong>
                                        <div>{modalDetalle.fec_programada
                                            ? new Date(modalDetalle.fec_programada).toLocaleDateString('es-CO')
                                            : 'Pendiente'}</div>
                                    </div>
                                    {modalDetalle.asistente_nombres && (
                                        <div className="col-12">
                                            <strong>Asistente asignado:</strong>
                                            <div>{modalDetalle.asistente_nombres} {modalDetalle.asistente_apellidos}</div>
                                        </div>
                                    )}
                                    {modalDetalle.fec_completada && (
                                        <div className="col-12">
                                            <strong>Fecha completada:</strong>
                                            <div>{new Date(modalDetalle.fec_completada).toLocaleDateString('es-CO')}</div>
                                        </div>
                                    )}
                                    {modalDetalle.observaciones_productor && (
                                        <div className="col-12">
                                            <strong>Observaciones del productor:</strong>
                                            <div className="text-muted">{modalDetalle.observaciones_productor}</div>
                                        </div>
                                    )}
                                    {modalDetalle.observaciones_admin && (
                                        <div className="col-12">
                                            <strong>Observaciones del administrador:</strong>
                                            <div className="text-muted">{modalDetalle.observaciones_admin}</div>
                                        </div>
                                    )}
                                    {modalDetalle.observaciones_asistente && (
                                        <div className="col-12">
                                            <strong>Observaciones del asistente:</strong>
                                            <div className="text-muted">{modalDetalle.observaciones_asistente}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setModalDetalle(null)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MisSolicitudes;