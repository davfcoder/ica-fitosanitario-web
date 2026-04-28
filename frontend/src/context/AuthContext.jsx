import { createContext, useContext, useState, useEffect } from 'react';
import { API_GESTION } from '../api/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [token, setToken] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const tokenGuardado = localStorage.getItem('token');
        const usuarioGuardado = localStorage.getItem('usuario');

        if (tokenGuardado && usuarioGuardado) {
            setToken(tokenGuardado);
            setUsuario(JSON.parse(usuarioGuardado));
        }
        setCargando(false);
    }, []);

    const login = async (correo_electronico, contrasenia) => {
        const response = await API_GESTION.post('/auth/login', {
            correo_electronico,
            contrasenia
        });

        const { token: nuevoToken, usuario: datosUsuario } = response.data.data;

        localStorage.setItem('token', nuevoToken);
        localStorage.setItem('usuario', JSON.stringify(datosUsuario));

        setToken(nuevoToken);
        setUsuario(datosUsuario);

        return datosUsuario;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setToken(null);
        setUsuario(null);
    };

    const getRolColor = () => {
        if (!usuario) return 'admin';
        switch (usuario.nom_rol) {
            case 'Administrador ICA': return 'admin';
            case 'Productor': return 'productor';
            case 'Asistente Técnico': return 'asistente';
            default: return 'admin';
        }
    };

    const getInitials = () => {
        if (!usuario) return '';
        return `${usuario.nombres?.charAt(0) || ''}${usuario.apellidos?.charAt(0) || ''}`.toUpperCase();
    };

    return (
        <AuthContext.Provider value={{
            usuario,
            token,
            cargando,
            login,
            logout,
            getRolColor,
            getInitials,
            isAdmin: usuario?.nom_rol === 'Administrador ICA',
            isProductor: usuario?.nom_rol === 'Productor',
            isAsistente: usuario?.nom_rol === 'Asistente Técnico'
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};