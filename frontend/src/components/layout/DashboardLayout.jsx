import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { FiMenu } from 'react-icons/fi';

const DashboardLayout = ({ children }) => {
    const [sidebarAbierto, setSidebarAbierto] = useState(false);

    const toggleSidebar = () => setSidebarAbierto(prev => !prev);
    const cerrarSidebar = () => setSidebarAbierto(false);

    return (
        <div className="dashboard-layout">
            {/* Overlay para móvil/tablet */}
            {sidebarAbierto && (
                <div className="sidebar-overlay" onClick={cerrarSidebar} />
            )}

            <Sidebar abierto={sidebarAbierto} cerrar={cerrarSidebar} />

            <div className={`main-content ${sidebarAbierto ? '' : 'sidebar-collapsed'}`}>
                <TopBar onToggleSidebar={toggleSidebar} />
                <div className="page-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;