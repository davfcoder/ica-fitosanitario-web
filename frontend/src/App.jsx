import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsuariosList from './pages/admin/UsuariosList';
import UsuarioForm from './pages/admin/UsuarioForm';
import EspeciesVegetales from './pages/admin/EspeciesVegetales';
import VariedadesEspecie from './pages/admin/VariedadesEspecie';
import Plagas from './pages/admin/Plagas';
import Predios from './pages/admin/Predios';
import LugaresProduccion from './pages/admin/LugaresProduccion';
import MisLugares from './pages/productor/MisLugares';
import ProductorDashboard from './pages/productor/ProductorDashboard';
import MisLotes from './pages/productor/MisLotes';
import MisSolicitudes from './pages/productor/MisSolicitudes';
import AsistenteDashboard from './pages/asistente/AsistenteDashboard';
import SolicitudesAdmin from './pages/admin/SolicitudesAdmin';
import RegistroInspeccion from './pages/asistente/RegistroInspeccion';
import Proyeccion from './pages/productor/Proyeccion';
import InspeccionesAdmin from './pages/admin/InspeccionesAdmin';
import MisReportesAsistente from './pages/asistente/MisReportes';
import MisReportesProductor from './pages/productor/MisReportes';

// Componente para rutas protegidas
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { usuario, cargando } = useAuth();

    if (cargando) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(usuario.nom_rol)) {
        switch (usuario.nom_rol) {
            case 'Administrador ICA': return <Navigate to="/admin" replace />;
            case 'Productor': return <Navigate to="/productor" replace />;
            case 'Asistente Técnico': return <Navigate to="/asistente" replace />;
            default: return <Navigate to="/login" replace />;
        }
    }

    return <DashboardLayout>{children}</DashboardLayout>;
};

// Placeholder temporal para páginas no implementadas
const Placeholder = ({ titulo }) => (
    <div className="content-card">
        <h5 style={{ fontWeight: 600 }}>{titulo}</h5>
        <p className="text-muted">Esta sección está en desarrollo...</p>
    </div>
);

const AppRoutes = () => {
    const { usuario, cargando } = useAuth();

    if (cargando) return null;

    return (
        <Routes>
            <Route path="/login" element={
                usuario ? (
                    <Navigate to={
                        usuario.nom_rol === 'Administrador ICA' ? '/admin' :
                        usuario.nom_rol === 'Productor' ? '/productor' : '/asistente'
                    } replace />
                ) : <Login />
            } />

            {/* === ADMIN === */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['Administrador ICA']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
                <ProtectedRoute allowedRoles={['Administrador ICA']}>
                    <UsuariosList />
                </ProtectedRoute>
            } />
            <Route path="/admin/usuarios/nuevo" element={
                <ProtectedRoute allowedRoles={['Administrador ICA']}>
                    <UsuarioForm />
                </ProtectedRoute>
            } />
            <Route path="/admin/usuarios/editar/:id" element={
                <ProtectedRoute allowedRoles={['Administrador ICA']}>
                    <UsuarioForm />
                </ProtectedRoute>
            } />
            <Route path="/admin/especies" element={
                <ProtectedRoute allowedRoles={['Administrador ICA']}>
                    <EspeciesVegetales />
                </ProtectedRoute>
            } />
            <Route path="/admin/variedades" element={
                <ProtectedRoute allowedRoles={['Administrador ICA']}>
                    <VariedadesEspecie />
                </ProtectedRoute>
            } />
            <Route path="/admin/plagas" element={
                <ProtectedRoute allowedRoles={['Administrador ICA']}>
                    <Plagas />
                </ProtectedRoute>
            } />
            {/* Admin - Lugares */}
            <Route path="/admin/lugares" element={
                <ProtectedRoute allowedRoles={['Administrador ICA']}>
                    <LugaresProduccion />
                </ProtectedRoute>
            } />
            {/* Productor - Mis Lugares */}
            <Route path="/productor/lugares" element={
                <ProtectedRoute allowedRoles={['Productor']}>
                    <MisLugares />
                </ProtectedRoute>
            } />
            {/* Productor - Lotes*/}
            <Route path="/productor/lotes" element={
                <ProtectedRoute allowedRoles={['Productor']}>
                    <MisLotes />
                </ProtectedRoute>
            } />

            {/* Admin - Lotes*/}
            <Route path="/admin/lotes" element={
                <ProtectedRoute allowedRoles={['Administrador ICA']}>
                    <MisLotes />
                </ProtectedRoute>
            } />
            <Route path="/admin/predios" element={
                <ProtectedRoute allowedRoles={['Administrador ICA']}>
                    <Predios />
                </ProtectedRoute>
            } />
            <Route path="/admin/solicitudes" element={
                <ProtectedRoute allowedRoles={['Administrador ICA']}>
                    <SolicitudesAdmin />
                </ProtectedRoute>
            } />
            <Route path="/admin/inspecciones" element={
                <ProtectedRoute allowedRoles={['Administrador ICA']}>
                    <InspeccionesAdmin />
                </ProtectedRoute>
            } />
            <Route path="/admin/reportes" element={
                <ProtectedRoute allowedRoles={['Administrador ICA']}>
                    <Placeholder titulo="Reportes" />
                </ProtectedRoute>
            } />

            {/* === PRODUCTOR === */}
            <Route path="/productor" element={
                <ProtectedRoute allowedRoles={['Productor']}>
                    <ProductorDashboard />
                </ProtectedRoute>
            } />
            <Route path="/productor/proyecciones" element={
                <ProtectedRoute allowedRoles={['Productor']}>
                    <Proyeccion />
                </ProtectedRoute>
            } />
            <Route path="/productor/inspecciones" element={
                <ProtectedRoute allowedRoles={['Productor']}>
                    <MisSolicitudes />
                </ProtectedRoute>
            } />
            <Route path="/productor/reportes" element={
                <ProtectedRoute allowedRoles={['Productor']}>
                    <MisReportesProductor />
                </ProtectedRoute>
            } />
            <Route path="/productor/perfil" element={
                <ProtectedRoute allowedRoles={['Productor']}>
                    <Placeholder titulo="Mi Perfil" />
                </ProtectedRoute>
            } />

            {/* === ASISTENTE === */}
            <Route path="/asistente/inspeccion/:idSolicitud" element={
                <ProtectedRoute allowedRoles={['Asistente Técnico']}>
                    <RegistroInspeccion />
                </ProtectedRoute>
            } />
            <Route path="/asistente" element={
                <ProtectedRoute allowedRoles={['Asistente Técnico']}>
                    <AsistenteDashboard />
                </ProtectedRoute>
            } />
            <Route path="/asistente/calendario" element={
                <ProtectedRoute allowedRoles={['Asistente Técnico']}>
                    <Placeholder titulo="Calendario" />
                </ProtectedRoute>
            } />
            <Route path="/asistente/reportes" element={
                <ProtectedRoute allowedRoles={['Asistente Técnico']}>
                    <MisReportesAsistente />
                </ProtectedRoute>
            } />
            <Route path="/asistente/perfil" element={
                <ProtectedRoute allowedRoles={['Asistente Técnico']}>
                    <Placeholder titulo="Mi Perfil" />
                </ProtectedRoute>
            } />

            {/* Redirección por defecto */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;