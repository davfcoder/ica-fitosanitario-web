import { useState, useEffect, useRef } from 'react';
import { API_GESTION } from '../../api/axiosConfig';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiSave, FiX, FiTag, FiAlertCircle} from 'react-icons/fi';

const VariedadesEspecie = () => {
    const [variedades, setVariedades] = useState([]);
    const [especies, setEspecies] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroEspecie, setFiltroEspecie] = useState('');

    // Formulario
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({ nom_variedad: '', id_especie: '' });
    const [guardando, setGuardando] = useState(false);

    // Referencia para el auto-scroll
    const formRef = useRef(null);

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


    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [varRes, espRes] = await Promise.all([
                API_GESTION.get('/variedades'),
                API_GESTION.get('/especies-vegetales')
            ]);
            setVariedades(varRes.data.data);
            setEspecies(espRes.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar datos');
        } finally {
            setCargando(false);
        }
    };

    const getNombreEspecie = (idEspecie) => {
        const especie = especies.find(e => e.id_especie === idEspecie);
        return especie ? `${especie.nom_comun} (${especie.nom_especie})` : 'Desconocida';
    };

    const abrirFormCrear = () => {
        setForm({ nom_variedad: '', id_especie: '' });
        setEditando(null);
        setMostrarForm(true);
        setError('');
        setExito('');
    };

    const abrirFormEditar = (variedad) => {
        setForm({
            nom_variedad: variedad.nom_variedad,
            id_especie: variedad.id_especie
        });
        setEditando(variedad.id_variedad);
        setMostrarForm(true);
        setError('');
        setExito('');
    };

    const cerrarForm = () => {
        setMostrarForm(false);
        setEditando(null);
        setForm({ nom_variedad: '', id_especie: '' });
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
            const datos = { ...form, id_especie: Number(form.id_especie) };

            if (editando) {
                await API_GESTION.put(`/variedades/${editando}`, datos);
                setExito('Variedad actualizada exitosamente');
            } else {
                await API_GESTION.post('/variedades', datos);
                setExito('Variedad creada exitosamente');
            }
            cerrarForm();
            cargarDatos();
            setTimeout(() => setExito(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar variedad');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarVariedad = async (id) => {
        try {
            setEliminando(true);
            setErrorEliminar('');
            await API_GESTION.delete(`/variedades/${id}`);
            setVariedades(prev => prev.filter(v => v.id_variedad !== id));
            setModalEliminar(null);
            setExito('Variedad eliminada exitosamente');
            setTimeout(() => setExito(''), 3000);
        } catch (err) {
            setErrorEliminar(err.response?.data?.error || 'Error al eliminar variedad');
        } finally {
            setEliminando(false);
        }
    };

    const variedadesFiltradas = variedades.filter(v => {
        const coincideBusqueda = v.nom_variedad?.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEspecie = !filtroEspecie || v.id_especie === Number(filtroEspecie);
        return coincideBusqueda && coincideEspecie;
    });

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
                        <FiTag className="me-2" /> Variedades de Especies
                    </h4>
                    <p className="text-muted mb-0">Catálogo de variedades por especie vegetal</p>
                </div>
                <button className="btn btn-primary-admin text-white" onClick={abrirFormCrear}>
                    <FiPlus className="me-2" /> Nueva Variedad
                </button>
            </div>

            {exito && <div className="alert alert-success py-2">{exito}</div>}

            {/* Formulario inline */}
            {mostrarForm && (
                <div ref={formRef} style={{ scrollMarginTop: '100px' }} className="content-card mb-4 border-start border-4 border-success">
                    <h6 className="fw-bold mb-3">
                        {editando ? 'Editar Variedad' : 'Nueva Variedad'}
                    </h6>
                    {error && <div className="alert alert-danger py-2">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Especie Vegetal *</label>
                                <select
                                    className="form-select"
                                    name="id_especie"
                                    value={form.id_especie}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccione una especie...</option>
                                    {especies.map(e => (
                                        <option key={e.id_especie} value={e.id_especie}>
                                            {e.nom_comun} ({e.nom_especie})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Nombre de la Variedad *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="nom_variedad"
                                    value={form.nom_variedad}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: Hass, Valencia, Kent..."
                                />
                            </div>
                        </div>
                        <div className="d-flex gap-2 mt-3">
                            <button type="submit" className="btn btn-primary-admin text-white" disabled={guardando}>
                                <FiSave className="me-2" />
                                {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear Variedad')}
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
                    <div className="col-md-6">
                        <div className="input-group">
                            <span className="input-group-text"><FiSearch /></span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar variedad..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-select"
                            value={filtroEspecie}
                            onChange={(e) => setFiltroEspecie(e.target.value)}
                        >
                            <option value="">Todas las especies</option>
                            {especies.map(e => (
                                <option key={e.id_especie} value={e.id_especie}>
                                    {e.nom_comun} ({e.nom_especie})
                                </option>
                            ))}
                        </select>
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
                                <th>Nombre de Variedad</th>
                                <th>Especie Vegetal</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variedadesFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted py-4">
                                        No se encontraron variedades
                                    </td>
                                </tr>
                            ) : (
                                variedadesFiltradas.map(variedad => (
                                    <tr key={variedad.id_variedad}>
                                        <td><strong>{variedad.id_variedad}</strong></td>
                                        <td>{variedad.nom_variedad}</td>
                                        <td>
                                            <span className="badge bg-light text-dark border">
                                                {getNombreEspecie(variedad.id_especie)}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => abrirFormEditar(variedad)}
                                                title="Editar"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => setModalEliminar(variedad)}
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
                    Mostrando {variedadesFiltradas.length} de {variedades.length} variedades
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
                                <p>¿Está seguro de eliminar la variedad:</p>
                                <p className="fw-bold">{modalEliminar.nom_variedad}</p>
                                <div className="alert alert-warning py-2">
                                    <small>No se puede eliminar si está asignada a algún lote.</small>
                                </div>
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
                                    onClick={() => eliminarVariedad(modalEliminar.id_variedad)}
                                    disabled={eliminando}
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

export default VariedadesEspecie;