import { useState, useEffect } from 'react';
import { API_GESTION } from '../../api/axiosConfig';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiSave, FiX, FiAlertCircle} from 'react-icons/fi';
import { LuLeaf } from 'react-icons/lu';

const EspeciesVegetales = () => {
    const [especies, setEspecies] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroCiclo, setFiltroCiclo] = useState('');

    // Estado del formulario (crear/editar)
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({ nom_especie: '', nom_comun: '', ciclo_cultivo: '' });
    const [guardando, setGuardando] = useState(false);

    // Modal eliminar
    const [modalEliminar, setModalEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);
    const [errorEliminar, setErrorEliminar] = useState('');


    useEffect(() => {
        cargarEspecies();
    }, []);

    const cargarEspecies = async () => {
        try {
            setCargando(true);
            const response = await API_GESTION.get('/especies-vegetales');
            setEspecies(response.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar especies');
        } finally {
            setCargando(false);
        }
    };

    const abrirFormCrear = () => {
        setForm({ nom_especie: '', nom_comun: '', ciclo_cultivo: '' });
        setEditando(null);
        setMostrarForm(true);
        setError('');
        setExito('');
    };

    const abrirFormEditar = (especie) => {
        setForm({
            nom_especie: especie.nom_especie,
            nom_comun: especie.nom_comun,
            ciclo_cultivo: especie.ciclo_cultivo
        });
        setEditando(especie.id_especie);
        setMostrarForm(true);
        setError('');
        setExito('');
    };

    const cerrarForm = () => {
        setMostrarForm(false);
        setEditando(null);
        setForm({ nom_especie: '', nom_comun: '', ciclo_cultivo: '' });
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
                await API_GESTION.put(`/especies-vegetales/${editando}`, form);
                setExito('Especie vegetal actualizada exitosamente');
            } else {
                await API_GESTION.post('/especies-vegetales', form);
                setExito('Especie vegetal creada exitosamente');
            }
            cerrarForm();
            cargarEspecies();
            setTimeout(() => setExito(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar especie');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarEspecie = async (id) => {
        try {
            setEliminando(true);
            setErrorEliminar('');
            await API_GESTION.delete(`/especies-vegetales/${id}`);
            setEspecies(prev => prev.filter(e => e.id_especie !== id));
            setModalEliminar(null);
            setExito('Especie vegetal eliminada exitosamente');
            setTimeout(() => setExito(''), 3000);
        } catch (err) {
            setErrorEliminar(err.response?.data?.error || 'Error al eliminar especie');
        } finally {
            setEliminando(false);
        }
    };

    const getCicloBadge = (ciclo) => {
        const estilos = {
            'Corto': 'bg-info text-dark',
            'Medio': 'bg-warning text-dark',
            'Largo': 'bg-success'
        };
        return <span className={`badge ${estilos[ciclo] || 'bg-secondary'}`}>{ciclo}</span>;
    };

    const especiesFiltradas = especies.filter(e => {
        const coincideBusqueda =
            e.nom_especie?.toLowerCase().includes(busqueda.toLowerCase()) ||
            e.nom_comun?.toLowerCase().includes(busqueda.toLowerCase());
        const coincideCiclo = !filtroCiclo || e.ciclo_cultivo === filtroCiclo;
        return coincideBusqueda && coincideCiclo;
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
                        <lULeaf className="me-2" /> Especies Vegetales
                    </h4>
                    <p className="text-muted mb-0">Catálogo oficial de especies vegetales</p>
                </div>
                <button className="btn btn-primary-admin text-white" onClick={abrirFormCrear}>
                    <FiPlus className="me-2" /> Nueva Especie
                </button>
            </div>

            {exito && <div className="alert alert-success py-2">{exito}</div>}

            {/* Formulario inline crear/editar */}
            {mostrarForm && (
                <div className="content-card mb-4 border-start border-4 border-success">
                    <h6 className="fw-bold mb-3">
                        {editando ? 'Editar Especie Vegetal' : 'Nueva Especie Vegetal'}
                    </h6>
                    {error && <div className="alert alert-danger py-2">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Nombre Científico *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="nom_especie"
                                    value={form.nom_especie}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: Persea americana"
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Nombre Común *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="nom_comun"
                                    value={form.nom_comun}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: Aguacate"
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Ciclo de Cultivo *</label>
                                <select
                                    className="form-select"
                                    name="ciclo_cultivo"
                                    value={form.ciclo_cultivo}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccione...</option>
                                    <option value="Corto">Corto</option>
                                    <option value="Medio">Medio</option>
                                    <option value="Largo">Largo</option>
                                </select>
                            </div>
                        </div>
                        <div className="d-flex gap-2 mt-3">
                            <button type="submit" className="btn btn-primary-admin text-white" disabled={guardando}>
                                <FiSave className="me-2" />
                                {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear Especie')}
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
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar por nombre científico o común..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <select
                            className="form-select"
                            value={filtroCiclo}
                            onChange={(e) => setFiltroCiclo(e.target.value)}
                        >
                            <option value="">Todos los ciclos</option>
                            <option value="Corto">Corto</option>
                            <option value="Medio">Medio</option>
                            <option value="Largo">Largo</option>
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
                                <th>Nombre Científico</th>
                                <th>Nombre Común</th>
                                <th>Ciclo de Cultivo</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {especiesFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted py-4">
                                        No se encontraron especies vegetales
                                    </td>
                                </tr>
                            ) : (
                                especiesFiltradas.map(especie => (
                                    <tr key={especie.id_especie}>
                                        <td><strong>{especie.id_especie}</strong></td>
                                        <td><em>{especie.nom_especie}</em></td>
                                        <td>{especie.nom_comun}</td>
                                        <td>{getCicloBadge(especie.ciclo_cultivo)}</td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => abrirFormEditar(especie)}
                                                title="Editar"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => setModalEliminar(especie)}
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
                    Mostrando {especiesFiltradas.length} de {especies.length} especies
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
                                onClick={() => { setModalEliminar(null); setErrorEliminar(''); }}/>
                            </div>
                            <div className="modal-body">
                                {errorEliminar && (
                                    <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                                        <FiAlertCircle />
                                        <span>{errorEliminar}</span>
                                    </div>
                                )}
                                <p>¿Está seguro de eliminar la especie:</p>
                                <p className="fw-bold">
                                    {modalEliminar.nom_comun} (<em>{modalEliminar.nom_especie}</em>)
                                </p>
                                <div className="alert alert-warning py-2">
                                    <small>No se puede eliminar si tiene variedades o proyecciones asociadas.</small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn btn-secondary" 
                                     onClick={() => { setModalEliminar(null); setErrorEliminar(''); }}
                                     >Cancelar
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => eliminarEspecie(modalEliminar.id_especie)}
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

export default EspeciesVegetales;