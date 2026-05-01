import { useState, useEffect } from 'react';
import { API_GESTION, API_INSPECCION } from '../../api/axiosConfig';
import {
    FiClipboard, FiSearch, FiFilter, FiEye, FiPlay,
    FiCheck, FiClock, FiUser, FiCalendar, FiAlertCircle,
    FiMapPin
} from 'react-icons/fi';

import { FiXCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AsistenteDashboard = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // Modal detalle
    const [modalDetalle, setModalDetalle] = useState(null);
    const [lotesLugar, setLotesLugar] = useState([]);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    // Modal inconclusa
    const [modalInconclusa, setModalInconclusa] = useState(null);
    const [motivoInconclusa, setMotivoInconclusa] = useState('');
    const [enviandoInconclusa, setEnviandoInconclusa] = useState(false);
    const [errorInconclusa, setErrorInconclusa] = useState('');

    // Acciones
    const [ejecutando, setEjecutando] = useState(false);
    
    const navigate = useNavigate();
    
    const [modalReporte, setModalReporte] = useState(null);
    const [inspecciones, setInspecciones] = useState([]);
    const [cargandoReporte, setCargandoReporte] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    const verReporte = async (solicitud) => {
        try {
            setCargandoReporte(true);
            const res = await API_INSPECCION.get(`/inspecciones/solicitud/${solicitud.id_solicitud}`);
            setInspecciones(res.data.data);
            setModalReporte(solicitud);
        } catch (err) {
            setError('Error al cargar reporte');
            setTimeout(() => setError(''), 3000);
        } finally {
            setCargandoReporte(false);
        }
    };

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const res = await API_INSPECCION.get('/solicitudes');
            setSolicitudes(res.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar inspecciones');
        } finally {
            setCargando(false);
        }
    };

    const verDetalle = async (solicitud) => {
        try {
            setCargandoDetalle(true);
            setModalDetalle(solicitud);

            // Cargar lotes activos del lugar
            const lotesRes = await API_GESTION.get(
                `/lotes?lugar=${solicitud.id_lugar_produccion}&activos=true`
            );
            setLotesLugar(lotesRes.data.data);
        } catch (err) {
            setLotesLugar([]);
        } finally {
            setCargandoDetalle(false);
        }
    };

    const iniciarInspeccion = async (idSolicitud) => {
        try {
            setEjecutando(true);
            await API_INSPECCION.patch(`/solicitudes/${idSolicitud}/iniciar`);
            setExito('Inspección iniciada. Puede proceder al registro en campo.');
            setModalDetalle(null);
            cargarDatos();
            setTimeout(() => setExito(''), 4000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al iniciar inspección');
            setTimeout(() => setError(''), 4000);
        } finally {
            setEjecutando(false);
        }
    };

    const completarInspeccion = async (idSolicitud) => {
        try {
            setEjecutando(true);
            await API_INSPECCION.patch(`/solicitudes/${idSolicitud}/completar`);
            setExito('Inspección marcada como completada.');
            setModalDetalle(null);
            cargarDatos();
            setTimeout(() => setExito(''), 4000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al completar inspección');
            setTimeout(() => setError(''), 4000);
        } finally {
            setEjecutando(false);
        }
    };

    const getEstadoBadge = (estado) => {
        const config = {
            'asignada': { clase: 'bg-info text-dark', icono: <FiClock size={12} className="me-1" /> },
            'en_proceso': { clase: 'bg-primary', icono: <FiClipboard size={12} className="me-1" /> },
            'completada': { clase: 'bg-success', icono: <FiCheck size={12} className="me-1" /> },
            'inconclusa': { clase: 'bg-secondary', icono: <FiAlertCircle size={12} className="me-1" /> },
            'cancelada': { clase: 'bg-danger', icono: <FiXCircle size={12} className="me-1" /> }
        };
        const c = config[estado] || { clase: 'bg-secondary', icono: null };
        const etiquetas = { 'en_proceso': 'En proceso' };
        return <span className={`badge ${c.clase}`}>{c.icono}{etiquetas[estado] || estado}</span>;
    };

    const contadores = {
        asignadas: solicitudes.filter(s => s.estado === 'asignada').length,
        en_proceso: solicitudes.filter(s => s.estado === 'en_proceso').length,
        completadas: solicitudes.filter(s => s.estado === 'completada').length,
        inconclusas: solicitudes.filter(s => s.estado === 'inconclusa').length
    };

    const solicitudesFiltradas = solicitudes.filter(s => {
        const coincideBusqueda =
            s.nom_lugar_produccion?.toLowerCase().includes(busqueda.toLowerCase()) ||
            s.motivo?.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEstado = !filtroEstado || s.estado === filtroEstado;
        return coincideBusqueda && coincideEstado;
    });

    const marcarInconclusa = async () => {
        if (!motivoInconclusa.trim()) {
            setErrorInconclusa('Debe indicar el motivo');
            return;
        }
        setEnviandoInconclusa(true);
        setErrorInconclusa('');
        try {
            await API_INSPECCION.patch(`/solicitudes/${modalInconclusa.id_solicitud}/inconclusa`, {
                observaciones: motivoInconclusa
            });
            setExito('Inspección marcada como inconclusa.');
            setModalInconclusa(null);
            setModalDetalle(null);
            cargarDatos();
            setTimeout(() => setExito(''), 4000);
        } catch (err) {
            setErrorInconclusa(err.response?.data?.error || 'Error al marcar como inconclusa');
        } finally {
            setEnviandoInconclusa(false);
        }
    };

    if (cargando) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border" style={{ color: 'var(--color-asistente)' }} role="status">
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
                    <FiClipboard className="me-2" /> Mis Inspecciones Asignadas
                </h4>
                <p className="text-muted mb-0">Gestione las inspecciones fitosanitarias que le han sido asignadas</p>
            </div>

            {exito && <div className="alert alert-success py-2">{exito}</div>}
            {error && <div className="alert alert-danger py-2">{error}</div>}

            {/* Contadores */}
            <div className="row g-3 mb-4">
                {[
                    { label: 'Asignadas', valor: contadores.asignadas, color: '#0dcaf0', filtro: 'asignada' },
                    { label: 'En proceso', valor: contadores.en_proceso, color: '#0d6efd', filtro: 'en_proceso' },
                    { label: 'Completadas', valor: contadores.completadas, color: '#198754', filtro: 'completada' }
                ].map(c => (
                    <div className="col-4" key={c.label}>
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
                                <option value="asignada">Asignada</option>
                                <option value="en_proceso">En proceso</option>
                                <option value="completada">Completada</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards de inspecciones */}
            {solicitudesFiltradas.length === 0 ? (
                <div className="content-card text-center text-muted py-4">
                    <FiClipboard size={48} className="mb-3 opacity-50" />
                    <p>No tiene inspecciones asignadas</p>
                </div>
            ) : (
                <div className="row g-3">
                    {solicitudesFiltradas.map(sol => (
                        <div className="col-md-6 col-lg-4" key={sol.id_solicitud}>
                            <div className="content-card h-100">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="fw-bold mb-0">
                                        <FiMapPin className="me-1" size={14} />
                                        {sol.nom_lugar_produccion}
                                    </h6>
                                    {getEstadoBadge(sol.estado)}
                                </div>

                                <div className="mb-2">
                                    <small className="text-muted">Motivo:</small>
                                    <div style={{ fontSize: '0.9rem' }}>{sol.motivo}</div>
                                </div>

                                <div className="mb-2">
                                    <small className="text-muted">Solicitante:</small>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        {sol.solicitante_nombres} {sol.solicitante_apellidos}
                                    </div>
                                </div>

                                {sol.fec_programada && (
                                    <div className="mb-2">
                                        <small className="text-muted">
                                            <FiCalendar size={12} className="me-1" />
                                            Fecha programada:
                                        </small>
                                        <div style={{ fontSize: '0.85rem' }} className="fw-semibold">
                                            {new Date(sol.fec_programada).toLocaleDateString('es-CO')}
                                        </div>
                                    </div>
                                )}

                                <div className="d-flex gap-2 mt-auto pt-2 flex-wrap">
                                    <button className="btn btn-sm btn-outline-secondary flex-grow-1"
                                        onClick={() => verDetalle(sol)}>
                                        <FiEye className="me-1" /> Ver detalle
                                    </button>

                                    {sol.estado === 'asignada' && (
                                        <button className="btn btn-sm btn-primary text-white flex-grow-1"
                                            onClick={() => iniciarInspeccion(sol.id_solicitud)}
                                            disabled={ejecutando}>
                                            <FiPlay className="me-1" /> Iniciar
                                        </button>
                                    )}

                                    {sol.estado === 'en_proceso' && (
                                        <>
                                            <button className="btn btn-sm btn-primary text-white flex-grow-1"
                                                onClick={() => navigate(`/asistente/inspeccion/${sol.id_solicitud}`)}>
                                                <FiClipboard className="me-1" /> Registrar
                                            </button>
                                            <button className="btn btn-sm btn-outline-secondary flex-grow-1"
                                                onClick={() => { setModalInconclusa(sol); setMotivoInconclusa(''); setErrorInconclusa(''); }}
                                                disabled={ejecutando}>
                                                <FiAlertCircle className="me-1" /> Inconclusa
                                            </button>
                                        </>
                                    )}
                                    {sol.estado === 'completada' && (
                                        <button className="btn btn-sm btn-outline-success flex-grow-1"
                                            onClick={() => verReporte(sol)}>
                                            <FiClipboard className="me-1" /> Ver Reporte
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Detalle */}
            {modalDetalle && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Inspección — {modalDetalle.nom_lugar_produccion}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setModalDetalle(null)} />
                            </div>
                            <div className="modal-body">
                                <div className="row g-3 mb-3">
                                    <div className="col-6"><strong>Estado:</strong><div>{getEstadoBadge(modalDetalle.estado)}</div></div>
                                    <div className="col-6"><strong>Motivo:</strong><div>{modalDetalle.motivo}</div></div>
                                    <div className="col-6"><strong>Solicitante:</strong><div>{modalDetalle.solicitante_nombres} {modalDetalle.solicitante_apellidos}</div></div>
                                    <div className="col-6"><strong>Fecha programada:</strong><div>{modalDetalle.fec_programada ? new Date(modalDetalle.fec_programada).toLocaleDateString('es-CO') : '-'}</div></div>
                                    {modalDetalle.nro_registro_ica && (
                                        <div className="col-6"><strong>Registro ICA:</strong><div>{modalDetalle.nro_registro_ica}</div></div>
                                    )}
                                </div>

                                <h6 className="fw-bold mt-3 mb-2">Lotes activos del lugar:</h6>
                                {cargandoDetalle ? (
                                    <div className="text-center py-3">
                                        <div className="spinner-border spinner-border-sm" role="status" />
                                    </div>
                                ) : lotesLugar.length === 0 ? (
                                    <p className="text-muted">No se encontraron lotes activos</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Número</th>
                                                    <th>Variedad</th>
                                                    <th>Especie</th>
                                                    <th>Área (ha)</th>
                                                    <th>Siembra</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lotesLugar.map(l => (
                                                    <tr key={l.id_lote}>
                                                        <td>{l.numero}</td>
                                                        <td>{l.nom_variedad}</td>
                                                        <td>{l.nom_comun}</td>
                                                        <td>{l.area_total}</td>
                                                        <td>{l.fec_siembra ? new Date(l.fec_siembra).toLocaleDateString('es-CO') : '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                {modalDetalle.estado === 'asignada' && (
                                    <button className="btn btn-primary text-white"
                                        onClick={() => iniciarInspeccion(modalDetalle.id_solicitud)}
                                        disabled={ejecutando}>
                                        <FiPlay className="me-1" /> Iniciar Inspección
                                    </button>
                                )}
                                {modalDetalle.estado === 'en_proceso' && (
                                    <button className="btn btn-primary text-white"
                                        onClick={() => { setModalDetalle(null); navigate(`/asistente/inspeccion/${modalDetalle.id_solicitud}`); }}>
                                        <FiClipboard className="me-1" /> Ir al Registro
                                    </button>
                                )}
                                <button className="btn btn-secondary" onClick={() => setModalDetalle(null)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Inconclusa */}
            {modalInconclusa && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Marcar Inspección como Inconclusa</h5>
                                <button type="button" className="btn-close"
                                    onClick={() => setModalInconclusa(null)} />
                            </div>
                            <div className="modal-body">
                                {errorInconclusa && (
                                    <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                                        <FiAlertCircle /> <span>{errorInconclusa}</span>
                                    </div>
                                )}
                                <p className="fw-bold mb-1">{modalInconclusa.nom_lugar_produccion}</p>
                                <p className="text-muted small mb-3">Motivo original: {modalInconclusa.motivo}</p>
                                <div className="alert alert-warning py-2 mb-3">
                                    <small>Al marcar como inconclusa, la inspección quedará cerrada sin completarse.</small>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">¿Por qué queda inconclusa? *</label>
                                    <textarea className="form-control" rows="3" value={motivoInconclusa}
                                        onChange={(e) => setMotivoInconclusa(e.target.value)}
                                        placeholder="Ej: Condiciones climáticas adversas, acceso restringido..." />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setModalInconclusa(null)}>Volver</button>
                                <button className="btn btn-warning" onClick={marcarInconclusa} disabled={enviandoInconclusa}>
                                    {enviandoInconclusa ? 'Procesando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Reporte */}
            {modalReporte && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Reporte — {modalReporte.nom_lugar_produccion}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setModalReporte(null)} />
                            </div>
                            <div className="modal-body">
                                {/* Resumen general */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-3">
                                        <div className="border rounded p-3 text-center">
                                            <h4 className="fw-bold mb-0">{inspecciones.length}</h4>
                                            <small className="text-muted">Lotes inspeccionados</small>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded p-3 text-center">
                                            <h4 className="fw-bold mb-0">
                                                {inspecciones.reduce((s, i) => s + i.cantidad_plantas_evaluadas, 0)}
                                            </h4>
                                            <small className="text-muted">Plantas evaluadas</small>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded p-3 text-center">
                                            <h4 className="fw-bold mb-0 text-danger">
                                                {inspecciones.reduce((s, i) => s + i.hallazgos_plagas.reduce((ss, h) => ss + h.cantidad_plantas_infestadas, 0), 0)}
                                            </h4>
                                            <small className="text-muted">Plantas infestadas</small>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded p-3 text-center">
                                            <h4 className="fw-bold mb-0">
                                                {inspecciones.reduce((s, i) => s + i.hallazgos_plagas.length, 0)}
                                            </h4>
                                            <small className="text-muted">Hallazgos de plagas</small>
                                        </div>
                                    </div>
                                </div>

                                {/* Detalle por lote */}
                                {inspecciones.map((insp, idx) => (
                                    <div key={insp._id} className="border rounded p-3 mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="fw-bold mb-0">
                                                Lote {insp.numero_lote} — {insp.nom_variedad}
                                            </h6>
                                            <span className="badge bg-light text-dark border">
                                                {new Date(insp.fec_inspeccion).toLocaleDateString('es-CO')}
                                            </span>
                                        </div>
                                        <div className="row g-2 mb-2">
                                            <div className="col-4">
                                                <small className="text-muted">Estado fenológico</small>
                                                <div>{insp.estado_fenologico}</div>
                                            </div>
                                            <div className="col-4">
                                                <small className="text-muted">Plantas evaluadas</small>
                                                <div className="fw-bold">{insp.cantidad_plantas_evaluadas}</div>
                                            </div>
                                            <div className="col-4">
                                                <small className="text-muted">Especie</small>
                                                <div>{insp.nom_especie}</div>
                                            </div>
                                        </div>

                                        {insp.observaciones && (
                                            <div className="mb-2">
                                                <small className="text-muted">Observaciones:</small>
                                                <div className="small">{insp.observaciones}</div>
                                            </div>
                                        )}

                                        {insp.hallazgos_plagas.length > 0 && (
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered mb-0">
                                                    <thead className="table-light">
                                                        <tr><th>Plaga</th><th className="text-center">Infestadas</th><th className="text-center">%</th></tr>
                                                    </thead>
                                                    <tbody>
                                                        {insp.hallazgos_plagas.map((h, i) => (
                                                            <tr key={i}>
                                                                <td>{h.nom_plaga}</td>
                                                                <td className="text-center">{h.cantidad_plantas_infestadas}</td>
                                                                <td className="text-center">
                                                                    <span className={`badge ${
                                                                        h.porcentaje_infestacion > 20 ? 'bg-danger' :
                                                                        h.porcentaje_infestacion > 10 ? 'bg-warning text-dark' : 'bg-success'
                                                                    }`}>{h.porcentaje_infestacion}%</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {insp.evidencias_fotograficas.length > 0 && (
                                            <div className="row g-1 mt-2">
                                                {insp.evidencias_fotograficas.map((f, i) => (
                                                    <div className="col-3 col-md-2" key={i}>
                                                        <img src={f} className="img-fluid rounded border"
                                                            style={{ height: '60px', width: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                                            onClick={() => window.open(f, '_blank')} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setModalReporte(null)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AsistenteDashboard;