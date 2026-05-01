import { useState, useEffect } from 'react';
import { API_GESTION, API_INSPECCION } from '../../api/axiosConfig';
import {
    FiSearch, FiFilter, FiClipboard, FiAlertCircle,
    FiEye, FiUserPlus, FiClock, FiCheck, FiUser, FiCalendar
} from 'react-icons/fi';

import { FiXCircle } from 'react-icons/fi';
import { FiEdit2 } from 'react-icons/fi';

const SolicitudesAdmin = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [asistentes, setAsistentes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // Modal asignar
    const [modalAsignar, setModalAsignar] = useState(null);
    const [formAsignar, setFormAsignar] = useState({ id_asistente_asignado: '', fec_programada: '' });
    const [asignando, setAsignando] = useState(false);
    const [errorAsignar, setErrorAsignar] = useState('');

    // Modal detalle
    const [modalDetalle, setModalDetalle] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    // Estado
    const [modalCancelar, setModalCancelar] = useState(null);
    const [motivoCancelacion, setMotivoCancelacion] = useState('');
    const [cancelando, setCancelando] = useState(false);
    const [errorCancelar, setErrorCancelar] = useState('');

    // Estado
    const [modalReasignar, setModalReasignar] = useState(null);
    const [formReasignar, setFormReasignar] = useState({ id_asistente_asignado: '', fec_programada: '' });
    const [reasignando, setReasignando] = useState(false);
    const [errorReasignar, setErrorReasignar] = useState('');

    const abrirModalReasignar = (solicitud) => {
        setModalReasignar(solicitud);
        setFormReasignar({
            id_asistente_asignado: solicitud.id_asistente_asignado || '',
            fec_programada: solicitud.fec_programada ? solicitud.fec_programada.split('T')[0] : ''
        });
        setErrorReasignar('');
    };

    const reasignarSolicitud = async () => {
        if (!formReasignar.id_asistente_asignado || !formReasignar.fec_programada) {
            setErrorReasignar('Debe seleccionar un asistente y una fecha');
            return;
        }
        setReasignando(true);
        setErrorReasignar('');
        try {
            await API_INSPECCION.patch(`/solicitudes/${modalReasignar.id_solicitud}/reasignar`, {
                id_asistente_asignado: Number(formReasignar.id_asistente_asignado),
                fec_programada: formReasignar.fec_programada
            });
            setExito('Solicitud reasignada exitosamente');
            setModalReasignar(null);
            cargarDatos();
            setTimeout(() => setExito(''), 4000);
        } catch (err) {
            setErrorReasignar(err.response?.data?.error || 'Error al reasignar');
        } finally {
            setReasignando(false);
        }
    };

    const abrirModalCancelar = (solicitud) => {
        setModalCancelar(solicitud);
        setMotivoCancelacion('');
        setErrorCancelar('');
    };

    const cancelarSolicitud = async () => {
        if (!motivoCancelacion.trim()) {
            setErrorCancelar('Debe indicar el motivo de la cancelación');
            return;
        }
        setCancelando(true);
        setErrorCancelar('');
        try {
            await API_INSPECCION.patch(`/solicitudes/${modalCancelar.id_solicitud}/cancelar`, {
                observaciones: motivoCancelacion
            });
            setExito('Solicitud cancelada exitosamente');
            setModalCancelar(null);
            cargarDatos();
            setTimeout(() => setExito(''), 4000);
        } catch (err) {
            setErrorCancelar(err.response?.data?.error || 'Error al cancelar');
        } finally {
            setCancelando(false);
        }
    };

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [solicitudesRes, asistentesRes] = await Promise.all([
                API_INSPECCION.get('/solicitudes'),
                API_GESTION.get('/usuarios?rol=3') // Asistentes técnicos
            ]);
            setSolicitudes(solicitudesRes.data.data);
            setAsistentes(asistentesRes.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar datos');
        } finally {
            setCargando(false);
        }
    };

    const abrirModalAsignar = (solicitud) => {
        setModalAsignar(solicitud);
        setFormAsignar({ id_asistente_asignado: '', fec_programada: '' });
        setErrorAsignar('');
    };

    const asignarAsistente = async () => {
        if (!formAsignar.id_asistente_asignado || !formAsignar.fec_programada) {
            setErrorAsignar('Debe seleccionar un asistente y una fecha');
            return;
        }

        setAsignando(true);
        setErrorAsignar('');

        try {
            await API_INSPECCION.patch(`/solicitudes/${modalAsignar.id_solicitud}/asignar`, {
                id_asistente_asignado: Number(formAsignar.id_asistente_asignado),
                fec_programada: formAsignar.fec_programada
            });
            setExito('Asistente técnico asignado exitosamente');
            setModalAsignar(null);
            cargarDatos();
            setTimeout(() => setExito(''), 4000);
        } catch (err) {
            setErrorAsignar(err.response?.data?.error || 'Error al asignar');
        } finally {
            setAsignando(false);
        }
    };

    const getEstadoBadge = (estado) => {
        const config = {
            'pendiente': { clase: 'bg-warning text-dark', icono: <FiClock size={12} className="me-1" /> },
            'asignada': { clase: 'bg-info text-dark', icono: <FiUser size={12} className="me-1" /> },
            'en_proceso': { clase: 'bg-primary', icono: <FiClipboard size={12} className="me-1" /> },
            'completada': { clase: 'bg-success', icono: <FiCheck size={12} className="me-1" /> },
            'cancelada': { clase: 'bg-danger', icono: <FiXCircle size={12} className="me-1" /> },
            'inconclusa': { clase: 'bg-secondary', icono: <FiAlertCircle size={12} className="me-1" /> }
        };
        const c = config[estado] || { clase: 'bg-secondary', icono: null };
        const etiquetas = { 'en_proceso': 'En proceso' };
        return <span className={`badge ${c.clase}`}>{c.icono}{etiquetas[estado] || estado}</span>;
    };

    const solicitudesFiltradas = solicitudes.filter(s => {
        const coincideBusqueda =
            s.nom_lugar_produccion?.toLowerCase().includes(busqueda.toLowerCase()) ||
            s.solicitante_nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
            s.solicitante_apellidos?.toLowerCase().includes(busqueda.toLowerCase()) ||
            s.motivo?.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEstado = !filtroEstado || s.estado === filtroEstado;
        return coincideBusqueda && coincideEstado;
    });

    // Contadores rápidos
    const contadores = {
        pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
        asignadas: solicitudes.filter(s => s.estado === 'asignada').length,
        en_proceso: solicitudes.filter(s => s.estado === 'en_proceso').length,
        completadas: solicitudes.filter(s => s.estado === 'completada').length,
        canceladas: solicitudes.filter(s => s.estado === 'cancelada').length,
        inconclusas: solicitudes.filter(s => s.estado === 'inconclusa').length
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
            {/* Header */}
            <div className="mb-4">
                <h4 style={{ fontWeight: 700 }}>
                    <FiClipboard className="me-2" /> Solicitudes de Inspección
                </h4>
                <p className="text-muted mb-0">Gestión y asignación de inspecciones fitosanitarias</p>
            </div>

            {exito && <div className="alert alert-success py-2">{exito}</div>}
            {error && <div className="alert alert-danger py-2">{error}</div>}

            {/* Contadores */}
            <div className="row g-3 mb-4">
                {[
                    { label: 'Pendientes', valor: contadores.pendientes, color: '#ffc107', filtro: 'pendiente' },
                    { label: 'Asignadas', valor: contadores.asignadas, color: '#0dcaf0', filtro: 'asignada' },
                    { label: 'En proceso', valor: contadores.en_proceso, color: '#0d6efd', filtro: 'en_proceso' },
                    { label: 'Completadas', valor: contadores.completadas, color: '#198754', filtro: 'completada' },
                    { label: 'Canceladas', valor: contadores.canceladas, color: '#dc3545', filtro: 'cancelada' },
                    { label: 'Inconclusas', valor: contadores.inconclusas, color: '#6c757d', filtro: 'inconclusa' }
                ].map(c => (
                    <div className="col-6 col-md-3" key={c.label}>
                        <div className="content-card text-center"
                            style={{ cursor: 'pointer', borderLeft: `4px solid ${c.color}` }}
                            onClick={() => setFiltroEstado(filtroEstado === c.filtro ? '' : c.filtro)}>
                            <h3 className="fw-bold mb-0">{c.valor}</h3>
                            <small className="text-muted">{c.label}</small>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="content-card mb-4">
                <div className="row g-3">
                    <div className="col-md-8">
                        <div className="input-group">
                            <span className="input-group-text"><FiSearch /></span>
                            <input type="text" className="form-control"
                                placeholder="Buscar por lugar, solicitante o motivo..."
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
                                <option value="cancelada">Cancelada</option>
                                <option value="inconclusa">Inconclusa</option>
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
                                <th>Solicitante</th>
                                <th>Motivo</th>
                                <th>Estado</th>
                                <th>Asistente</th>
                                <th>Fecha Prog.</th>
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
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {sol.solicitante_nombres} {sol.solicitante_apellidos}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{sol.motivo}</td>
                                        <td>{getEstadoBadge(sol.estado)}</td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {sol.asistente_nombres
                                                ? `${sol.asistente_nombres} ${sol.asistente_apellidos}`
                                                : <span className="text-muted">—</span>}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {sol.fec_programada
                                                ? new Date(sol.fec_programada).toLocaleDateString('es-CO')
                                                : '-'}
                                        </td>
                                        <td className="text-center">
                                            <div className="d-flex justify-content-center gap-1">
                                                <button className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => setModalDetalle(sol)} title="Ver detalle">
                                                    <FiEye />
                                                </button>
                                                {sol.estado === 'pendiente' && (
                                                    <button className="btn btn-sm btn-outline-success"
                                                        onClick={() => abrirModalAsignar(sol)} title="Asignar asistente">
                                                        <FiUserPlus />
                                                    </button>
                                                )}
                                                {(sol.estado === 'pendiente' || sol.estado === 'asignada') && (
                                                    <button className="btn btn-sm btn-outline-danger"
                                                        onClick={() => abrirModalCancelar(sol)} title="Cancelar solicitud">
                                                        <FiXCircle />
                                                    </button>
                                                )}
                                                {sol.estado === 'asignada' && (
                                                    <button className="btn btn-sm btn-outline-primary"
                                                        onClick={() => abrirModalReasignar(sol)} title="Reasignar">
                                                        <FiEdit2 />
                                                    </button>
                                                )}
                                            </div>
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

            {/* Modal Asignar Asistente */}
            {modalAsignar && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Asignar Asistente Técnico</h5>
                                <button type="button" className="btn-close" onClick={() => setModalAsignar(null)} />
                            </div>
                            <div className="modal-body">
                                {errorAsignar && (
                                    <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                                        <FiAlertCircle /> <span>{errorAsignar}</span>
                                    </div>
                                )}

                                <p className="fw-bold mb-1">Solicitud #{modalAsignar.id_solicitud}</p>
                                <p className="text-muted small mb-3">
                                    Lugar: {modalAsignar.nom_lugar_produccion} — Motivo: {modalAsignar.motivo}
                                </p>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        <FiUser className="me-1" /> Asistente Técnico *
                                    </label>
                                    <select className="form-select"
                                        value={formAsignar.id_asistente_asignado}
                                        onChange={(e) => setFormAsignar(prev => ({ ...prev, id_asistente_asignado: e.target.value }))}>
                                        <option value="">Seleccione asistente...</option>
                                        {asistentes.map(a => (
                                            <option key={a.id_usuario} value={a.id_usuario}>
                                                {a.nombres} {a.apellidos}
                                                {a.tarjeta_profesional ? ` — TP: ${a.tarjeta_profesional}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        <FiCalendar className="me-1" /> Fecha Programada *
                                    </label>
                                    <input type="date" className="form-control"
                                        value={formAsignar.fec_programada}
                                        onChange={(e) => setFormAsignar(prev => ({ ...prev, fec_programada: e.target.value }))}
                                        min={new Date().toISOString().split('T')[0]} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setModalAsignar(null)}>
                                    Cancelar
                                </button>
                                <button className="btn btn-success text-white" onClick={asignarAsistente}
                                    disabled={asignando}>
                                    <FiUserPlus className="me-1" />
                                    {asignando ? 'Asignando...' : 'Asignar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detalle */}
            {modalDetalle && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Solicitud #{modalDetalle.id_solicitud}</h5>
                                <button type="button" className="btn-close" onClick={() => setModalDetalle(null)} />
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-6"><strong>Lugar:</strong><div>{modalDetalle.nom_lugar_produccion}</div></div>
                                    <div className="col-6"><strong>Estado:</strong><div>{getEstadoBadge(modalDetalle.estado)}</div></div>
                                    <div className="col-12"><strong>Motivo:</strong><div>{modalDetalle.motivo}</div></div>
                                    <div className="col-6"><strong>Solicitante:</strong><div>{modalDetalle.solicitante_nombres} {modalDetalle.solicitante_apellidos}</div></div>
                                    <div className="col-6"><strong>Fecha solicitud:</strong><div>{new Date(modalDetalle.fec_solicitud).toLocaleDateString('es-CO')}</div></div>
                                    {modalDetalle.asistente_nombres && (
                                        <div className="col-6"><strong>Asistente:</strong><div>{modalDetalle.asistente_nombres} {modalDetalle.asistente_apellidos}</div></div>
                                    )}
                                    {modalDetalle.fec_programada && (
                                        <div className="col-6"><strong>Fecha prog.:</strong><div>{new Date(modalDetalle.fec_programada).toLocaleDateString('es-CO')}</div></div>
                                    )}
                                    {modalDetalle.fec_completada && (
                                        <div className="col-12"><strong>Completada:</strong><div>{new Date(modalDetalle.fec_completada).toLocaleDateString('es-CO')}</div></div>
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
            {/* Modal Cancelar */}
            {modalCancelar && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Cancelar Solicitud #{modalCancelar.id_solicitud}</h5>
                                <button type="button" className="btn-close" onClick={() => setModalCancelar(null)} />
                            </div>
                            <div className="modal-body">
                                {errorCancelar && (
                                    <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                                        <FiAlertCircle /> <span>{errorCancelar}</span>
                                    </div>
                                )}
                                <p className="text-muted mb-1">Lugar: {modalCancelar.nom_lugar_produccion}</p>
                                <p className="text-muted small mb-3">Motivo original: {modalCancelar.motivo}</p>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Motivo de la cancelación *</label>
                                    <textarea className="form-control" rows="3" value={motivoCancelacion}
                                        onChange={(e) => setMotivoCancelacion(e.target.value)}
                                        placeholder="Indique por qué se cancela esta solicitud..." />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setModalCancelar(null)}>Volver</button>
                                <button className="btn btn-danger text-white" onClick={cancelarSolicitud} disabled={cancelando}>
                                    {cancelando ? 'Cancelando...' : 'Cancelar Solicitud'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Reasignar */}
            {modalReasignar && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Reasignar Solicitud #{modalReasignar.id_solicitud}</h5>
                                <button type="button" className="btn-close" onClick={() => setModalReasignar(null)} />
                            </div>
                            <div className="modal-body">
                                {errorReasignar && (
                                    <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                                        <FiAlertCircle /> <span>{errorReasignar}</span>
                                    </div>
                                )}
                                <p className="text-muted small mb-3">
                                    Lugar: {modalReasignar.nom_lugar_produccion}
                                </p>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Asistente Técnico *</label>
                                    <select className="form-select" value={formReasignar.id_asistente_asignado}
                                        onChange={(e) => setFormReasignar(prev => ({ ...prev, id_asistente_asignado: e.target.value }))}>
                                        <option value="">Seleccione asistente...</option>
                                        {asistentes.map(a => (
                                            <option key={a.id_usuario} value={a.id_usuario}>
                                                {a.nombres} {a.apellidos}
                                                {a.tarjeta_profesional ? ` — TP: ${a.tarjeta_profesional}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Fecha Programada *</label>
                                    <input type="date" className="form-control" value={formReasignar.fec_programada}
                                        onChange={(e) => setFormReasignar(prev => ({ ...prev, fec_programada: e.target.value }))}
                                        min={new Date().toISOString().split('T')[0]} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setModalReasignar(null)}>Cancelar</button>
                                <button className="btn btn-primary text-white" onClick={reasignarSolicitud} disabled={reasignando}>
                                    {reasignando ? 'Reasignando...' : 'Reasignar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SolicitudesAdmin;