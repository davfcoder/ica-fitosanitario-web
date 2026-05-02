import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_GESTION, API_INSPECCION } from '../../api/axiosConfig';
import {
    FiArrowLeft, FiCheck, FiAlertCircle, FiCamera, FiTrash2,
    FiChevronRight, FiChevronLeft, FiSave, FiPlus, FiX,
    FiLayers, FiClipboard, FiCheckCircle, FiSearch, FiEdit2
} from 'react-icons/fi';

// =====================================================================
// COMPONENTE EXTERNO: ContadorCampo
// Botones grandes optimizados para uso en campo (tablets con guantes).
// =====================================================================
const ContadorCampo = ({ label, value, onChange, min = 0, max = 99999, inputRef }) => {
    const val = Number(value) || 0;

    const incrementar = (cantidad) => {
        const nuevo = Math.min(val + cantidad, max);
        onChange(String(nuevo));
    };

    const decrementar = (cantidad) => {
        const nuevo = Math.max(val - cantidad, min);
        onChange(String(nuevo));
    };

    return (
        <div className="contador-campo">
            <label className="form-label fw-semibold mb-3">{label}</label>
            <div className="contador-controls">
                <button
                    type="button"
                    className="btn btn-outline-danger contador-btn contador-btn-main"
                    onClick={() => decrementar(1)}
                    disabled={val <= min}
                    aria-label="Disminuir"
                >
                    −
                </button>

                <input
                    ref={inputRef}
                    type="number"
                    className="form-control contador-input"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    min={min}
                    max={max}
                    inputMode="numeric"
                />

                <button
                    type="button"
                    className="btn btn-success contador-btn contador-btn-main"
                    onClick={() => incrementar(1)}
                    aria-label="Aumentar"
                >
                    +
                </button>
            </div>

            {/* Botones rápidos secundarios */}
            <div className="contador-quick-actions">
                <button
                    type="button"
                    className="btn btn-outline-secondary contador-quick-btn"
                    onClick={() => decrementar(10)}
                    disabled={val <= min}
                    title="-10"
                >
                    −10
                </button>
                <button
                    type="button"
                    className="btn btn-outline-secondary contador-quick-btn"
                    onClick={() => decrementar(5)}
                    disabled={val <= min}
                    title="-5"
                >
                    −5
                </button>
                <button
                    type="button"
                    className="btn btn-outline-success contador-quick-btn"
                    onClick={() => incrementar(5)}
                    title="+5"
                >
                    +5
                </button>
                <button
                    type="button"
                    className="btn btn-outline-success contador-quick-btn"
                    onClick={() => incrementar(10)}
                    title="+10"
                >
                    +10
                </button>
            </div>
        </div>
    );
};

// =====================================================================
// COMPONENTE EXTERNO: LoteRegistrado
// También se define fuera para no redefinirse en cada render del padre.
// =====================================================================
const LoteRegistrado = ({ lote, idSolicitud, onEditar, solicitudCompletada }) => {
    const [inspeccion, setInspeccion] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarInspeccion();
    }, [lote.id_lote]);

    const cargarInspeccion = async () => {
        try {
            setCargando(true);
            const res = await API_INSPECCION.get(`/inspecciones/lote/${lote.id_lote}/solicitud/${idSolicitud}`);
            setInspeccion(res.data.data);
        } catch (err) {
            setInspeccion(null);
        } finally {
            setCargando(false);
        }
    };

    if (cargando) {
        return <div className="text-center py-4"><div className="spinner-border spinner-border-sm" /></div>;
    }

    if (!inspeccion) {
        return <div className="content-card text-center py-4 text-muted">No se pudo cargar la inspección registrada.</div>;
    }

    return (
        <div className="content-card mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">
                    <FiCheckCircle className="me-2 text-success" />
                    Inspección Registrada
                </h6>
                {!solicitudCompletada && (
                    <button className="btn btn-sm btn-outline-primary" onClick={onEditar}>
                        <FiEdit2 className="me-1" /> Editar
                    </button>
                )}
            </div>

            <div className="row g-3 mb-3">
                <div className="col-6">
                    <small className="text-muted">Estado Fenológico</small>
                    <div className="fw-semibold">{inspeccion.estado_fenologico}</div>
                </div>
                <div className="col-6">
                    <small className="text-muted">Plantas Evaluadas</small>
                    <div className="fw-semibold">{inspeccion.cantidad_plantas_evaluadas}</div>
                </div>
                <div className="col-12">
                    <small className="text-muted">Fecha de Inspección</small>
                    <div>{new Date(inspeccion.fec_inspeccion).toLocaleDateString('es-CO')}</div>
                </div>
                {inspeccion.observaciones && (
                    <div className="col-12">
                        <small className="text-muted">Observaciones</small>
                        <div>{inspeccion.observaciones}</div>
                    </div>
                )}
            </div>

            <h6 className="fw-bold mb-2">Hallazgos de Plagas</h6>
            {inspeccion.hallazgos_plagas.length === 0 ? (
                <p className="text-muted small">Sin hallazgos de plagas</p>
            ) : (
                <div className="table-responsive mb-3">
                    <table className="table table-sm table-bordered mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Plaga</th>
                                <th className="text-center">Infestadas</th>
                                <th className="text-center">% Infestación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inspeccion.hallazgos_plagas.map((h, i) => (
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

            {inspeccion.evidencias_fotograficas.length > 0 && (
                <>
                    <h6 className="fw-bold mb-2">Evidencias</h6>
                    <div className="row g-2">
                        {inspeccion.evidencias_fotograficas.map((foto, i) => (
                            <div className="col-4 col-md-3" key={i}>
                                <img src={foto} alt={`Evidencia ${i + 1}`}
                                    className="img-fluid rounded border"
                                    style={{ height: '100px', width: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                    onClick={() => window.open(foto, '_blank')} />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
const RegistroInspeccion = () => {
    const { idSolicitud } = useParams();
    const navigate = useNavigate();

    const [solicitud, setSolicitud] = useState(null);
    const [lotes, setLotes] = useState([]);
    const [plagasDisponibles, setPlagasDisponibles] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [errorHallazgo, setErrorHallazgo] = useState(''); // tarea 10

    const [loteActualIdx, setLoteActualIdx] = useState(0);
    const [inspeccionesRegistradas, setInspeccionesRegistradas] = useState({});

    const [form, setForm] = useState({
        estado_fenologico: '',
        cantidad_plantas_evaluadas: '',
        observaciones: '',
        hallazgos_plagas: [],
        evidencias_fotograficas: []
    });
    const [guardando, setGuardando] = useState(false);
    const [exito, setExito] = useState('');

    const [mostrarAddPlaga, setMostrarAddPlaga] = useState(false);
    const [nuevaPlaga, setNuevaPlaga] = useState({ id_plaga: '', cantidad_plantas_infestadas: '' });
    const [busquedaPlaga, setBusquedaPlaga] = useState('');

    const fileInputRef = useRef(null);
    const estadoFenologicoRef = useRef(null);
    const plantasEvaluadasRef = useRef(null);
    const errorGlobalRef = useRef(null);
    const [completando, setCompletando] = useState(false);
    const [editandoLoteId, setEditandoLoteId] = useState(null);
    const [inspeccionEditandoId, setInspeccionEditandoId] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, [idSolicitud]);

    const iniciarEdicionLote = async (idLote) => {
        try {
            const res = await API_INSPECCION.get(`/inspecciones/lote/${idLote}/solicitud/${idSolicitud}`);
            const insp = res.data.data;

            setForm({
                estado_fenologico: insp.estado_fenologico,
                cantidad_plantas_evaluadas: String(insp.cantidad_plantas_evaluadas),
                observaciones: insp.observaciones || '',
                hallazgos_plagas: [...insp.hallazgos_plagas],
                evidencias_fotograficas: [...insp.evidencias_fotograficas]
            });
            setInspeccionEditandoId(insp._id);
            setEditandoLoteId(idLote);
            setError('');
            setExito('');
            setMostrarAddPlaga(false);
        } catch (err) {
            setError('No se pudo cargar la inspección para edición');
        }
    };

    const cancelarEdicion = () => {
        setEditandoLoteId(null);
        setInspeccionEditandoId(null);
        setForm({
            estado_fenologico: '',
            cantidad_plantas_evaluadas: '',
            observaciones: '',
            hallazgos_plagas: [],
            evidencias_fotograficas: []
        });
        setError('');
    };

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError('');

            const solRes = await API_INSPECCION.get(`/solicitudes/${idSolicitud}`);
            const sol = solRes.data.data;
            setSolicitud(sol);

            if (sol.estado !== 'en_proceso') {
                setError(`Esta inspección no está en proceso (estado: ${sol.estado})`);
                setCargando(false);
                return;
            }

            const [lotesRes, inspeccionesRes] = await Promise.all([
                API_GESTION.get(`/lotes?lugar=${sol.id_lugar_produccion}&activos=true`),
                API_INSPECCION.get(`/inspecciones/solicitud/${idSolicitud}`)
            ]);

            setLotes(lotesRes.data.data);

            const yaRegistrados = {};
            inspeccionesRes.data.data.forEach(insp => {
                yaRegistrados[insp.id_lote] = true;
            });
            setInspeccionesRegistradas(yaRegistrados);

        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar datos de la inspección');
        } finally {
            setCargando(false);
        }
    };

    const loteActual = lotes[loteActualIdx] || null;
    const loteYaInspeccionado = loteActual ? inspeccionesRegistradas[loteActual.id_lote] : false;
    const totalLotes = lotes.length;
    const lotesInspeccionados = Object.keys(inspeccionesRegistradas).length;
    const todosInspeccionados = totalLotes > 0 && lotesInspeccionados >= totalLotes;

    useEffect(() => {
        if (loteActual && !loteYaInspeccionado) {
            setForm({
                estado_fenologico: '',
                cantidad_plantas_evaluadas: '',
                observaciones: '',
                hallazgos_plagas: [],
                evidencias_fotograficas: []
            });
            setMostrarAddPlaga(false);
            setExito('');
            setErrorHallazgo('');
        }
        // Cargar plagas que afectan a la especie de este lote
        if (loteActual) {
            cargarPlagasDelLote(loteActual.id_especie);
        }
    }, [loteActualIdx, lotes]);

    // === HALLAZGOS DE PLAGAS ===
    const agregarHallazgo = () => {
        setErrorHallazgo('');
        if (!nuevaPlaga.id_plaga || !nuevaPlaga.cantidad_plantas_infestadas) {
            setErrorHallazgo('Seleccione la plaga y la cantidad de plantas infestadas');
            return;
        }

        const plaga = plagasDisponibles.find(p => p.id_plaga === Number(nuevaPlaga.id_plaga));
        if (!plaga) return;

        if (form.hallazgos_plagas.find(h => h.id_plaga === Number(nuevaPlaga.id_plaga))) {
            setErrorHallazgo('Esta plaga ya fue agregada');
            return;
        }

        const cantidadInfestadas = Number(nuevaPlaga.cantidad_plantas_infestadas);
        const cantidadEvaluadas = Number(form.cantidad_plantas_evaluadas) || 0;

        if (cantidadEvaluadas <= 0) {
            setErrorHallazgo('Primero indique la cantidad de plantas evaluadas');
            return;
        }

        if (cantidadInfestadas > cantidadEvaluadas) {
            setErrorHallazgo(`Las plantas infestadas (${cantidadInfestadas}) no pueden ser más que las evaluadas (${cantidadEvaluadas})`);
            return;
        }

        const porcentaje = Math.round((cantidadInfestadas / cantidadEvaluadas) * 10000) / 100;

        setForm(prev => ({
            ...prev,
            hallazgos_plagas: [...prev.hallazgos_plagas, {
                id_plaga: plaga.id_plaga,
                nom_plaga: `${plaga.nombre_comun} (${plaga.nom_especie})`,
                cantidad_plantas_infestadas: cantidadInfestadas,
                porcentaje_infestacion: porcentaje
            }]
        }));

        setNuevaPlaga({ id_plaga: '', cantidad_plantas_infestadas: '' });
        setBusquedaPlaga('');
        setMostrarAddPlaga(false);
    };

    const cargarPlagasDelLote = async (idEspecie) => {
        if (!idEspecie) {
            setPlagasDisponibles([]);
            return;
        }
        try {
            const res = await API_GESTION.get(`/plagas?especie=${idEspecie}`);
            setPlagasDisponibles(res.data.data || []);
        } catch (err) {
            console.error('Error al cargar plagas del lote:', err);
            setPlagasDisponibles([]);
        }
    };

    const eliminarHallazgo = (idx) => {
        setForm(prev => ({
            ...prev,
            hallazgos_plagas: prev.hallazgos_plagas.filter((_, i) => i !== idx)
        }));
    };

    useEffect(() => {
        const evaluadas = Number(form.cantidad_plantas_evaluadas);
        if (evaluadas > 0 && form.hallazgos_plagas.length > 0) {
            setForm(prev => ({
                ...prev,
                hallazgos_plagas: prev.hallazgos_plagas.map(h => ({
                    ...h,
                    porcentaje_infestacion: Math.round((h.cantidad_plantas_infestadas / evaluadas) * 10000) / 100
                }))
            }));
        }
    }, [form.cantidad_plantas_evaluadas]);

    const handleFotos = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                setError('Cada foto debe pesar menos de 5MB');
                setTimeout(() => setError(''), 3000);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setForm(prev => ({
                    ...prev,
                    evidencias_fotograficas: [...prev.evidencias_fotograficas, reader.result]
                }));
            };
            reader.readAsDataURL(file);
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const eliminarFoto = (idx) => {
        setForm(prev => ({
            ...prev,
            evidencias_fotograficas: prev.evidencias_fotograficas.filter((_, i) => i !== idx)
        }));
    };

    const guardarInspeccionLote = async () => {
        setError('');

        if (!form.estado_fenologico) {
            setError('Seleccione el estado fenológico');
            setTimeout(() => {
                estadoFenologicoRef.current?.focus();
                estadoFenologicoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
            return;
        }

        if (!form.cantidad_plantas_evaluadas || Number(form.cantidad_plantas_evaluadas) < 1) {
            setError('Indique la cantidad de plantas evaluadas (mínimo 1)');
            setTimeout(() => {
                plantasEvaluadasRef.current?.focus();
                plantasEvaluadasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
            return;
        }

        setGuardando(true);

        try {
            if (editandoLoteId && inspeccionEditandoId) {
                // MODO EDICIÓN
                await API_INSPECCION.put(`/inspecciones/${inspeccionEditandoId}`, {
                    estado_fenologico: form.estado_fenologico,
                    cantidad_plantas_evaluadas: Number(form.cantidad_plantas_evaluadas),
                    observaciones: form.observaciones,
                    hallazgos_plagas: form.hallazgos_plagas,
                    evidencias_fotograficas: form.evidencias_fotograficas
                });
                setExito(`Lote ${loteActual.numero} actualizado exitosamente`);
                setEditandoLoteId(null);
                setInspeccionEditandoId(null);
                setTimeout(() => setExito(''), 2000);
            } else {
                // MODO CREACIÓN
                await API_INSPECCION.post('/inspecciones', {
                    id_solicitud: Number(idSolicitud),
                    id_lote: loteActual.id_lote,
                    id_lugar_produccion: solicitud.id_lugar_produccion,
                    estado_fenologico: form.estado_fenologico,
                    cantidad_plantas_evaluadas: Number(form.cantidad_plantas_evaluadas),
                    observaciones: form.observaciones,
                    hallazgos_plagas: form.hallazgos_plagas,
                    evidencias_fotograficas: form.evidencias_fotograficas,
                    nom_lugar_produccion: solicitud.nom_lugar_produccion,
                    numero_lote: loteActual.numero,
                    nom_especie: loteActual.nom_comun || '',
                    nom_variedad: loteActual.nom_variedad || ''
                });

                setInspeccionesRegistradas(prev => ({ ...prev, [loteActual.id_lote]: true }));
                setExito(`Lote ${loteActual.numero} registrado exitosamente`);

                setTimeout(() => {
                    const siguienteIdx = lotes.findIndex((l, i) =>
                        i > loteActualIdx && !inspeccionesRegistradas[l.id_lote]
                    );
                    if (siguienteIdx !== -1) {
                        setLoteActualIdx(siguienteIdx);
                    }
                    setExito('');
                }, 1500);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar inspección del lote');
            setTimeout(() => {
                errorGlobalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
        } finally {
            setGuardando(false);
        }
    };

    const finalizarInspeccion = async () => {
        setCompletando(true);
        try {
            await API_INSPECCION.patch(`/solicitudes/${idSolicitud}/completar`);
            navigate('/asistente', { state: { exito: 'Inspección completada exitosamente' } });
        } catch (err) {
            setError(err.response?.data?.error || 'Error al completar la inspección');
        } finally {
            setCompletando(false);
        }
    };

    const plagasFiltradas = plagasDisponibles.filter(p =>
        p.nombre_comun?.toLowerCase().includes(busquedaPlaga.toLowerCase()) ||
        p.nom_especie?.toLowerCase().includes(busquedaPlaga.toLowerCase())
    );

    if (cargando) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border" style={{ color: 'var(--color-asistente)' }} role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    if (!solicitud || solicitud.estado !== 'en_proceso') {
        return (
            <div>
                <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/asistente')}>
                    <FiArrowLeft className="me-1" /> Volver
                </button>
                <div className="alert alert-warning">
                    <FiAlertCircle className="me-2" />
                    {error || 'Esta inspección no está disponible para registro.'}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex align-items-center gap-3 mb-3">
                <button className="btn btn-outline-secondary" onClick={() => navigate('/asistente')}>
                    <FiArrowLeft />
                </button>
                <div className="flex-grow-1">
                    <h5 className="fw-bold mb-0">
                        <FiClipboard className="me-2" />
                        {solicitud.nom_lugar_produccion}
                    </h5>
                    <small className="text-muted">
                        Registro ICA: {solicitud.nro_registro_ica || 'N/A'} — Motivo: {solicitud.motivo}
                    </small>
                </div>
            </div>

            <div className="content-card mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Progreso: {lotesInspeccionados} de {totalLotes} lotes</strong>
                    <span className="badge bg-primary">{totalLotes > 0 ? Math.round((lotesInspeccionados / totalLotes) * 100) : 0}%</span>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                    <div className="progress-bar bg-success" role="progressbar"
                        style={{ width: `${totalLotes > 0 ? (lotesInspeccionados / totalLotes) * 100 : 0}%` }} />
                </div>

                <div className="d-flex gap-2 mt-3 flex-wrap">
                    {lotes.map((lote, idx) => (
                        <button
                            key={lote.id_lote}
                            className={`btn btn-sm ${
                                inspeccionesRegistradas[lote.id_lote]
                                    ? 'btn-success text-white'
                                    : idx === loteActualIdx
                                        ? 'btn-primary text-white'
                                        : 'btn-outline-secondary'
                            }`}
                            onClick={() => setLoteActualIdx(idx)}
                            style={{ minWidth: '80px' }}
                        >
                            {inspeccionesRegistradas[lote.id_lote] && <FiCheckCircle className="me-1" size={12} />}
                            {lote.numero}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div ref={errorGlobalRef} className="alert alert-danger py-2 d-flex align-items-center gap-2 mb-3">
                    <FiAlertCircle /> <span>{error}</span>
                    <button className="btn-close ms-auto" onClick={() => setError('')} />
                </div>
            )}
            {exito && <div className="alert alert-success py-2 mb-3">{exito}</div>}

            {todosInspeccionados && (
                <div className="content-card mb-3 border-start border-4 border-success">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div>
                            <h6 className="fw-bold mb-1 text-success">
                                <FiCheckCircle className="me-2" /> Todos los lotes han sido inspeccionados
                            </h6>
                            <p className="text-muted mb-0">Puede finalizar la inspección o revisar algún lote.</p>
                        </div>
                        <button className="btn btn-success btn-lg text-white" onClick={finalizarInspeccion}
                            disabled={completando}>
                            <FiCheck className="me-2" />
                            {completando ? 'Finalizando...' : 'Finalizar Inspección'}
                        </button>
                    </div>
                </div>
            )}

            {loteActual && (
                <div>
                    <div className="content-card mb-3" style={{ borderLeft: '4px solid var(--color-asistente)' }}>
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 className="fw-bold mb-1">
                                    <FiLayers className="me-2" />
                                    Lote {loteActual.numero}
                                </h6>
                                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    <span className="me-3">Variedad: <strong>{loteActual.nom_variedad}</strong></span>
                                    <span className="me-3">Especie: <strong>{loteActual.nom_comun}</strong></span>
                                    <span>Área: <strong>{loteActual.area_total} ha</strong></span>
                                </div>
                            </div>
                            {loteYaInspeccionado && (
                                <span className="badge bg-success fs-6">
                                    <FiCheckCircle className="me-1" /> Registrado
                                </span>
                            )}
                        </div>
                    </div>

                    {loteYaInspeccionado && editandoLoteId !== loteActual.id_lote ? (
                        <LoteRegistrado
                            lote={loteActual}
                            idSolicitud={idSolicitud}
                            onEditar={() => iniciarEdicionLote(loteActual.id_lote)}
                            plagasDisponibles={plagasDisponibles}
                            solicitudCompletada={solicitud.estado === 'completada'}
                        />
                    ) : (
                        <div>
                            <div className="content-card mb-3">
                                <h6 className="fw-bold mb-3">Evaluación del Cultivo</h6>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">Estado Fenológico *</label>
                                        <select ref={estadoFenologicoRef} className="form-select form-select-lg"
                                            value={form.estado_fenologico}
                                            onChange={(e) => setForm(prev => ({ ...prev, estado_fenologico: e.target.value }))}>
                                            <option value="">Seleccione...</option>
                                            <option value="Germinacion">Germinación</option>
                                            <option value="Desarrollo vegetativo">Desarrollo vegetativo</option>
                                            <option value="Floracion">Floración</option>
                                            <option value="Fructificacion">Fructificación</option>
                                            <option value="Maduracion">Maduración</option>
                                            <option value="Cosecha">Cosecha</option>
                                            <option value="Reposo">Reposo</option>
                                        </select>
                                    </div>
                                    <div className="col-12">
                                        <ContadorCampo
                                            label="Plantas Evaluadas *"
                                            value={form.cantidad_plantas_evaluadas}
                                            onChange={(val) => setForm(prev => ({ ...prev, cantidad_plantas_evaluadas: val }))}
                                            min={0}
                                            inputRef={plantasEvaluadasRef}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="content-card mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold mb-0">Hallazgos de Plagas</h6>
                                    <button className="btn btn-outline-danger btn-sm"
                                        onClick={() => {
                                            setMostrarAddPlaga(!mostrarAddPlaga);
                                            setNuevaPlaga({ id_plaga: '', cantidad_plantas_infestadas: '' });
                                            setBusquedaPlaga('');
                                            setErrorHallazgo('');
                                        }}>
                                        <FiPlus className="me-1" /> Agregar plaga
                                    </button>
                                </div>

                                {/* TAREA 10: alerta inline DENTRO del card de hallazgos */}
                                {errorHallazgo && (
                                    <div className="alert alert-danger py-2 mb-3 d-flex align-items-center gap-2">
                                        <FiAlertCircle /> <span>{errorHallazgo}</span>
                                        <button className="btn-close ms-auto" onClick={() => setErrorHallazgo('')} />
                                    </div>
                                )}

                                {mostrarAddPlaga && (
                                    <div className="border rounded p-3 mb-3 bg-light">
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label fw-semibold small">Buscar plaga</label>
                                                <div className="input-group">
                                                    <span className="input-group-text"><FiSearch /></span>
                                                    <input type="text" className="form-control"
                                                        placeholder="Escriba nombre de la plaga..."
                                                        value={busquedaPlaga}
                                                        onChange={(e) => setBusquedaPlaga(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <select className="form-select form-select-lg"
                                                    value={nuevaPlaga.id_plaga}
                                                    onChange={(e) => setNuevaPlaga(prev => ({ ...prev, id_plaga: e.target.value }))}
                                                    disabled={plagasDisponibles.length === 0}>
                                                    <option value="">
                                                        {plagasDisponibles.length === 0
                                                            ? 'No hay plagas registradas para esta especie'
                                                            : 'Seleccione plaga...'}
                                                    </option>
                                                    {plagasFiltradas.map(p => (
                                                        <option key={p.id_plaga} value={p.id_plaga}>
                                                            {p.nombre_comun} ({p.nom_especie})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-12">
                                                <ContadorCampo
                                                    label="Plantas Infestadas"
                                                    value={nuevaPlaga.cantidad_plantas_infestadas}
                                                    onChange={(val) => setNuevaPlaga(prev => ({ ...prev, cantidad_plantas_infestadas: val }))}
                                                    min={0}
                                                    max={Number(form.cantidad_plantas_evaluadas) || 99999}
                                                />
                                            </div>
                                            <div className="col-12 d-flex gap-2">
                                                <button className="btn btn-success btn-lg flex-grow-1" onClick={agregarHallazgo}>
                                                    <FiCheck className="me-2" /> Confirmar Hallazgo
                                                </button>
                                                <button className="btn btn-outline-secondary btn-lg" onClick={() => { setMostrarAddPlaga(false); setErrorHallazgo(''); }}>
                                                    <FiX />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {form.hallazgos_plagas.length === 0 ? (
                                    <p className="text-muted text-center py-3 mb-0">
                                        Sin hallazgos de plagas registrados. Haga clic en "Agregar plaga" si detectó alguna.
                                    </p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-sm align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Plaga</th>
                                                    <th className="text-center">Plantas Infestadas</th>
                                                    <th className="text-center">% Infestación</th>
                                                    <th className="text-center" style={{ width: '50px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {form.hallazgos_plagas.map((h, idx) => (
                                                    <tr key={idx}>
                                                        <td><strong>{h.nom_plaga}</strong></td>
                                                        <td className="text-center">
                                                            <span className="badge bg-danger fs-6">
                                                                {h.cantidad_plantas_infestadas}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className={`badge fs-6 ${
                                                                h.porcentaje_infestacion > 20 ? 'bg-danger' :
                                                                h.porcentaje_infestacion > 10 ? 'bg-warning text-dark' : 'bg-success'
                                                            }`}>
                                                                {h.porcentaje_infestacion}%
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <button className="btn btn-sm btn-outline-danger"
                                                                onClick={() => eliminarHallazgo(idx)}>
                                                                <FiTrash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="content-card mb-3">
                                <h6 className="fw-bold mb-3">Evidencias Fotográficas</h6>
                                <input type="file" ref={fileInputRef} accept="image/*" multiple capture="environment"
                                    className="d-none" onChange={handleFotos} />

                                <button className="btn btn-outline-primary mb-3"
                                    onClick={() => fileInputRef.current?.click()}>
                                    <FiCamera className="me-2" /> Tomar / Seleccionar Fotos
                                </button>

                                {form.evidencias_fotograficas.length > 0 && (
                                    <div className="row g-2">
                                        {form.evidencias_fotograficas.map((foto, idx) => (
                                            <div className="col-4 col-md-3" key={idx}>
                                                <div className="position-relative">
                                                    <img src={foto} alt={`Evidencia ${idx + 1}`}
                                                        className="img-fluid rounded border"
                                                        style={{ height: '120px', width: '100%', objectFit: 'cover' }} />
                                                    <button className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                                                        onClick={() => eliminarFoto(idx)} style={{ padding: '2px 6px' }}>
                                                        <FiX size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {form.evidencias_fotograficas.length === 0 && (
                                    <p className="text-muted small mb-0">No se han agregado fotos aún.</p>
                                )}
                            </div>

                            {/* Observaciones */}
                            <div className="content-card mb-3">
                                <h6 className="fw-bold mb-3">Observaciones</h6>
                                <textarea className="form-control" rows="3"
                                    value={form.observaciones}
                                    onChange={(e) => setForm(prev => ({ ...prev, observaciones: e.target.value }))}
                                    placeholder="Observaciones generales sobre el estado del lote..." />
                            </div>

                            {/* Botón guardar lote */}
                            <div className="d-flex gap-2 mb-4">
                                <button className="btn btn-primary btn-lg text-white flex-grow-1"
                                    onClick={guardarInspeccionLote} disabled={guardando}>
                                    <FiSave className="me-2" />
                                    {guardando
                                        ? 'Guardando...'
                                        : editandoLoteId
                                            ? `Actualizar Inspección — Lote ${loteActual.numero}`
                                            : `Guardar Inspección — Lote ${loteActual.numero}`}
                                </button>
                                {editandoLoteId && (
                                    <button className="btn btn-outline-secondary btn-lg" onClick={cancelarEdicion} disabled={guardando}>
                                        <FiX className="me-2" /> Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navegación entre lotes */}
                    <div className="d-flex justify-content-between mt-3">
                        <button className="btn btn-outline-secondary"
                            disabled={loteActualIdx === 0}
                            onClick={() => setLoteActualIdx(prev => prev - 1)}>
                            <FiChevronLeft className="me-1" /> Lote anterior
                        </button>
                        <span className="align-self-center text-muted">
                            Lote {loteActualIdx + 1} de {totalLotes}
                        </span>
                        <button className="btn btn-outline-secondary"
                            disabled={loteActualIdx >= totalLotes - 1}
                            onClick={() => setLoteActualIdx(prev => prev + 1)}>
                            Lote siguiente <FiChevronRight className="ms-1" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistroInspeccion;