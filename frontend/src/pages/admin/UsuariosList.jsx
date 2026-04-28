import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_GESTION } from '../../api/axiosConfig';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';

const UsuariosList = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState('');
    const [modalEliminar, setModalEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        try {
            setCargando(true);
            const response = await API_GESTION.get('/usuarios');
            setUsuarios(response.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar usuarios');
        } finally {
            setCargando(false);
        }
    };

    const eliminarUsuario = async (id) => {
        try {
            setEliminando(true);
            await API_GESTION.delete(`/usuarios/${id}`);
            setUsuarios(prev => prev.filter(u => u.id_usuario !== id));
            setModalEliminar(null);
        } catch (err) {
            alert(err.response?.data?.error || 'Error al eliminar usuario');
        } finally {
            setEliminando(false);
        }
    };

    const getRolBadge = (rol) => {
        const estilos = {
            'Administrador ICA': 'bg-success',
            'Productor': 'bg-warning text-dark',
            'Asistente Técnico': 'bg-primary'
        };
        return <span className={`badge ${estilos[rol] || 'bg-secondary'}`}>{rol}</span>;
    };

    const usuariosFiltrados = usuarios.filter(u => {
        const coincideBusqueda =
            u.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
            u.apellidos?.toLowerCase().includes(busqueda.toLowerCase()) ||
            u.correo_electronico?.toLowerCase().includes(busqueda.toLowerCase()) ||
            u.num_identificacion?.toString().includes(busqueda);

        const coincideRol = !filtroRol || u.nom_rol === filtroRol;

        return coincideBusqueda && coincideRol;
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
                    <h4 style={{ fontWeight: 700 }}>Gestión de Usuarios</h4>
                    <p className="text-muted mb-0">Administra los usuarios del sistema</p>
                </div>
                <Link to="/admin/usuarios/nuevo" className="btn btn-primary-admin text-white">
                    <FiPlus className="me-2" /> Nuevo Usuario
                </Link>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Filtros */}
            <div className="content-card mb-4">
                <div className="row g-3">
                    <div className="col-md-8">
                        <div className="input-group">
                            <span className="input-group-text"><FiSearch /></span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar por nombre, correo o identificación..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="input-group">
                            <span className="input-group-text"><FiFilter /></span>
                            <select
                                className="form-select"
                                value={filtroRol}
                                onChange={(e) => setFiltroRol(e.target.value)}
                            >
                                <option value="">Todos los roles</option>
                                <option value="Administrador ICA">Administrador ICA</option>
                                <option value="Productor">Productor</option>
                                <option value="Asistente Técnico">Asistente Técnico</option>
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
                                <th>Identificación</th>
                                <th>Nombre Completo</th>
                                <th>Correo Electrónico</th>
                                <th>Teléfono</th>
                                <th>Rol</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuariosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-4">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : (
                                usuariosFiltrados.map(usuario => (
                                    <tr key={usuario.id_usuario}>
                                        <td><strong>{usuario.num_identificacion}</strong></td>
                                        <td>{usuario.nombres} {usuario.apellidos}</td>
                                        <td>{usuario.correo_electronico}</td>
                                        <td>{usuario.telefono}</td>
                                        <td>{getRolBadge(usuario.nom_rol)}</td>
                                        <td className="text-center">
                                            <Link
                                                to={`/admin/usuarios/editar/${usuario.id_usuario}`}
                                                className="btn btn-sm btn-outline-primary me-2"
                                                title="Editar"
                                            >
                                                <FiEdit2 />
                                            </Link>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => setModalEliminar(usuario)}
                                                title="Eliminar"
                                                disabled={usuario.id_usuario === 1}
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
                    Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
                </div>
            </div>

            {/* Modal de confirmación de eliminación */}
            {modalEliminar && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirmar Eliminación</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModalEliminar(null)}
                                />
                            </div>
                            <div className="modal-body">
                                <p>¿Está seguro de eliminar al usuario:</p>
                                <p className="fw-bold">
                                    {modalEliminar.nombres} {modalEliminar.apellidos}
                                </p>
                                <p className="text-muted small">
                                    ({modalEliminar.correo_electronico})
                                </p>
                                <div className="alert alert-warning py-2">
                                    <small>Esta acción no se puede deshacer.</small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setModalEliminar(null)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => eliminarUsuario(modalEliminar.id_usuario)}
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

export default UsuariosList;