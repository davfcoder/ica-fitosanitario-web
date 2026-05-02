import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiShield, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
    const [correo, setCorreo] = useState('');
    const [contrasenia, setContrasenia] = useState('');
    const [mostrarPwd, setMostrarPwd] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        try {
            const usuario = await login(correo, contrasenia);

            switch (usuario.nom_rol) {
                case 'Administrador ICA':
                    navigate('/admin');
                    break;
                case 'Productor':
                    navigate('/productor');
                    break;
                case 'Asistente Técnico':
                    navigate('/asistente');
                    break;
                default:
                    navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-container">
            {/* Patrón decorativo de fondo */}
            <div className="login-pattern"></div>

            {/* Panel izquierdo - Branding (visible solo en pantallas grandes) */}
            <div className="login-brand-panel">
                <div className="login-brand-content">
                    <div className="login-brand-badge">
                        <FiShield />
                    </div>
                    <h1 className="login-brand-title">
                        Sistema de Inspecciones Fitosanitarias
                    </h1>
                    <p className="login-brand-subtitle">
                        Plataforma institucional para la gestión agrícola y el seguimiento
                        fitosanitario de los lugares de producción en Colombia.
                    </p>
                    <div className="login-brand-features">
                        <div className="login-feature-item">
                            <span className="login-feature-dot"></span>
                            Gestión integral de predios y lugares de producción
                        </div>
                        <div className="login-feature-item">
                            <span className="login-feature-dot"></span>
                            Registro y trazabilidad de inspecciones en campo
                        </div>
                        <div className="login-feature-item">
                            <span className="login-feature-dot"></span>
                            Reportes fitosanitarios consolidados
                        </div>
                    </div>
                </div>
                <div className="login-brand-footer">
                    Instituto Colombiano Agropecuario — ICA
                </div>
            </div>

            {/* Panel derecho - Formulario */}
            <div className="login-form-panel">
                <div className="login-card">
                    {/* Logo móvil (solo visible en pantallas pequeñas) */}
                    <div className="login-mobile-header">
                        <div className="login-logo">
                            <FiShield />
                        </div>
                        <h4 className="login-mobile-title">Inspecciones Fitosanitarias</h4>
                        <p className="login-mobile-subtitle">Instituto Colombiano Agropecuario</p>
                    </div>

                    <div className="login-card-header">
                        <h3 className="login-card-title">Bienvenido</h3>
                        <p className="login-card-subtitle">Ingrese sus credenciales para continuar</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger py-2 d-flex align-items-center gap-2" role="alert">
                            <FiShield /> <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Correo electrónico</label>
                            <div className="input-group login-input-group">
                                <span className="input-group-text"><FiMail /></span>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="correo@ejemplo.com"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-semibold">Contraseña</label>
                            <div className="input-group login-input-group">
                                <span className="input-group-text"><FiLock /></span>
                                <input
                                    type={mostrarPwd ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder="Ingrese su contraseña"
                                    value={contrasenia}
                                    onChange={(e) => setContrasenia(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="input-group-text login-pwd-toggle"
                                    onClick={() => setMostrarPwd(!mostrarPwd)}
                                    tabIndex={-1}
                                >
                                    {mostrarPwd ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn login-submit-btn w-100"
                            disabled={cargando}
                        >
                            {cargando ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </form>

                    <div className="login-card-footer">
                        <small className="text-muted">
                            Acceso restringido al personal autorizado
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;