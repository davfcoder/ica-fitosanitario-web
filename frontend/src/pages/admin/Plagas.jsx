import { useState, useEffect, useRef } from 'react';
import { API_GESTION } from '../../api/axiosConfig';
import {
    FiPlus, FiEdit2, FiTrash2, FiSearch, FiSave, FiX,
    FiAlertTriangle, FiLink, FiUnlock, FiAlertCircle
} from 'react-icons/fi';

const Plagas = () => {
    const [plagas, setPlagas] = useState([]);
    const [especies, setEspecies] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [busqueda, setBusqueda] = useState('');

    // Formulario CRUD
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({ nom_especie: '', nombre_comun: '' });
    const [guardando, setGuardando] = useState(false);

    // Referencia para el auto-scroll
    const formRef = useRef(null);
    const asociarRef = useRef(null);

    useEffect(() => {
        if (mostrarForm && formRef.current) {
            const rect = formRef.current.getBoundingClientRect();
            // Verifica si el elemento está completamente visible en la pantalla
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
            
            if (!isVisible) {
                formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [mostrarForm, editando]);

    // Modal eliminar
    const [modalEliminar, setModalEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);
    const [errorEliminar, setErrorEliminar] = useState('');

    // Asociación plaga-especie
    const [mostrarAsociar, setMostrarAsociar] = useState(null);
    const [especieAsociar, setEspecieAsociar] = useState('');
    const [plagasEspecies, setPlagasEspecies] = useState({});
    const [asociando, setAsociando] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        if (mostrarAsociar && asociarRef.current) {
            const rect = asociarRef.current.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
            
            if (!isVisible) {
                asociarRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [mostrarAsociar]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [plagasRes, especiesRes] = await Promise.all([
                API_GESTION.get('/plagas'),
                API_GESTION.get('/especies-vegetales')
            ]);
            setPlagas(plagasRes.data.data);
            setEspecies(especiesRes.data.data);

            // Cargar asociaciones para cada plaga
            const asociaciones = {};
            for (const especie of especiesRes.data.data) {
                try {
                    const res = await API_GESTION.get(`/plagas?especie=${especie.id_especie}`);
                    res.data.data.forEach(plaga => {
                        if (!asociaciones[plaga.id_plaga]) asociaciones[plaga.id_plaga] = [];
                        asociaciones[plaga.id_plaga].push({
                            id_especie: especie.id_especie,
                            nom_comun: especie.nom_comun,
                            nom_especie: especie.nom_especie
                        });
                    });
                } catch (err) {
                    // Silenciar errores individuales
                }
            }
            setPlagasEspecies(asociaciones);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar datos');
        } finally {
            setCargando(false);
        }
    };

    // ====== CRUD ======
    const abrirFormCrear = () => {
        setForm({ nom_especie: '', nombre_comun: '' });
        setEditando(null);
        setMostrarForm(true);
        setMostrarAsociar(null);
        setError('');
        setExito('');
    };

    const abrirFormEditar = (plaga) => {
        setForm({ nom_especie: plaga.nom_especie, nombre_comun: plaga.nombre_comun });
        setEditando(plaga.id_plaga);
        setMostrarForm(true);
        setMostrarAsociar(null);
        setError('');
        setExito('');
    };

    const cerrarForm = () => {
        setMostrarForm(false);
        setEditando(null);
        setForm({ nom_especie: '', nombre_comun: '' });
        setError('');
    };

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');
        setGuardando(true);

        try {
            if (editando) {
                await API_GESTION.put(`/plagas/${editando}`, form);
                setExito('Plaga actualizada exitosamente');
            } else {
                await API_GESTION.post('/plagas', form);
                setExito('Plaga creada exitosamente');
            }
            cerrarForm();
            cargarDatos();
            setTimeout(() => setExito(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar plaga');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarPlaga = async (id) => {
        try {
            setEliminando(true);
            setErrorEliminar('');
            await API_GESTION.delete(`/plagas/${id}`);
            setPlagas(prev => prev.filter(p => p.id_plaga !== id));
            setModalEliminar(null);
            setExito('Plaga eliminada exitosamente');
            setTimeout(() => setExito(''), 3000);
        } catch (err) {
            setErrorEliminar(err.response?.data?.error || 'Error al eliminar plaga');
        } finally {
            setEliminando(false);
        }
    };

    const plagaTieneAsociaciones = (idPlaga) => {
        return (plagasEspecies[idPlaga] || []).length > 0;
    };

    // ====== ASOCIACIONES ======
    const toggleAsociar = (plaga) => {
        if (mostrarAsociar?.id_plaga === plaga.id_plaga) {
            setMostrarAsociar(null);
        } else {
            setMostrarAsociar(plaga);
            setEspecieAsociar('');
            setMostrarForm(false);
        }
    };

    const asociarEspecie = async () => {
        if (!especieAsociar) return;
        try {
            setAsociando(true);
            await API_GESTION.post(`/plagas/${mostrarAsociar.id_plaga}/especies`, {
                id_especie: Number(especieAsociar)
            });
            setExito('Especie asociada exitosamente');
            setEspecieAsociar('');
            cargarDatos();
            setTimeout(() => setExito(''), 3000);
        } catch (err) {
            alert(err.response?.data?.error || 'Error al asociar especie');
        } finally {
            setAsociando(false);
        }
    };

    const desasociarEspecie = async (idPlaga, idEspecie) => {
        try {
            await API_GESTION.delete(`/plagas/${idPlaga}/especies/${idEspecie}`);
            setExito('Asociación eliminada exitosamente');
            cargarDatos();
            setTimeout(() => setExito(''), 3000);
        } catch (err) {
            alert(err.response?.data?.error || 'Error al desasociar');
        }
    };

    const getEspeciesNoAsociadas = (idPlaga) => {
        const asociadas = (plagasEspecies[idPlaga] || []).map(e => e.id_especie);
        return especies.filter(e => !asociadas.includes(e.id_especie));
    };

    const plagasFiltradas = plagas.filter(p =>
        p.nom_especie?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.nombre_comun?.toLowerCase().includes(busqueda.toLowerCase())
    );

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
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h4 style={{ fontWeight: 700 }}>
                        <FiAlertTriangle className="me-2" /> Gestión de Plagas
                    </h4>
                    <p className="text-muted mb-0">Catálogo de plagas y sus relaciones con especies vegetales</p>
                </div>
                <button className="btn btn-primary-admin text-white" onClick={abrirFormCrear}>
                    <FiPlus className="me-2" /> Nueva Plaga
                </button>
            </div>

            {exito && <div className="alert alert-success py-2">{exito}</div>}

            {/* Formulario CRUD */}
            {mostrarForm && (
                <div ref={formRef} style={{ scrollMarginTop: '100px' }} className="content-card mb-4 border-start border-4 border-success">
                    <h6 className="fw-bold mb-3">
                        {editando ? 'Editar Plaga' : 'Nueva Plaga'}
                    </h6>
                    {error && <div className="alert alert-danger py-2">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Nombre Científico *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="nom_especie"
                                    value={form.nom_especie}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: Diaphorina citri"
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Nombre Común *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="nombre_comun"
                                    value={form.nombre_comun}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: Psílido asiático de los cítricos"
                                />
                            </div>
                        </div>
                        <div className="d-flex gap-2 mt-3">
                            <button type="submit" className="btn btn-primary-admin text-white" disabled={guardando}>
                                <FiSave className="me-2" />
                                {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear Plaga')}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={cerrarForm}>
                                <FiX className="me-2" /> Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Panel de asociación */}
            {mostrarAsociar && (
                <div ref={asociarRef} style={{ scrollMarginTop: '100px' }} className="content-card mb-4 border-start border-4 border-primary">
                    <h6 className="fw-bold mb-3">
                        <FiLink className="me-2" />
                        Especies asociadas a: <em>{mostrarAsociar.nombre_comun}</em>
                    </h6>

                    {/* Especies ya asociadas */}
                    <div className="mb-3">
                        {(plagasEspecies[mostrarAsociar.id_plaga] || []).length === 0 ? (
                            <p className="text-muted small">No tiene especies asociadas</p>
                        ) : (
                            <div className="d-flex flex-wrap gap-2">
                                {(plagasEspecies[mostrarAsociar.id_plaga] || []).map(esp => (
                                    <span
                                        key={esp.id_especie}
                                        className="badge bg-light text-dark border d-flex align-items-center gap-1 py-2 px-3"
                                    >
                                        {esp.nom_comun}
                                        <button
                                            className="btn btn-sm p-0 ms-1 text-danger"
                                            onClick={() => desasociarEspecie(mostrarAsociar.id_plaga, esp.id_especie)}
                                            title="Quitar asociación"
                                            style={{ lineHeight: 1 }}
                                        >
                                            <FiX size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Agregar nueva asociación */}
                    <div className="d-flex gap-2 align-items-end">
                        <div className="flex-grow-1">
                            <label className="form-label fw-semibold small">Agregar especie:</label>
                            <select
                                className="form-select form-select-sm"
                                value={especieAsociar}
                                onChange={(e) => setEspecieAsociar(e.target.value)}
                            >
                                <option value="">Seleccione una especie...</option>
                                {getEspeciesNoAsociadas(mostrarAsociar.id_plaga).map(e => (
                                    <option key={e.id_especie} value={e.id_especie}>
                                        {e.nom_comun} ({e.nom_especie})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            className="btn btn-sm btn-primary-admin text-white"
                            onClick={asociarEspecie}
                            disabled={!especieAsociar || asociando}
                        >
                            <FiPlus className="me-1" />
                            {asociando ? '...' : 'Asociar'}
                        </button>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setMostrarAsociar(null)}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {/* Filtro */}
            <div className="content-card mb-4">
                <div className="input-group">
                    <span className="input-group-text"><FiSearch /></span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por nombre científico o común..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="content-card">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Nombre Científico</th>
                                <th>Nombre Común</th>
                                <th>Especies Afectadas</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plagasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted py-4">
                                        No se encontraron plagas
                                    </td>
                                </tr>
                            ) : (
                                plagasFiltradas.map(plaga => (
                                    <tr key={plaga.id_plaga}>
                                        <td><strong>{plaga.id_plaga}</strong></td>
                                        <td><em>{plaga.nom_especie}</em></td>
                                        <td>{plaga.nombre_comun}</td>
                                        <td>
                                            {(plagasEspecies[plaga.id_plaga] || []).length === 0 ? (
                                                <span className="text-muted small">Sin asociaciones</span>
                                            ) : (
                                                <div className="d-flex flex-wrap gap-1">
                                                    {(plagasEspecies[plaga.id_plaga] || []).map(esp => (
                                                        <span
                                                            key={esp.id_especie}
                                                            className="badge bg-light text-dark border"
                                                            style={{ fontSize: '0.75rem' }}
                                                        >
                                                            {esp.nom_comun}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-outline-info me-1"
                                                onClick={() => toggleAsociar(plaga)}
                                                title="Gestionar especies"
                                            >
                                                <FiLink />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-primary me-1"
                                                onClick={() => abrirFormEditar(plaga)}
                                                title="Editar"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => setModalEliminar(plaga)}
                                                title="Eliminar"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-3 text-muted small">
                    Mostrando {plagasFiltradas.length} de {plagas.length} plagas
                </div>
            </div>

            {/* Modal eliminar */}
            {modalEliminar && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirmar Eliminación</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => { setModalEliminar(null); setErrorEliminar(''); }}
                                />
                            </div>
                            <div className="modal-body">
                                {errorEliminar && (
                                    <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                                        <FiAlertCircle />
                                        <span>{errorEliminar}</span>
                                    </div>
                                )}
                                <p>¿Está seguro de eliminar la plaga:</p>
                                <p className="fw-bold">
                                    {modalEliminar.nombre_comun} (<em>{modalEliminar.nom_especie}</em>)
                                </p>

                                {plagaTieneAsociaciones(modalEliminar.id_plaga) ? (
                                    <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                                        <FiAlertCircle />
                                        <div>
                                            <strong>No se puede eliminar.</strong>
                                            <br />
                                            <small>
                                                Esta plaga tiene {(plagasEspecies[modalEliminar.id_plaga] || []).length} especie(s) 
                                                asociada(s). Debe desasociarlas primero desde el botón 
                                                <FiLink className="mx-1" size={12} /> de la tabla.
                                            </small>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="alert alert-warning py-2">
                                        <small>Esta acción no se puede deshacer.</small>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => { setModalEliminar(null); setErrorEliminar(''); }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => eliminarPlaga(modalEliminar.id_plaga)}
                                    disabled={eliminando || plagaTieneAsociaciones(modalEliminar.id_plaga)}
                                >
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

export default Plagas;