import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiShield } from 'react-icons/fi';

const Login = () => {
    const [correo, setCorreo] = useState('');
    const [contrasenia, setContrasenia] = useState('');
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
            <div className="text-center">
                <div className="login-logo">
                    <FiShield />
                </div>
                <h2 style={{ color: '#0f7c3a', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Sistema de Inspecciones
                </h2>
                <h2 style={{ color: '#0f7c3a', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Fitosanitarias
                </h2>
                <p className="text-muted mb-4">Instituto Colombiano Agropecuario - ICA</p>

                <div className="login-card text-start">
                    <h5 className="text-center mb-4" style={{ fontWeight: 600 }}>Iniciar Sesión</h5>

                    {error && (
                        <div className="alert alert-danger py-2" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Correo Electrónico</label>
                            <div className="input-group">
                                <span className="input-group-text"><FiMail /></span>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="correo@ejemplo.com"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-semibold">Contraseña</label>
                            <div className="input-group">
                                <span className="input-group-text"><FiLock /></span>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Ingrese su contraseña"
                                    value={contrasenia}
                                    onChange={(e) => setContrasenia(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn w-100 text-white py-2"
                            style={{ background: '#0f7c3a', fontWeight: 600 }}
                            disabled={cargando}
                        >
                            {cargando ? 'Iniciando...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <div className="text-center mt-3">
                        <small className="text-muted">
                            Para pruebas: admin@ica.gov.co | tecnico@ica.gov.co | productor@ejemplo.com
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;