import { useState, useEffect, useMemo } from 'react';
import { API_INSPECCION } from '../../api/axiosConfig';
import {
    FiClipboard, FiFilter, FiDownload, FiEye, FiX,
    FiCalendar, FiAlertCircle, FiFileText, FiLayers
} from 'react-icons/fi';
import {
    generarPdfTablaResumen,
    generarPdfInspeccionIndividual,
    generarPdfConsolidadoSolicitud
} from '../../utils/pdfReportes';

const TablaResumenInspecciones = ({ esAdmin = false, esProductor = false, titulo = 'Inspecciones', subtitulo = '' }) => {
    const [inspecciones, setInspecciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [generandoPdf, setGenerandoPdf] = useState(false);

    const [filtros, setFiltros] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        id_lugar_produccion: '',
        nom_especie: '',
        id_plaga: '',
        id_usuario_asistente: ''
    });

    const [modalDetalle, setModalDetalle] = useState(null);

    useEffect(() => {
        cargarInspecciones();
    }, []);

    const cargarInspecciones = async () => {
        try {
            setCargando(true);
            const res = await API_INSPECCION.get('/inspecciones/reporte');
            setInspecciones(res.data.data.inspecciones || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar inspecciones');
        } finally {
            setCargando(false);
        }
    };

    const limpiarFiltros = () => {
        setFiltros({
            fecha_inicio: '', fecha_fin: '', id_lugar_produccion: '',
            nom_especie: '', id_plaga: '', id_usuario_asistente: ''
        });
    };

    // ============================================================
    // OPCIONES DE FILTROS DERIVADAS DE LAS INSPECCIONES CARGADAS
    // ============================================================
    const opcionesFiltros = useMemo(() => {
        const lugaresMap = new Map();
        const especiesSet = new Set();
        const plagasMap = new Map();
        const asistentesMap = new Map();

        inspecciones.forEach(insp => {
            if (insp.id_lugar_produccion && insp.nom_lugar_produccion) {
                lugaresMap.set(insp.id_lugar_produccion, insp.nom_lugar_produccion);
            }
            if (insp.nom_especie) {
                especiesSet.add(insp.nom_especie);
            }
            if (insp.id_usuario_asistente && insp.nom_asistente) {
                asistentesMap.set(insp.id_usuario_asistente, insp.nom_asistente);
            }
            (insp.hallazgos_plagas || []).forEach(h => {
                if (h.id_plaga && h.nom_plaga) {
                    plagasMap.set(h.id_plaga, h.nom_plaga);
                }
            });
        });

        return {
            lugares: Array.from(lugaresMap, ([id, nombre]) => ({ id, nombre }))
                .sort((a, b) => a.nombre.localeCompare(b.nombre)),
            especies: Array.from(especiesSet).sort(),
            plagas: Array.from(plagasMap, ([id, nombre]) => ({ id, nombre }))
                .sort((a, b) => a.nombre.localeCompare(b.nombre)),
            asistentes: Array.from(asistentesMap, ([id, nombre]) => ({ id, nombre }))
                .sort((a, b) => a.nombre.localeCompare(b.nombre))
        };
    }, [inspecciones]);

    // ============================================================
    // FILTRADO 100% EN CLIENTE
    // ============================================================
    const inspeccionesFiltradas = useMemo(() => {
        return inspecciones.filter(i => {
            // Fecha
            if (filtros.fecha_inicio) {
                const desde = new Date(filtros.fecha_inicio);
                if (new Date(i.fec_inspeccion) < desde) return false;
            }
            if (filtros.fecha_fin) {
                const hasta = new Date(filtros.fecha_fin);
                hasta.setHours(23, 59, 59, 999);
                if (new Date(i.fec_inspeccion) > hasta) return false;
            }
            // Lugar
            if (filtros.id_lugar_produccion &&
                String(i.id_lugar_produccion) !== String(filtros.id_lugar_produccion)) return false;
            // Especie
            if (filtros.nom_especie && i.nom_especie !== filtros.nom_especie) return false;
            // Plaga
            if (filtros.id_plaga) {
                const tienePlaga = (i.hallazgos_plagas || []).some(
                    h => String(h.id_plaga) === String(filtros.id_plaga)
                );
                if (!tienePlaga) return false;
            }
            // Asistente (solo admin)
            if (esAdmin && filtros.id_usuario_asistente &&
                String(i.id_usuario_asistente) !== String(filtros.id_usuario_asistente)) return false;
            return true;
        });
    }, [inspecciones, filtros, esAdmin]);

    // Resumen
    const totalPlantas = inspeccionesFiltradas.reduce((s, i) => s + i.cantidad_plantas_evaluadas, 0);
    const totalInfestadas = inspeccionesFiltradas.reduce((s, i) =>
        s + i.hallazgos_plagas.reduce((ss, h) => ss + h.cantidad_plantas_infestadas, 0), 0);
    const porcentajeGen = totalPlantas > 0 ? ((totalInfestadas / totalPlantas) * 100).toFixed(2) : 0;

    const obtenerPorcentajeMaximo = (insp) => {
        if (insp.hallazgos_plagas.length === 0) return 0;
        return Math.max(...insp.hallazgos_plagas.map(h => h.porcentaje_infestacion));
    };

    const exportarTablaPdf = () => {
        const filtrosLegibles = {};
        if (filtros.fecha_inicio) filtrosLegibles['Desde'] = filtros.fecha_inicio;
        if (filtros.fecha_fin) filtrosLegibles['Hasta'] = filtros.fecha_fin;
        if (filtros.id_lugar_produccion) {
            const l = opcionesFiltros.lugares.find(x => String(x.id) === String(filtros.id_lugar_produccion));
            if (l) filtrosLegibles['Lugar'] = l.nombre;
        }
        if (filtros.nom_especie) filtrosLegibles['Especie'] = filtros.nom_especie;
        if (filtros.id_plaga) {
            const p = opcionesFiltros.plagas.find(x => String(x.id) === String(filtros.id_plaga));
            if (p) filtrosLegibles['Plaga'] = p.nombre;
        }
        if (esAdmin && filtros.id_usuario_asistente) {
            const a = opcionesFiltros.asistentes.find(x => String(x.id) === String(filtros.id_usuario_asistente));
            if (a) filtrosLegibles['Asistente'] = a.nombre;
        }
        generarPdfTablaResumen(inspeccionesFiltradas, filtrosLegibles, esAdmin);
    };

    const exportarConsolidadoPdf = async (inspeccion) => {
        try {
            setGenerandoPdf(true);
            // 1. Solicitud completa
            const solRes = await API_INSPECCION.get(`/solicitudes/${inspeccion.id_solicitud}`);
            const solicitud = solRes.data.data;

            // 2. Todas las inspecciones de esa solicitud (todos los lotes)
            const inspRes = await API_INSPECCION.get(`/inspecciones/solicitud/${inspeccion.id_solicitud}`);
            const inspeccionesSolicitud = inspRes.data.data || [];

            if (inspeccionesSolicitud.length === 0) {
                setError('No hay inspecciones registradas para esta solicitud');
                setTimeout(() => setError(''), 4000);
                return;
            }

            const solicitante = {
                nombres: solicitud.solicitante_nombres,
                apellidos: solicitud.solicitante_apellidos,
                num_identificacion: solicitud.solicitante_num_identificacion,
                correo_electronico: solicitud.solicitante_correo,
                telefono: solicitud.solicitante_telefono
            };

            const asistente = solicitud.id_asistente_asignado ? {
                nombres: solicitud.asistente_nombres,
                apellidos: solicitud.asistente_apellidos,
                num_identificacion: solicitud.asistente_num_identificacion,
                correo_electronico: solicitud.asistente_correo,
                telefono: solicitud.asistente_telefono,
                nro_registro_ica: solicitud.asistente_nro_registro_ica,
                tarjeta_profesional: solicitud.asistente_tarjeta_profesional
            } : null;

            await generarPdfConsolidadoSolicitud({
                inspecciones: inspeccionesSolicitud,
                solicitud,
                solicitante,
                asistente
            });
        } catch (err) {
            setError('Error al generar PDF consolidado: ' + (err.response?.data?.error || err.message));
            setTimeout(() => setError(''), 4000);
        } finally {
            setGenerandoPdf(false);
        }
    };

    const exportarIndividualPdf = async (inspeccion) => {
        try {
            setGenerandoPdf(true);
            const solRes = await API_INSPECCION.get(`/solicitudes/${inspeccion.id_solicitud}`);
            const solicitud = solRes.data.data;

            const solicitante = {
                nombres: solicitud.solicitante_nombres,
                apellidos: solicitud.solicitante_apellidos,
                num_identificacion: solicitud.solicitante_num_identificacion,
                correo_electronico: solicitud.solicitante_correo,
                telefono: solicitud.solicitante_telefono
            };

            const asistente = solicitud.id_asistente_asignado ? {
                nombres: solicitud.asistente_nombres,
                apellidos: solicitud.asistente_apellidos,
                num_identificacion: solicitud.asistente_num_identificacion,
                correo_electronico: solicitud.asistente_correo,
                telefono: solicitud.asistente_telefono,
                nro_registro_ica: solicitud.asistente_nro_registro_ica,
                tarjeta_profesional: solicitud.asistente_tarjeta_profesional
            } : null;

            await generarPdfInspeccionIndividual({
                inspeccion, solicitud, solicitante, asistente
            });
        } catch (err) {
            setError('Error al generar PDF: ' + (err.response?.data?.error || err.message));
            setTimeout(() => setError(''), 4000);
        } finally {
            setGenerandoPdf(false);
        }
    };

    if (cargando) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-success" role="status" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h4 style={{ fontWeight: 700 }}>
                        <FiClipboard className="me-2" /> {titulo}
                    </h4>
                    {subtitulo && <p className="text-muted mb-0">{subtitulo}</p>}
                </div>
                <button
                    className="btn btn-success text-white"
                    onClick={exportarTablaPdf}
                    disabled={inspeccionesFiltradas.length === 0}
                >
                    <FiDownload className="me-2" /> Exportar Tabla a PDF
                </button>
            </div>

            {error && (
                <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                    <FiAlertCircle /> <span>{error}</span>
                </div>
            )}

            {/* Filtros */}
            <div className="content-card mb-3">
                <h6 className="fw-bold mb-3">
                    <FiFilter className="me-2" /> Filtros
                </h6>
                <div className="row g-3">
                    <div className="col-md-3">
                        <label className="form-label small fw-semibold">
                            <FiCalendar size={12} className="me-1" /> Desde
                        </label>
                        <input type="date" className="form-control form-control-sm"
                            value={filtros.fecha_inicio}
                            onChange={(e) => setFiltros(prev => ({ ...prev, fecha_inicio: e.target.value }))} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small fw-semibold">
                            <FiCalendar size={12} className="me-1" /> Hasta
                        </label>
                        <input type="date" className="form-control form-control-sm"
                            value={filtros.fecha_fin}
                            onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small fw-semibold">Lugar de Producción</label>
                        <select className="form-select form-select-sm"
                            value={filtros.id_lugar_produccion}
                            onChange={(e) => setFiltros(prev => ({ ...prev, id_lugar_produccion: e.target.value }))}
                            disabled={opcionesFiltros.lugares.length === 0}>
                            <option value="">Todos</option>
                            {opcionesFiltros.lugares.map(l => (
                                <option key={l.id} value={l.id}>{l.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small fw-semibold">Especie Vegetal</label>
                        <select className="form-select form-select-sm"
                            value={filtros.nom_especie}
                            onChange={(e) => setFiltros(prev => ({ ...prev, nom_especie: e.target.value }))}
                            disabled={opcionesFiltros.especies.length === 0}>
                            <option value="">Todas</option>
                            {opcionesFiltros.especies.map(e => (
                                <option key={e} value={e}>{e}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small fw-semibold">Plaga</label>
                        <select className="form-select form-select-sm"
                            value={filtros.id_plaga}
                            onChange={(e) => setFiltros(prev => ({ ...prev, id_plaga: e.target.value }))}
                            disabled={opcionesFiltros.plagas.length === 0}>
                            <option value="">{opcionesFiltros.plagas.length === 0 ? 'Sin plagas registradas' : 'Todas'}</option>
                            {opcionesFiltros.plagas.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>
                    {esAdmin && (
                        <div className="col-md-3">
                            <label className="form-label small fw-semibold">Asistente Técnico</label>
                            <select className="form-select form-select-sm"
                                value={filtros.id_usuario_asistente}
                                onChange={(e) => setFiltros(prev => ({ ...prev, id_usuario_asistente: e.target.value }))}
                                disabled={opcionesFiltros.asistentes.length === 0}>
                                <option value="">Todos</option>
                                {opcionesFiltros.asistentes.map(a => (
                                    <option key={a.id} value={a.id}>{a.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="col-12 d-flex justify-content-end">
                        <button className="btn btn-sm btn-outline-secondary" onClick={limpiarFiltros}>
                            <FiX className="me-1" /> Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Resumen */}
            <div className="row g-3 mb-3">
                <div className="col-md-3">
                    <div className="content-card text-center">
                        <small className="text-muted">Inspecciones</small>
                        <h4 className="fw-bold mb-0">{inspeccionesFiltradas.length}</h4>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="content-card text-center">
                        <small className="text-muted">Plantas Evaluadas</small>
                        <h4 className="fw-bold mb-0">{totalPlantas}</h4>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="content-card text-center">
                        <small className="text-muted">Plantas Infestadas</small>
                        <h4 className="fw-bold mb-0 text-danger">{totalInfestadas}</h4>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="content-card text-center">
                        <small className="text-muted">% Infestación General</small>
                        <h4 className={`fw-bold mb-0 ${porcentajeGen > 20 ? 'text-danger' : porcentajeGen > 10 ? 'text-warning' : 'text-success'}`}>
                            {porcentajeGen}%
                        </h4>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="content-card">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Fecha</th>
                                <th>Lugar</th>
                                <th>Lote</th>
                                <th>Especie / Variedad</th>
                                {esAdmin && <th>Asistente</th>}
                                <th className="text-center">Plantas Eval.</th>
                                <th className="text-center"># Plagas</th>
                                <th className="text-center">% Inf. Máx.</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inspeccionesFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan={esAdmin ? 10 : 9} className="text-center text-muted py-4">
                                        No se encontraron inspecciones con los filtros aplicados
                                    </td>
                                </tr>
                            ) : (
                                inspeccionesFiltradas.map(insp => {
                                    const porcMax = obtenerPorcentajeMaximo(insp);
                                    return (
                                        <tr key={insp._id}>
                                            <td><code>{String(insp._id).slice(-6).toUpperCase()}</code></td>
                                            <td style={{ fontSize: '0.85rem' }}>
                                                {new Date(insp.fec_inspeccion).toLocaleDateString('es-CO')}
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{insp.nom_lugar_produccion}</td>
                                            <td>{insp.numero_lote}</td>
                                            <td style={{ fontSize: '0.85rem' }}>
                                                <div>{insp.nom_especie}</div>
                                                <small className="text-muted">{insp.nom_variedad}</small>
                                            </td>
                                            {esAdmin && (
                                                <td style={{ fontSize: '0.85rem' }}>{insp.nom_asistente}</td>
                                            )}
                                            <td className="text-center">{insp.cantidad_plantas_evaluadas}</td>
                                            <td className="text-center">
                                                <span className={`badge ${insp.hallazgos_plagas.length > 0 ? 'bg-warning text-dark' : 'bg-light text-dark border'}`}>
                                                    {insp.hallazgos_plagas.length}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge ${
                                                    porcMax > 20 ? 'bg-danger' :
                                                    porcMax > 10 ? 'bg-warning text-dark' :
                                                    porcMax > 0 ? 'bg-success' : 'bg-light text-dark border'
                                                }`}>
                                                    {porcMax}%
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button className="btn btn-sm btn-outline-secondary me-1"
                                                    onClick={() => setModalDetalle(insp)} title="Ver detalle">
                                                    <FiEye />
                                                </button>
                                                <div className="btn-group">
                                                    <button type="button"
                                                        className="btn btn-sm btn-outline-success dropdown-toggle"
                                                        data-bs-toggle="dropdown"
                                                        aria-expanded="false"
                                                        disabled={generandoPdf}
                                                        title="Descargar PDF">
                                                        <FiFileText />
                                                    </button>
                                                    <ul className="dropdown-menu dropdown-menu-end">
                                                        <li>
                                                            <button className="dropdown-item small" type="button"
                                                                onClick={() => exportarIndividualPdf(insp)}>
                                                                <FiFileText className="me-2" /> Descargar Reporte de Este Lote
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button className="dropdown-item small" type="button"
                                                                onClick={() => exportarConsolidadoPdf(insp)}>
                                                                <FiLayers className="me-2" /> Descargar Reporte Completo de la Visita
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-3 text-muted small">
                    Mostrando {inspeccionesFiltradas.length} de {inspecciones.length} inspecciones
                </div>
            </div>

            {/* Modal Detalle */}
            {modalDetalle && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Inspección {String(modalDetalle._id).slice(-8).toUpperCase()}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setModalDetalle(null)} />
                            </div>
                            <div className="modal-body">
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6"><strong>Lugar:</strong><div>{modalDetalle.nom_lugar_produccion}</div></div>
                                    <div className="col-md-6"><strong>Lote:</strong><div>{modalDetalle.numero_lote}</div></div>
                                    <div className="col-md-6"><strong>Especie / Variedad:</strong><div>{modalDetalle.nom_especie} / {modalDetalle.nom_variedad}</div></div>
                                    <div className="col-md-6"><strong>Estado fenológico:</strong><div>{modalDetalle.estado_fenologico}</div></div>
                                    <div className="col-md-6"><strong>Fecha de inspección:</strong><div>{new Date(modalDetalle.fec_inspeccion).toLocaleString('es-CO')}</div></div>
                                    <div className="col-md-6"><strong>Asistente:</strong><div>{modalDetalle.nom_asistente}</div></div>
                                    <div className="col-md-6"><strong>Plantas evaluadas:</strong><div>{modalDetalle.cantidad_plantas_evaluadas}</div></div>
                                    <div className="col-md-6"><strong>Plantas infestadas (total):</strong><div>{modalDetalle.hallazgos_plagas.reduce((s, h) => s + h.cantidad_plantas_infestadas, 0)}</div></div>
                                </div>

                                {modalDetalle.observaciones && (
                                    <div className="mb-3">
                                        <strong>Observaciones:</strong>
                                        <p className="text-muted mb-0" style={{ whiteSpace: 'pre-wrap' }}>{modalDetalle.observaciones}</p>
                                    </div>
                                )}

                                <h6 className="fw-bold mt-4 mb-2">Hallazgos de Plagas</h6>
                                {modalDetalle.hallazgos_plagas.length === 0 ? (
                                    <p className="text-muted fst-italic">Sin hallazgos registrados.</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Plaga</th>
                                                    <th className="text-center">Plantas Infestadas</th>
                                                    <th className="text-center">% Infestación</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {modalDetalle.hallazgos_plagas.map((h, idx) => (
                                                    <tr key={idx}>
                                                        <td>{h.nom_plaga}</td>
                                                        <td className="text-center">{h.cantidad_plantas_infestadas}</td>
                                                        <td className="text-center">
                                                            <span className={`badge ${
                                                                h.porcentaje_infestacion > 20 ? 'bg-danger' :
                                                                h.porcentaje_infestacion > 10 ? 'bg-warning text-dark' :
                                                                'bg-success'
                                                            }`}>
                                                                {h.porcentaje_infestacion}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {modalDetalle.evidencias_fotograficas && modalDetalle.evidencias_fotograficas.length > 0 && (
                                    <>
                                        <h6 className="fw-bold mt-4 mb-2">
                                            Evidencias Fotográficas ({modalDetalle.evidencias_fotograficas.length})
                                        </h6>
                                        <div className="row g-2">
                                            {modalDetalle.evidencias_fotograficas.map((foto, idx) => (
                                                <div key={idx} className="col-md-4 col-sm-6">
                                                    <a href={foto} target="_blank" rel="noopener noreferrer">
                                                        <img src={foto} alt={`Evidencia ${idx + 1}`}
                                                            className="img-fluid rounded border"
                                                            style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-success"
                                    onClick={() => exportarIndividualPdf(modalDetalle)}
                                    disabled={generandoPdf}>
                                    <FiFileText className="me-2" /> PDF de este lote
                                </button>
                                <button type="button" className="btn btn-success text-white"
                                    onClick={() => exportarConsolidadoPdf(modalDetalle)}
                                    disabled={generandoPdf}>
                                    <FiLayers className="me-2" /> PDF completo de la visita
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setModalDetalle(null)}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablaResumenInspecciones;