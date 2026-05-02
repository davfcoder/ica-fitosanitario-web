import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_GESTION } from '../../api/axiosConfig';
import {
    FiPlus, FiEdit2, FiTrash2, FiSave, FiX,
    FiLayers, FiAlertCircle, FiMapPin, FiInfo,
    FiArrowLeft, FiCheckCircle
} from 'react-icons/fi';

const Proyeccion = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [lugares, setLugares] = useState([]);
    const [especies, setEspecies] = useState([]);
    const [lugarSeleccionado, setLugarSeleccionado] = useState(null);
    const [proyecciones, setProyecciones] = useState([]);
    const [areaTotalLugar, setAreaTotalLugar] = useState(0);

    const [cargando, setCargando] = useState(true);
    const [cargandoProyecciones, setCargandoProyecciones] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');

    // Formulario
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null); // id_especie cuando se edita
    const [form, setForm] = useState({
        id_especie: '',
        area_dest_cultivo: '',
        capacidad_produccion_max: ''
    });
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState('');

    // Modal eliminar
    const [modalEliminar, setModalEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    // Si llega ?lugar=X, seleccionarlo automáticamente
    useEffect(() => {
        const idParam = searchParams.get('lugar');
        if (idParam && lugares.length > 0 && !lugarSeleccionado) {
            const lugar = lugares.find(l => String(l.id_lugar_produccion) === String(idParam));
            if (lugar) seleccionarLugar(lugar);
        }
    }, [lugares, searchParams]);

    const cargarDatosIniciales = async () => {
        try {
            setCargando(true);
            const [lugaresRes, especiesRes] = await Promise.all([
                API_GESTION.get('/lugares-produccion'),
                API_GESTION.get('/especies-vegetales')
            ]);
            // Solo lugares aprobados
            setLugares(lugaresRes.data.data.filter(l => l.estado === 'aprobado'));
            setEspecies(especiesRes.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar datos');
        } finally {
            setCargando(false);
        }
    };

    const seleccionarLugar = async (lugar) => {
        try {
            setLugarSeleccionado(lugar);
            setSearchParams({ lugar: lugar.id_lugar_produccion });
            setCargandoProyecciones(true);
            setError('');

            // Obtener proyecciones y predios en paralelo
            const [proyRes, prediosRes] = await Promise.all([
                API_GESTION.get(`/lugar-especie/${lugar.id_lugar_produccion}`),
                API_GESTION.get(`/predios?lugar=${lugar.id_lugar_produccion}`)
            ]);

            setProyecciones(proyRes.data.data);
            const total = prediosRes.data.data.reduce((sum, p) => sum + Number(p.area_total), 0);
            setAreaTotalLugar(total);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar proyecciones');
        } finally {
            setCargandoProyecciones(false);
        }
    };

    const volverALista = () => {
        setLugarSeleccionado(null);
        setProyecciones([]);
        setAreaTotalLugar(0);
        setSearchParams({});
        cerrarForm();
    };

    // === Cálculos ===
    const areaProyectada = proyecciones.reduce((sum, p) => sum + Number(p.area_dest_cultivo), 0);
    const areaDisponible = areaTotalLugar - areaProyectada;
    const porcentajeUsado = areaTotalLugar > 0 ? (areaProyectada / areaTotalLugar) * 100 : 0;

    const obtenerPeriodicidad = (cicloCultivo) => {
        return cicloCultivo === 'Largo' ? 'kg/año' : 'kg/mes';
    };

    const obtenerEspeciesDisponibles = () => {
        // Si edita, incluye la especie actual; si crea, excluye las ya proyectadas
        const idsUsadas = proyecciones.map(p => p.id_especie);
        if (editando) {
            return especies.filter(e => e.id_especie === editando || !idsUsadas.includes(e.id_especie));
        }
        return especies.filter(e => !idsUsadas.includes(e.id_especie));
    };

    // === Formulario ===
    const abrirFormCrear = () => {
        setForm({ id_especie: '', area_dest_cultivo: '', capacidad_produccion_max: '' });
        setEditando(null);
        setMostrarForm(true);
        setErrorForm('');
    };

    const abrirFormEditar = (proy) => {
        setForm({
            id_especie: String(proy.id_especie),
            area_dest_cultivo: String(proy.area_dest_cultivo),
            capacidad_produccion_max: String(proy.capacidad_produccion_max)
        });
        setEditando(proy.id_especie);
        setMostrarForm(true);
        setErrorForm('');
    };

    const cerrarForm = () => {
        setMostrarForm(false);
        setEditando(null);
        setForm({ id_especie: '', area_dest_cultivo: '', capacidad_produccion_max: '' });
        setErrorForm('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorForm('');

        const area = Number(form.area_dest_cultivo);
        const capacidad = Number(form.capacidad_produccion_max);

        if (!form.id_especie || !form.area_dest_cultivo || !form.capacidad_produccion_max) {
            setErrorForm('Todos los campos son obligatorios');
            return;
        }
        if (area <= 0 || capacidad <= 0) {
            setErrorForm('El área y la capacidad deben ser mayores a 0');
            return;
        }

        // Validación de área en cliente (UX)
        const areaActualSinEsta = editando
            ? areaProyectada - Number(proyecciones.find(p => p.id_especie === editando)?.area_dest_cultivo || 0)
            : areaProyectada;

        if ((areaActualSinEsta + area) > areaTotalLugar) {
            setErrorForm(`Área excedida. Disponible: ${(areaTotalLugar - areaActualSinEsta).toFixed(2)} ha`);
            return;
        }

        setGuardando(true);
        try {
            if (editando) {
                await API_GESTION.put(
                    `/lugar-especie/${lugarSeleccionado.id_lugar_produccion}/${editando}`,
                    {
                        area_dest_cultivo: area,
                        capacidad_produccion_max: capacidad
                    }
                );
                setExito('Proyección actualizada exitosamente');
            } else {
                await API_GESTION.post('/lugar-especie', {
                    id_lugar_produccion: lugarSeleccionado.id_lugar_produccion,
                    id_especie: Number(form.id_especie),
                    area_dest_cultivo: area,
                    capacidad_produccion_max: capacidad
                });
                setExito('Proyección registrada exitosamente');
            }
            cerrarForm();
            seleccionarLugar(lugarSeleccionado);
            setTimeout(() => setExito(''), 4000);
        } catch (err) {
            setErrorForm(err.response?.data?.error || 'Error al guardar proyección');
        } finally {
            setGuardando(false);
        }
    };

    const confirmarEliminar = async () => {
        if (!modalEliminar) return;
        setEliminando(true);
        try {
            await API_GESTION.delete(
                `/lugar-especie/${lugarSeleccionado.id_lugar_produccion}/${modalEliminar.id_especie}`
            );
            setExito('Proyección eliminada exitosamente');
            setModalEliminar(null);
            seleccionarLugar(lugarSeleccionado);
            setTimeout(() => setExito(''), 4000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al eliminar');
            setModalEliminar(null);
        } finally {
            setEliminando(false);
        }
    };

    // === RENDER ===

    if (cargando) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border" style={{ color: 'var(--color-productor)' }} role="status" />
            </div>
        );
    }

    // VISTA 1: Selección de lugar
    if (!lugarSeleccionado) {
        return (
            <div>
                <div className="mb-4">
                    <h4 style={{ fontWeight: 700 }}>
                        <FiLayers className="me-2" /> Proyección de Producción
                    </h4>
                    <p className="text-muted mb-0">
                        Defina las especies vegetales planeadas, área destinada y capacidad de producción
                        para cada lugar de producción aprobado.
                    </p>
                </div>

                {error && <div className="alert alert-danger py-2">{error}</div>}

                {lugares.length === 0 ? (
                    <div className="content-card text-center text-muted py-5">
                        <FiInfo size={48} className="mb-3 opacity-50" />
                        <h6>No tiene lugares de producción aprobados</h6>
                        <p className="mb-0">
                            Solicite y obtenga la aprobación de un lugar de producción para gestionar su proyección.
                        </p>
                    </div>
                ) : (
                    <div className="row g-3">
                        {lugares.map(lugar => (
                            <div className="col-md-6 col-lg-4" key={lugar.id_lugar_produccion}>
                                <div
                                    className="content-card h-100"
                                    style={{ cursor: 'pointer', borderLeft: '4px solid var(--color-productor)' }}
                                    onClick={() => seleccionarLugar(lugar)}
                                >
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="fw-bold mb-0">
                                            <FiMapPin className="me-1" size={14} />
                                            {lugar.nom_lugar_produccion}
                                        </h6>
                                        <span className="badge bg-success">
                                            <FiCheckCircle size={10} className="me-1" />
                                            Aprobado
                                        </span>
                                    </div>
                                    {lugar.nro_registro_ica && (
                                        <div className="mb-2">
                                            <small className="text-muted">Registro ICA:</small>
                                            <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                                                {lugar.nro_registro_ica}
                                            </div>
                                        </div>
                                    )}
                                    <button className="btn btn-sm btn-primary-productor text-white w-100 mt-2">
                                        <FiLayers className="me-1" /> Gestionar Proyección
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // VISTA 2: Detalle de proyección de un lugar
    return (
        <div>
            {/* Header */}
            <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                <button className="btn btn-outline-secondary btn-sm" onClick={volverALista}>
                    <FiArrowLeft className="me-1" /> Volver
                </button>
                <div className="flex-grow-1">
                    <h5 className="fw-bold mb-0">
                        <FiLayers className="me-2" />
                        Proyección — {lugarSeleccionado.nom_lugar_produccion}
                    </h5>
                    <small className="text-muted">
                        Registro ICA: {lugarSeleccionado.nro_registro_ica || 'N/A'}
                    </small>
                </div>
                <button
                    className="btn btn-primary-productor text-white"
                    onClick={abrirFormCrear}
                    disabled={obtenerEspeciesDisponibles().length === 0 || areaDisponible <= 0}
                >
                    <FiPlus className="me-1" /> Nueva Proyección
                </button>
            </div>

            {error && <div className="alert alert-danger py-2">{error}</div>}
            {exito && <div className="alert alert-success py-2">{exito}</div>}

            {/* Resumen de áreas */}
            <div className="row g-3 mb-3">
                <div className="col-md-4">
                    <div className="content-card text-center" style={{ borderLeft: '4px solid #6c757d' }}>
                        <small className="text-muted">Área Total del Lugar</small>
                        <h4 className="fw-bold mb-0">{areaTotalLugar.toFixed(2)} ha</h4>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="content-card text-center" style={{ borderLeft: '4px solid var(--color-productor)' }}>
                        <small className="text-muted">Área Proyectada</small>
                        <h4 className="fw-bold mb-0">{areaProyectada.toFixed(2)} ha</h4>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="content-card text-center" style={{ borderLeft: `4px solid ${areaDisponible <= 0 ? '#dc3545' : '#198754'}` }}>
                        <small className="text-muted">Área Disponible</small>
                        <h4 className="fw-bold mb-0">{areaDisponible.toFixed(2)} ha</h4>
                    </div>
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="content-card mb-3">
                <div className="d-flex justify-content-between mb-1">
                    <small className="fw-semibold">Uso del área</small>
                    <small className="text-muted">{porcentajeUsado.toFixed(1)}%</small>
                </div>
                <div className="progress" style={{ height: '12px' }}>
                    <div
                        className={`progress-bar ${porcentajeUsado > 90 ? 'bg-danger' : porcentajeUsado > 70 ? 'bg-warning' : 'bg-success'}`}
                        role="progressbar"
                        style={{ width: `${Math.min(porcentajeUsado, 100)}%` }}
                    />
                </div>
            </div>

            {/* Formulario */}
            {mostrarForm && (
                <div className="content-card mb-3 border-start border-4" style={{ borderColor: 'var(--color-productor)' }}>
                    <h6 className="fw-bold mb-3">
                        {editando ? 'Editar Proyección' : 'Nueva Proyección'}
                    </h6>

                    {errorForm && (
                        <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                            <FiAlertCircle /> <span>{errorForm}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Especie Vegetal *</label>
                                <select
                                    className="form-select"
                                    value={form.id_especie}
                                    onChange={(e) => setForm(prev => ({ ...prev, id_especie: e.target.value }))}
                                    required
                                    disabled={editando !== null}
                                >
                                    <option value="">Seleccione especie...</option>
                                    {obtenerEspeciesDisponibles().map(e => (
                                        <option key={e.id_especie} value={e.id_especie}>
                                            {e.nom_comun} ({e.nom_especie}) — Ciclo {e.ciclo_cultivo}
                                        </option>
                                    ))}
                                </select>
                                {form.id_especie && (() => {
                                    const esp = especies.find(e => String(e.id_especie) === String(form.id_especie));
                                    if (!esp) return null;
                                    const periodo = obtenerPeriodicidad(esp.ciclo_cultivo);
                                    return (
                                        <small className="text-muted d-block mt-1">
                                            <FiInfo size={12} className="me-1" />
                                            La capacidad se medirá en <strong>{periodo}</strong> (ciclo {esp.ciclo_cultivo.toLowerCase()})
                                        </small>
                                    );
                                })()}
                            </div>

                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Área Destinada (ha) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="form-control"
                                    value={form.area_dest_cultivo}
                                    onChange={(e) => setForm(prev => ({ ...prev, area_dest_cultivo: e.target.value }))}
                                    required
                                    placeholder="Ej: 5.5"
                                />
                                <small className="text-muted">
                                    Disponible: {(editando
                                        ? areaTotalLugar - (areaProyectada - Number(proyecciones.find(p => p.id_especie === editando)?.area_dest_cultivo || 0))
                                        : areaDisponible
                                    ).toFixed(2)} ha
                                </small>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label fw-semibold">
                                    Capacidad Máx. (kg)*
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="form-control"
                                    value={form.capacidad_produccion_max}
                                    onChange={(e) => setForm(prev => ({ ...prev, capacidad_produccion_max: e.target.value }))}
                                    required
                                    placeholder="Ej: 30000"
                                />
                                {form.id_especie && (() => {
                                    const esp = especies.find(e => String(e.id_especie) === String(form.id_especie));
                                    return esp ? (
                                        <small className="text-muted">{obtenerPeriodicidad(esp.ciclo_cultivo)}</small>
                                    ) : null;
                                })()}
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-3 pt-3 border-top">
                            <button type="submit" className="btn btn-primary-productor text-white" disabled={guardando}>
                                <FiSave className="me-2" />
                                {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Registrar')}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={cerrarForm}>
                                <FiX className="me-2" /> Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de proyecciones */}
            <div className="content-card">
                <h6 className="fw-bold mb-3">Especies Proyectadas</h6>

                {cargandoProyecciones ? (
                    <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm" role="status" />
                    </div>
                ) : proyecciones.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        <FiLayers size={36} className="mb-2 opacity-50" />
                        <p className="mb-0">No hay proyecciones registradas para este lugar.</p>
                        <small>Use el botón "Nueva Proyección" para comenzar.</small>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Especie</th>
                                    <th>Ciclo</th>
                                    <th className="text-end">Área Destinada</th>
                                    <th className="text-end">Capacidad Máxima</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proyecciones.map(p => (
                                    <tr key={p.id_especie}>
                                        <td>
                                            <strong>{p.nom_comun}</strong>
                                            <div className="text-muted small">{p.nom_especie}</div>
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark border">
                                                {p.ciclo_cultivo}
                                            </span>
                                        </td>
                                        <td className="text-end">
                                            <strong>{Number(p.area_dest_cultivo).toFixed(2)}</strong> ha
                                        </td>
                                        <td className="text-end">
                                            <strong>{Number(p.capacidad_produccion_max).toLocaleString('es-CO')}</strong>{' '}
                                            <small className="text-muted">{obtenerPeriodicidad(p.ciclo_cultivo)}</small>
                                        </td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-outline-primary me-1"
                                                onClick={() => abrirFormEditar(p)}
                                                title="Editar"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => setModalEliminar(p)}
                                                title="Eliminar"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Eliminar */}
            {modalEliminar && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirmar Eliminación</h5>
                                <button type="button" className="btn-close" onClick={() => setModalEliminar(null)} />
                            </div>
                            <div className="modal-body">
                                <p>¿Está seguro de eliminar la proyección de:</p>
                                <p className="fw-bold mb-1">{modalEliminar.nom_comun} ({modalEliminar.nom_especie})</p>
                                <p className="text-muted small mb-3">
                                    Área: {Number(modalEliminar.area_dest_cultivo).toFixed(2)} ha — Capacidad: {Number(modalEliminar.capacidad_produccion_max).toLocaleString('es-CO')} {obtenerPeriodicidad(modalEliminar.ciclo_cultivo)}
                                </p>
                                <div className="alert alert-warning py-2 mb-0">
                                    <small>Esta acción no se puede deshacer.</small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setModalEliminar(null)} disabled={eliminando}>
                                    Cancelar
                                </button>
                                <button className="btn btn-danger" onClick={confirmarEliminar} disabled={eliminando}>
                                    {eliminando ? 'Eliminando...' : 'Eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Proyeccion;