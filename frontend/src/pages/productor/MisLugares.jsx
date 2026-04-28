import { useState, useEffect } from 'react';
import { API_GESTION } from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import {
    FiPlus, FiSearch, FiSave, FiX, FiMapPin,
    FiAlertCircle, FiEye, FiClock, FiCheck, FiXCircle, FiEdit2
} from 'react-icons/fi';

const MisLugares = () => {
    const { usuario } = useAuth();
    const [lugares, setLugares] = useState([]);
    const [prediosDisponibles, setPrediosDisponibles] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [busqueda, setBusqueda] = useState('');

    // Formulario
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null); // id_lugar_produccion si es edición
    const [form, setForm] = useState({ nom_lugar_produccion: '', predios_ids: [] });
    const [guardando, setGuardando] = useState(false);
    const [prediosOriginales, setPrediosOriginales] = useState([]); // predios que ya tenía el lugar

    // Modal detalle
    const [modalDetalle, setModalDetalle] = useState(null);
    const [prediosLugar, setPrediosLugar] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [lugaresRes, prediosRes] = await Promise.all([
                API_GESTION.get('/lugares-produccion'),
                API_GESTION.get('/predios?disponibles=true')
            ]);
            setLugares(lugaresRes.data.data);
            setPrediosDisponibles(prediosRes.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar datos');
        } finally {
            setCargando(false);
        }
    };

    // === CREAR ===
    const abrirFormCrear = () => {
        setForm({ nom_lugar_produccion: '', predios_ids: [] });
        setEditando(null);
        setPrediosOriginales([]);
        setMostrarForm(true);
        setError('');
        setExito('');
    };

    // === EDITAR (solicitud devuelta) ===
    const abrirFormEditar = async (lugar) => {
        try {
            const response = await API_GESTION.get(`/lugares-produccion/${lugar.id_lugar_produccion}`);
            const detalle = response.data.data;
            const prediosDelLugar = detalle.predios || [];

            setEditando(lugar.id_lugar_produccion);
            setForm({
                nom_lugar_produccion: detalle.nom_lugar_produccion,
                predios_ids: prediosDelLugar.map(p => p.id_predio)
            });
            setPrediosOriginales(prediosDelLugar);
            setMostrarForm(true);
            setError('');
            setExito('');
        } catch (err) {
            setError('Error al cargar datos del lugar');
        }
    };

    const cerrarForm = () => {
        setMostrarForm(false);
        setEditando(null);
        setForm({ nom_lugar_produccion: '', predios_ids: [] });
        setPrediosOriginales([]);
        setError('');
    };

    const togglePredio = (idPredio) => {
        setForm(prev => {
            const yaSeleccionado = prev.predios_ids.includes(idPredio);
            return {
                ...prev,
                predios_ids: yaSeleccionado
                    ? prev.predios_ids.filter(id => id !== idPredio)
                    : [...prev.predios_ids, idPredio]
            };
        });
    };

    // Todos los predios que se pueden mostrar en el formulario
    const prediosParaFormulario = () => {
        if (editando) {
            // Combinar predios originales del lugar + predios disponibles
            const idsDisponibles = prediosDisponibles.map(p => p.id_predio);
            const idsOriginales = prediosOriginales.map(p => p.id_predio);
            const todosIds = new Set([...idsDisponibles, ...idsOriginales]);

            const combinados = [];
            todosIds.forEach(id => {
                const predio = prediosOriginales.find(p => p.id_predio === id)
                    || prediosDisponibles.find(p => p.id_predio === id);
                if (predio) combinados.push(predio);
            });
            return combinados;
        }
        return prediosDisponibles;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');

        if (form.predios_ids.length === 0) {
            setError('Debe seleccionar al menos un predio');
            return;
        }

        setGuardando(true);

        try {
            if (editando) {
                // Corregir solicitud devuelta usando PUT
                await API_GESTION.put(`/lugares-produccion/${editando}`, {
                    nom_lugar_produccion: form.nom_lugar_produccion,
                    predios_ids: form.predios_ids
                });
                setExito('Solicitud corregida y reenviada exitosamente');
            } else {
                await API_GESTION.post('/lugares-produccion', {
                    nom_lugar_produccion: form.nom_lugar_produccion,
                    predios_ids: form.predios_ids
                });
                setExito('Solicitud de lugar de producción enviada exitosamente');
            }
            cerrarForm();
            cargarDatos();
            setTimeout(() => setExito(''), 5000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al procesar solicitud');
        } finally {
            setGuardando(false);
        }
    };

    const verDetalle = async (lugar) => {
        try {
            const response = await API_GESTION.get(`/lugares-produccion/${lugar.id_lugar_produccion}`);
            setModalDetalle(response.data.data);
            setPrediosLugar(response.data.data.predios || []);
        } catch (err) {
            alert('Error al cargar detalle');
        }
    };

    const getEstadoBadge = (estado) => {
        const config = {
            'pendiente': { clase: 'bg-warning text-dark', icono: <FiClock size={12} className="me-1" /> },
            'aprobado': { clase: 'bg-success', icono: <FiCheck size={12} className="me-1" /> },
            'rechazado': { clase: 'bg-danger', icono: <FiXCircle size={12} className="me-1" /> },
            'devuelto': { clase: 'bg-info text-dark', icono: <FiAlertCircle size={12} className="me-1" /> }
        };
        const c = config[estado] || { clase: 'bg-secondary', icono: null };
        return <span className={`badge ${c.clase}`}>{c.icono}{estado}</span>;
    };

    const lugaresFiltrados = lugares.filter(l =>
        l.nom_lugar_produccion?.toLowerCase().includes(busqueda.toLowerCase())
    );

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
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h4 style={{ fontWeight: 700 }}>
                        <FiMapPin className="me-2" /> Mis Lugares de Producción
                    </h4>
                    <p className="text-muted mb-0">Solicite y gestione sus lugares de producción</p>
                </div>
                <button className="btn btn-primary-productor text-white" onClick={abrirFormCrear}>
                    <FiPlus className="me-2" /> Nueva Solicitud
                </button>
            </div>

            {exito && <div className="alert alert-success py-2">{exito}</div>}

            {/* Formulario */}
            {mostrarForm && (
                <div className="content-card mb-4 border-start border-4" style={{ borderColor: 'var(--color-productor)' }}>
                    <h6 className="fw-bold mb-3">
                        {editando ? 'Corregir y Reenviar Solicitud' : 'Nueva Solicitud de Lugar de Producción'}
                    </h6>
                    {error && (
                        <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                            <FiAlertCircle /> <span>{error}</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Nombre del Lugar de Producción *</label>
                            <input
                                type="text" className="form-control"
                                value={form.nom_lugar_produccion}
                                onChange={(e) => setForm(prev => ({ ...prev, nom_lugar_produccion: e.target.value }))}
                                required placeholder="Ej: Finca Productora El Valle"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold">
                                Seleccione los predios que conforman este lugar *
                            </label>
                            {prediosParaFormulario().length === 0 ? (
                                <div className="alert alert-info py-2">
                                    <small>No hay predios disponibles. Contacte al administrador.</small>
                                </div>
                            ) : (
                                <div className="row g-2">
                                    {prediosParaFormulario().map(predio => (
                                        <div className="col-md-6" key={predio.id_predio}>
                                            <div
                                                className={`border rounded p-3 ${
                                                    form.predios_ids.includes(predio.id_predio)
                                                        ? 'border-warning bg-warning bg-opacity-10'
                                                        : ''
                                                }`}
                                                onClick={() => togglePredio(predio.id_predio)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="d-flex align-items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={form.predios_ids.includes(predio.id_predio)}
                                                        onChange={() => togglePredio(predio.id_predio)}
                                                    />
                                                    <div>
                                                        <strong>{predio.nom_predio}</strong>
                                                        <div className="text-muted small">
                                                            {predio.municipio}, {predio.departamento} — {predio.area_total} ha
                                                        </div>
                                                        <div className="text-muted small">
                                                            Predial: {predio.num_predial}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {form.predios_ids.length > 0 && (
                                <div className="mt-2 text-muted small">
                                    {form.predios_ids.length} predio(s) seleccionado(s)
                                </div>
                            )}
                        </div>

                        <div className="d-flex gap-2 mt-3">
                            <button type="submit" className="btn btn-primary-productor text-white" disabled={guardando}>
                                <FiSave className="me-2" />
                                {guardando ? 'Enviando...' : (editando ? 'Reenviar Solicitud' : 'Enviar Solicitud')}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={cerrarForm}>
                                <FiX className="me-2" /> Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Búsqueda */}
            <div className="content-card mb-4">
                <div className="input-group">
                    <span className="input-group-text"><FiSearch /></span>
                    <input
                        type="text" className="form-control"
                        placeholder="Buscar lugar de producción..."
                        value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            {/* Cards */}
            {lugaresFiltrados.length === 0 ? (
                <div className="content-card text-center text-muted py-4">
                    <FiMapPin size={48} className="mb-3 opacity-50" />
                    <p>No tiene lugares de producción registrados</p>
                    <button className="btn btn-primary-productor text-white" onClick={abrirFormCrear}>
                        <FiPlus className="me-2" /> Crear primera solicitud
                    </button>
                </div>
            ) : (
                <div className="row g-3">
                    {lugaresFiltrados.map(lugar => (
                        <div className="col-md-6 col-lg-4" key={lugar.id_lugar_produccion}>
                            <div className="content-card h-100">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="fw-bold mb-0">{lugar.nom_lugar_produccion}</h6>
                                    {getEstadoBadge(lugar.estado)}
                                </div>

                                {lugar.nro_registro_ica && (
                                    <div className="mb-2">
                                        <small className="text-muted">Registro ICA:</small>
                                        <div className="fw-semibold">{lugar.nro_registro_ica}</div>
                                    </div>
                                )}

                                <div className="mb-2">
                                    <small className="text-muted">Fecha solicitud:</small>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        {lugar.fec_solicitud
                                            ? new Date(lugar.fec_solicitud).toLocaleDateString('es-CO')
                                            : '-'}
                                    </div>
                                </div>

                                {lugar.observaciones_admin && (
                                    <div className="alert alert-info py-2 mt-2 mb-2">
                                        <small><strong>Observaciones:</strong> {lugar.observaciones_admin}</small>
                                    </div>
                                )}

                                <div className="d-flex gap-2 mt-2">
                                    <button
                                        className="btn btn-sm btn-outline-secondary flex-grow-1"
                                        onClick={() => verDetalle(lugar)}
                                    >
                                        <FiEye className="me-1" /> Ver detalle
                                    </button>

                                    {lugar.estado === 'devuelto' && (
                                        <button
                                            className="btn btn-sm btn-outline-warning flex-grow-1"
                                            onClick={() => abrirFormEditar(lugar)}
                                        >
                                            <FiEdit2 className="me-1" /> Corregir
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
                                <h5 className="modal-title">{modalDetalle.nom_lugar_produccion}</h5>
                                <button type="button" className="btn-close" onClick={() => setModalDetalle(null)} />
                            </div>
                            <div className="modal-body">
                                <div className="row g-3 mb-3">
                                    <div className="col-6"><strong>Estado:</strong> {getEstadoBadge(modalDetalle.estado)}</div>
                                    <div className="col-6"><strong>Registro ICA:</strong> {modalDetalle.nro_registro_ica || 'Pendiente'}</div>
                                    <div className="col-6">
                                        <strong>Fecha solicitud:</strong>{' '}
                                        {modalDetalle.fec_solicitud ? new Date(modalDetalle.fec_solicitud).toLocaleDateString('es-CO') : '-'}
                                    </div>
                                    <div className="col-6">
                                        <strong>Fecha aprobación:</strong>{' '}
                                        {modalDetalle.fec_aprobacion ? new Date(modalDetalle.fec_aprobacion).toLocaleDateString('es-CO') : '-'}
                                    </div>
                                </div>

                                {modalDetalle.observaciones_admin && (
                                    <div className="alert alert-info py-2 mb-3">
                                        <strong>Observaciones:</strong> {modalDetalle.observaciones_admin}
                                    </div>
                                )}

                                <h6 className="fw-bold">Predios:</h6>
                                {prediosLugar.length === 0 ? (
                                    <p className="text-muted">Sin predios</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered">
                                            <thead className="table-light">
                                                <tr><th>Nombre</th><th>Ubicación</th><th>Área (ha)</th></tr>
                                            </thead>
                                            <tbody>
                                                {prediosLugar.map(p => (
                                                    <tr key={p.id_predio}>
                                                        <td>{p.nom_predio}</td>
                                                        <td>{p.municipio}, {p.departamento}</td>
                                                        <td>{p.area_total}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="fw-bold">
                                                    <td colSpan="2" className="text-end">Total:</td>
                                                    <td>{prediosLugar.reduce((s, p) => s + p.area_total, 0).toFixed(2)} ha</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
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

export default MisLugares;