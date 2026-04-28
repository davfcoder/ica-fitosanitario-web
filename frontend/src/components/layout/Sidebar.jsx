import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { roleConfig } from '../../utils/roleConfig';
import { FiLogOut, FiChevronDown, FiChevronRight, FiShield, FiX } from 'react-icons/fi';

const Sidebar = ({ abierto, cerrar }) => {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();
    const [openMenus, setOpenMenus] = useState({});

    if (!usuario) return null;

    const config = roleConfig[usuario.nom_rol];
    if (!config) return null;

    const toggleSubmenu = (label) => {
        setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNavClick = () => {
        // Cerrar sidebar en móvil al hacer clic en un enlace
        if (window.innerWidth <= 992) {
            cerrar();
        }
    };

    return (
        <div className={`sidebar ${config.sidebarClass} ${abierto ? 'show' : ''}`}>
            <div className="sidebar-brand">
                <FiShield size={28} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Sistema ICA</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Inspecciones Fitosanitarias</div>
                </div>
                {/* Botón cerrar solo visible en móvil */}
                <button
                    className="btn btn-link text-white d-lg-none p-0"
                    onClick={cerrar}
                    style={{ lineHeight: 1 }}
                >
                    <FiX size={20} />
                </button>
            </div>

            <ul className="sidebar-nav">
                {config.menuItems.map((item, index) => (
                    item.children ? (
                        <li key={index}>
                            <div className="sidebar-nav-item" onClick={() => toggleSubmenu(item.label)}>
                                <item.icon size={18} />
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {openMenus[item.label] ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                            </div>
                            {openMenus[item.label] && (
                                <ul style={{ listStyle: 'none', paddingLeft: '2.5rem' }}>
                                    {item.children.map((child, childIndex) => (
                                        <li key={childIndex}>
                                            <NavLink
                                                to={child.path}
                                                className={({ isActive }) =>
                                                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                                                }
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                onClick={handleNavClick}
                                            >
                                                {child.label}
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ) : (
                        <li key={index}>
                            <NavLink
                                to={item.path}
                                end={item.path === '/admin' || item.path === '/productor' || item.path === '/asistente'}
                                className={({ isActive }) =>
                                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                                }
                                onClick={handleNavClick}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    )
                ))}
            </ul>

            <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="sidebar-nav-item" onClick={handleLogout}>
                    <FiLogOut size={18} />
                    <span>Cerrar Sesión</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;