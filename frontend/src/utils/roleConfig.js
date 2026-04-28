import {
    FiHome, FiUsers, FiMap, FiLayers, FiGrid, FiClipboard,
    FiFileText, FiSettings, FiMapPin, FiList, FiCalendar,
    FiBarChart2, FiUser, FiCheckSquare
} from 'react-icons/fi';

export const roleConfig = {
    'Administrador ICA': {
        color: 'admin',
        panelTitle: 'Panel de Administrador ICA',
        sidebarClass: 'sidebar-admin',
        btnClass: 'btn-primary-admin',
        menuItems: [
            { path: '/admin', label: 'Dashboard', icon: FiHome },
            {
                label: 'Gestionar Usuarios', icon: FiUsers,
                children: [
                    { path: '/admin/usuarios', label: 'Lista de Usuarios' },
                    { path: '/admin/usuarios/nuevo', label: 'Nuevo Usuario' }
                ]
            },
            {
                label: 'Gestionar Catálogos', icon: FiGrid,
                children: [
                    { path: '/admin/especies', label: 'Especies Vegetales' },
                    { path: '/admin/variedades', label: 'Variedades de Especies' },
                    { path: '/admin/plagas', label: 'Plagas' }
                ]
            },
            {
                label: 'Gestión Territorial', icon: FiMap,
                children: [
                    { path: '/admin/lugares', label: 'Lugares de Producción' },
                    { path: '/admin/lotes', label: 'Lotes' },
                    { path: '/admin/predios', label: 'Predios' }
                ]
            },
            {
                label: 'Gestionar Inspecciones', icon: FiClipboard,
                children: [
                    { path: '/admin/solicitudes', label: 'Solicitudes' },
                    { path: '/admin/inspecciones', label: 'Inspecciones' }
                ]
            },
            { path: '/admin/reportes', label: 'Reportes', icon: FiBarChart2 }
        ]
    },
    'Productor': {
        color: 'productor',
        panelTitle: 'Portal del Productor',
        sidebarClass: 'sidebar-productor',
        btnClass: 'btn-primary-productor',
        menuItems: [
            { path: '/productor', label: 'Inicio', icon: FiHome },
            { path: '/productor/lugares', label: 'Mis Lugares de Producción', icon: FiMapPin },
            { path: '/productor/proyecciones', label: 'Proyección de Producción', icon: FiLayers },
            { path: '/productor/lotes', label: 'Mis Lotes', icon: FiLayers },
            { path: '/productor/inspecciones', label: 'Inspecciones', icon: FiClipboard },
            { path: '/productor/reportes', label: 'Reportes', icon: FiBarChart2 },
            { path: '/productor/perfil', label: 'Mi Perfil', icon: FiUser }
        ]
    },
    'Asistente Técnico': {
        color: 'asistente',
        panelTitle: 'Panel de Asistente Técnico',
        sidebarClass: 'sidebar-asistente',
        btnClass: 'btn-primary-asistente',
        menuItems: [
            { path: '/asistente', label: 'Mis Inspecciones', icon: FiCheckSquare },
            { path: '/asistente/calendario', label: 'Calendario', icon: FiCalendar },
            { path: '/asistente/reportes', label: 'Mis Reportes', icon: FiFileText },
            { path: '/asistente/perfil', label: 'Mi Perfil', icon: FiUser }
        ]
    }
};