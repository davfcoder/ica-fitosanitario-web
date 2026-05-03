import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_GESTION } from '../../api/axiosConfig';
import { FiSave, FiArrowLeft, FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiShield, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';

const UsuarioForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const esEdicion = Boolean(id);

    const [form, setForm] = useState({
        num_identificacion: '',
        nombres: '',
        apellidos: '',
        direccion: '',
        telefono: '',
        correo_electronico: '',
        contrasenia: '',
        confirmar_contrasenia: '',
        id_rol: '',
        nro_registro_ica: '',
        tarjeta_profesional: ''
    });

    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(false);

    // Estados para controlar la visibilidad de las contraseñas
    const [mostrarContrasenia, setMostrarContrasenia] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    
    const esPropietario = Number(form.id_rol) === 4;

    useEffect(() => {
        if (esEdicion) {
            cargarUsuario();
        }
    }, [id]);

    // Limpiar contraseñas cuando se cambia a Propietario
    useEffect(() => {
        if (esPropietario) {
            setForm(prev => ({ ...prev, contrasenia: '', confirmar_contrasenia: '' }));
        }
    }, [esPropietario]);

    const cargarUsuario = async () => {
        try {
            setCargando(true);
            const response = await API_GESTION.get(`/usuarios/${id}`);
            const usuario = response.data.data;
            setForm({
                num_identificacion: usuario.num_identificacion || '',
                nombres: usuario.nombres || '',
                apellidos: usuario.apellidos || '',
                direccion: usuario.direccion || '',
                telefono: usuario.telefono || '',
                correo_electronico: usuario.correo_electronico || '',
                contrasenia: '',
                confirmar_contrasenia: '',
                id_rol: usuario.id_rol || '',
                nro_registro_ica: usuario.nro_registro_ica || '',
                tarjeta_profesional: usuario.tarjeta_profesional || ''
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar usuario');
        } finally {
            setCargando(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setError('');
        setExito('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');

        // NUEVA VALIDACIÓN: Coincidencia de contraseñas
        if (!esPropietario && (form.contrasenia || form.confirmar_contrasenia)) {
            if (form.contrasenia !== form.confirmar_contrasenia) {
                setError('Las contraseñas no coinciden. Por favor, verifique.');
                return; // Detiene el guardado
            }
        }

        setGuardando(true);

        try {
            const datos = { ...form };
            
            // Eliminar confirmar_contrasenia antes de enviar al backend
            delete datos.confirmar_contrasenia;

            // Propietario: no enviar contraseña
            if (esPropietario) {
                delete datos.contrasenia;
            }

            // En edición, no enviar contraseña si está vacía
            if (esEdicion && !datos.contrasenia) {
                delete datos.contrasenia;
            }

            datos.num_identificacion = Number(datos.num_identificacion);
            datos.id_rol = Number(datos.id_rol);

            if (!datos.nro_registro_ica) datos.nro_registro_ica = null;
            if (!datos.tarjeta_profesional) datos.tarjeta_profesional = null;

            if (esEdicion) {
                await API_GESTION.put(`/usuarios/${id}`, datos);
                setExito('Usuario actualizado exitosamente');
            } else {
                await API_GESTION.post('/usuarios', datos);
                setExito('Usuario creado exitosamente');
                setTimeout(() => navigate('/admin/usuarios'), 1500);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar usuario');
        } finally {
            setGuardando(false);
        }
    };

    const mostrarCamposRol = () => {
        const rol = Number(form.id_rol);
        return {
            mostrarRegistroICA: rol === 1 || rol === 3,
            mostrarTarjetaProfesional: rol === 3
        };
    };

    const { mostrarRegistroICA, mostrarTarjetaProfesional } = mostrarCamposRol();

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
            <div className="d-flex align-items-center gap-3 mb-4">
                <button className="btn btn-outline-secondary" onClick={() => navigate('/admin/usuarios')}>
                    <FiArrowLeft />
                </button>
                <div>
                    <h4 style={{ fontWeight: 700 }} className="mb-0">
                        {esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h4>
                    <p className="text-muted mb-0">
                        {esEdicion ? 'Modifique los datos del usuario' : 'Complete el formulario para registrar un nuevo usuario'}
                    </p>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {exito && <div className="alert alert-success">{exito}</div>}

            <div className="content-card">
                <form onSubmit={handleSubmit}>
                    {/* Información Personal */}
                    <h6 className="fw-bold mb-3">
                        <FiUser className="me-2" /> Información Personal
                    </h6>
                    <div className="row g-3 mb-4">
                        <div className="col-md-6">
                            <label className="form-label fw-semibold">Número de Identificación *</label>
                            <input
                                type="number" className="form-control" name="num_identificacion"
                                value={form.num_identificacion} onChange={handleChange}
                                required placeholder="Ej: 1234567890"
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold">Rol *</label>
                            <div className="input-group">
                                <span className="input-group-text"><FiShield /></span>
                                <select className="form-select" name="id_rol"
                                    value={form.id_rol} onChange={handleChange} required>
                                    <option value="">Seleccione un rol</option>
                                    <option value="1">Administrador ICA</option>
                                    <option value="2">Productor</option>
                                    <option value="3">Asistente Técnico</option>
                                    <option value="4">Propietario</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold">Nombres *</label>
                            <input type="text" className="form-control" name="nombres"
                                value={form.nombres} onChange={handleChange}
                                required placeholder="Nombres del usuario" />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold">Apellidos *</label>
                            <input type="text" className="form-control" name="apellidos"
                                value={form.apellidos} onChange={handleChange}
                                required placeholder="Apellidos del usuario" />
                        </div>
                    </div>

                    {/* Contacto */}
                    <h6 className="fw-bold mb-3">
                        <FiMail className="me-2" /> Información de Contacto
                    </h6>
                    <div className="row g-3 mb-4">
                        <div className="col-md-6">
                            <label className="form-label fw-semibold">Correo Electrónico *</label>
                            <div className="input-group">
                                <span className="input-group-text"><FiMail /></span>
                                <input type="email" className="form-control" name="correo_electronico"
                                    value={form.correo_electronico} onChange={handleChange}
                                    required placeholder="correo@ejemplo.com" />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold">Teléfono *</label>
                            <div className="input-group">
                                <span className="input-group-text"><FiPhone /></span>
                                <input type="text" className="form-control" name="telefono"
                                    value={form.telefono} onChange={handleChange}
                                    required placeholder="3001234567" />
                            </div>
                        </div>
                        <div className="col-md-12">
                            <label className="form-label fw-semibold">Dirección *</label>
                            <div className="input-group">
                                <span className="input-group-text"><FiMapPin /></span>
                                <input type="text" className="form-control" name="direccion"
                                    value={form.direccion} onChange={handleChange}
                                    required placeholder="Dirección del usuario" />
                            </div>
                        </div>
                    </div>

                    {/* Seguridad — Oculto para Propietario */}
                    {!esPropietario && (
                        <>
                            <h6 className="fw-bold mb-3">
                                <FiLock className="me-2" /> Seguridad
                            </h6>
                            <div className="row g-3 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Contraseña {esEdicion ? '(dejar vacío para no cambiar)' : '*'}
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text"><FiLock /></span>
                                        <input 
                                            type={mostrarContrasenia ? "text" : "password"} 
                                            className="form-control" 
                                            name="contrasenia"
                                            value={form.contrasenia} 
                                            onChange={handleChange}
                                            required={!esEdicion}
                                            placeholder={esEdicion ? '••••••••' : 'Mínimo 6 caracteres'}
                                            minLength={esEdicion ? 0 : 6} 
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-secondary" 
                                            onClick={() => setMostrarContrasenia(!mostrarContrasenia)}
                                            title={mostrarContrasenia ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        >
                                            {mostrarContrasenia ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Confirmar Contraseña {esEdicion ? '(dejar vacío para no cambiar)' : '*'}
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text"><FiLock /></span>
                                        <input 
                                            type={mostrarConfirmacion ? "text" : "password"} 
                                            className="form-control" 
                                            name="confirmar_contrasenia"
                                            value={form.confirmar_contrasenia} 
                                            onChange={handleChange}
                                            required={!esEdicion && form.contrasenia !== ''} // Requerido si se está creando, o si se escribió algo en la nueva contraseña
                                            placeholder={esEdicion ? '••••••••' : 'Repita la contraseña'}
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-secondary" 
                                            onClick={() => setMostrarConfirmacion(!mostrarConfirmacion)}
                                            title={mostrarConfirmacion ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        >
                                            {mostrarConfirmacion ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Aviso para Propietario */}
                    {esPropietario && (
                        <div className="alert alert-info d-flex align-items-center gap-2 mb-4">
                            <FiAlertCircle />
                            <span>Los usuarios con rol <strong>Propietario</strong> no tienen acceso al sistema. Solo se registran para asociarlos como responsables de predios.</span>
                        </div>
                    )}

                    {/* Campos condicionales según rol */}
                    {(mostrarRegistroICA || mostrarTarjetaProfesional) && (
                        <>
                            <h6 className="fw-bold mb-3">
                                <FiShield className="me-2" /> Información Profesional
                            </h6>
                            <div className="row g-3 mb-4">
                                {mostrarRegistroICA && (
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Nro. Registro ICA</label>
                                        <input type="text" className="form-control" name="nro_registro_ica"
                                            value={form.nro_registro_ica} onChange={handleChange}
                                            placeholder="Número de registro ICA" />
                                    </div>
                                )}
                                {mostrarTarjetaProfesional && (
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Tarjeta Profesional</label>
                                        <input type="text" className="form-control" name="tarjeta_profesional"
                                            value={form.tarjeta_profesional} onChange={handleChange}
                                            placeholder="Número de tarjeta profesional" />
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Botones */}
                    <div className="d-flex gap-3 pt-3 border-top">
                        <button type="submit" className="btn btn-primary-admin text-white" disabled={guardando}>
                            <FiSave className="me-2" />
                            {guardando ? 'Guardando...' : (esEdicion ? 'Actualizar Usuario' : 'Crear Usuario')}
                        </button>
                        <button type="button" className="btn btn-outline-secondary"
                            onClick={() => navigate('/admin/usuarios')}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UsuarioForm;