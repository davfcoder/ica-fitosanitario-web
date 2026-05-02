import { useState, useEffect } from 'react';
import { API_GESTION } from '../../api/axiosConfig';
import {
    FiPlus, FiEdit2, FiTrash2, FiSearch, FiSave, FiX,
    FiMapPin, FiAlertCircle, FiMap, FiUser
} from 'react-icons/fi';
import SelectorUbicacion from '../../components/common/SelectorUbicacion';


const Predios = () => {
    const [predios, setPredios] = useState([]);
    const [lugares, setLugares] = useState([]);
    const [propietarios, setPropietarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [busqueda, setBusqueda] = useState('');

    // Formulario
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({
        num_predial: '', nom_predio: '', direccion: '',
        cx: '', cy: '', area_total: '',
        id_propietario: '', nro_registro_ica: '',
        departamento: '', municipio: '', vereda: ''
    });
    const [guardando, setGuardando] = useState(false);

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
            const [prediosRes, propietariosRes, lugaresRes] = await Promise.all([
                API_GESTION.get('/predios'),
                API_GESTION.get('/usuarios?rol=4'), // Solo propietarios 
                API_GESTION.get('/lugares-produccion')
            ]);
            setPredios(prediosRes.data.data);
            setPropietarios(propietariosRes.data.data);
            setLugares(lugaresRes.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar datos');
        } finally {
            setCargando(false);
        }
    };

    const formVacio = {
        num_predial: '', nom_predio: '', direccion: '',
        cx: '', cy: '', area_total: '',
        id_propietario: '', nro_registro_ica: '',
        departamento: '', municipio: '', vereda: ''
    };

    const abrirFormCrear = () => {
        setForm(formVacio);
        setEditando(null);
        setMostrarForm(true);
        setError('');
        setExito('');
    };

    const abrirFormEditar = (predio) => {
        setForm({
            num_predial: predio.num_predial || '',
            nom_predio: predio.nom_predio || '',
            direccion: predio.direccion || '',
            cx: predio.cx || '',
            cy: predio.cy || '',
            area_total: predio.area_total || '',
            id_propietario: predio.id_propietario || '',
            nro_registro_ica: predio.nro_registro_ica || '',
            departamento: predio.departamento || '',
            municipio: predio.municipio || '',
            vereda: predio.vereda || ''
        });
        setEditando(predio.id_predio);
        setMostrarForm(true);
        setError('');
        setExito('');
    };

    const cerrarForm = () => {
        setMostrarForm(false);
        setEditando(null);
        setForm(formVacio);
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
            const datos = {
                ...form,
                area_total: Number(form.area_total),
                id_propietario: Number(form.id_propietario)
            };

            if (!datos.nro_registro_ica) datos.nro_registro_ica = null;

            if (editando) {
                await API_GESTION.put(`/predios/${editando}`, datos);
                setExito('Predio actualizado exitosamente');
            } else {
                await API_GESTION.post('/predios', datos);
                setExito('Predio registrado exitosamente');
            }
            cerrarForm();
            cargarDatos();
            setTimeout(() => setExito(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar predio');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarPredio = async (id) => {
        try {
            setEliminando(true);
            setErrorEliminar('');
            await API_GESTION.delete(`/predios/${id}`);
            setPredios(prev => prev.filter(p => p.id_predio !== id));
            setModalEliminar(null);
            setExito('Predio eliminado exitosamente');
            setTimeout(() => setExito(''), 3000);
        } catch (err) {
            setErrorEliminar(err.response?.data?.error || 'Error al eliminar predio');
        } finally {
            setEliminando(false);
        }
    };

    const getNombrePropietario = (idPropietario) => {
        const prop = propietarios.find(p => p.id_usuario === idPropietario);
        return prop ? `${prop.nombres} ${prop.apellidos}` : `Usuario #${idPropietario}`;
    };

    const getNombreLugar = (idLugar) => {
        if (!idLugar) return null;
        const lugar = lugares.find(l => l.id_lugar_produccion === idLugar);
        return lugar ? lugar.nom_lugar_produccion : `Lugar #${idLugar}`;
    };

    const prediosFiltrados = predios.filter(p =>
        p.nom_predio?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.num_predial?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.municipio?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.departamento?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.vereda?.toLowerCase().includes(busqueda.toLowerCase())
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
                        <FiMapPin className="me-2" /> Gestión de Predios
                    </h4>
                    <p className="text-muted mb-0">Administración de predios agrícolas</p>
                </div>
                <button className="btn btn-primary-admin text-white" onClick={abrirFormCrear}>
                    <FiPlus className="me-2" /> Nuevo Predio
                </button>
            </div>

            {exito && <div className="alert alert-success py-2">{exito}</div>}

            {/* Formulario */}
            {mostrarForm && (
                <div className="content-card mb-4 border-start border-4 border-success">
                    <h6 className="fw-bold mb-3">
                        {editando ? 'Editar Predio' : 'Nuevo Predio'}
                    </h6>
                    {error && <div className="alert alert-danger py-2">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        {/* Información básica */}
                        <h6 className="fw-semibold text-muted mb-2 mt-2">
                            <FiMapPin className="me-1" /> Información del Predio
                        </h6>
                        <div className="row g-3 mb-3">
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Número Predial *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="num_predial"
                                    value={form.num_predial}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: 00-00-000-0000-000"
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Nombre del Predio *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="nom_predio"
                                    value={form.nom_predio}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: Finca La Esperanza"
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Área Total (ha) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    name="area_total"
                                    value={form.area_total}
                                    onChange={handleChange}
                                    required
                                    min="0.01"
                                    placeholder="Ej: 15.5"
                                />
                            </div>
                            <div className="col-md-8">
                                <label className="form-label fw-semibold">Dirección *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="direccion"
                                    value={form.direccion}
                                    onChange={handleChange}
                                    required
                                    placeholder="Dirección del predio"
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Nro. Registro ICA</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="nro_registro_ica"
                                    value={form.nro_registro_ica}
                                    onChange={handleChange}
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>

                        {/* Propietario */}
                        <h6 className="fw-semibold text-muted mb-2">
                            <FiUser className="me-1" /> Propietario
                        </h6>
                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Propietario *</label>
                                <select
                                    className="form-select"
                                    name="id_propietario"
                                    value={form.id_propietario}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccione un propietario...</option>
                                    {propietarios.map(p => (
                                        <option key={p.id_usuario} value={p.id_usuario}>
                                            {p.nombres} {p.apellidos} - CC {p.num_identificacion}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Coordenadas */}
                        <h6 className="fw-semibold text-muted mb-2">
                            <FiMap className="me-1" /> Coordenadas Geográficas
                        </h6>
                        <div className="row g-3 mb-3">
                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Coordenada X (Longitud) *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="cx"
                                    value={form.cx}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: -75.5636"
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Coordenada Y (Latitud) *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="cy"
                                    value={form.cy}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: 6.2518"
                                />
                            </div>
                        </div>

                        {/* Ubicación DANE */}
                        <div className="mb-3">
                            <SelectorUbicacion
                                form={form}
                                onChange={(cambios) => setForm(prev => ({ ...prev, ...cambios }))}
                            />
                        </div>

                        {/* Botones */}
                        <div className="d-flex gap-2 mt-3 pt-3 border-top">
                            <button type="submit" className="btn btn-primary-admin text-white" disabled={guardando}>
                                <FiSave className="me-2" />
                                {guardando ? 'Guardando...' : (editando ? 'Actualizar Predio' : 'Registrar Predio')}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={cerrarForm}>
                                <FiX className="me-2" /> Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filtro */}
            <div className="content-card mb-4">
                <div className="input-group">
                    <span className="input-group-text"><FiSearch /></span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por nombre, número predial, municipio, departamento o vereda..."
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
                                <th>Nro. Predial</th>
                                <th>Nombre</th>
                                <th>Ubicación</th>
                                <th>Área (ha)</th>
                                <th>Propietario</th>
                                <th>Lugar Producción</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prediosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center text-muted py-4">
                                        No se encontraron predios
                                    </td>
                                </tr>
                            ) : (
                                prediosFiltrados.map(predio => (
                                    <tr key={predio.id_predio}>
                                        <td><strong>{predio.num_predial}</strong></td>
                                        <td>{predio.nom_predio}</td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <div>{predio.vereda}</div>
                                                <div className="text-muted">
                                                    {predio.municipio}, {predio.departamento}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark border">
                                                {predio.area_total} ha
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {getNombrePropietario(predio.id_propietario)}
                                        </td>
                                        <td>
                                            {predio.id_lugar_produccion ? (
                                                <span className="badge bg-success">
                                                    {getNombreLugar(predio.id_lugar_produccion)}
                                                </span>
                                            ) : (
                                                <span className="badge bg-secondary">Disponible</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-outline-primary me-1"
                                                onClick={() => abrirFormEditar(predio)}
                                                title="Editar"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => { setModalEliminar(predio); setErrorEliminar(''); }}
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
                    Mostrando {prediosFiltrados.length} de {predios.length} predios
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
                                <p>¿Está seguro de eliminar el predio:</p>
                                <p className="fw-bold">{modalEliminar.nom_predio}</p>
                                <p className="text-muted small">Nro. Predial: {modalEliminar.num_predial}</p>

                                {modalEliminar.id_lugar_produccion ? (
                                    <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                                        <FiAlertCircle />
                                        <div>
                                            <strong>No se puede eliminar.</strong>
                                            <br />
                                            <small>
                                                Este predio está asociado al lugar de producción "{getNombreLugar(modalEliminar.id_lugar_produccion)}".
                                                Debe desvincularlo primero.
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
                                    onClick={() => eliminarPredio(modalEliminar.id_predio)}
                                    disabled={eliminando || Boolean(modalEliminar.id_lugar_produccion)}
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

export default Predios;