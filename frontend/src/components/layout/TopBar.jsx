import { useAuth } from '../../context/AuthContext';
import { roleConfig } from '../../utils/roleConfig';
import { FiMenu } from 'react-icons/fi';

const TopBar = ({ onToggleSidebar }) => {
    const { usuario, getInitials, getRolColor } = useAuth();

    if (!usuario) return null;

    const config = roleConfig[usuario.nom_rol];
    const colorVar = `var(--color-${getRolColor()})`;

    return (
        <div className="top-bar">
            <div className="d-flex align-items-center gap-3">
                <button
                    className="btn btn-link text-dark p-0 sidebar-toggle"
                    onClick={onToggleSidebar}
                    title="Abrir/cerrar menú"
                >
                    <FiMenu size={24} />
                </button>
                <div>
                    <h5 className="mb-0" style={{ fontWeight: 600 }}>{config?.panelTitle}</h5>
                    <small className="text-muted d-none d-md-block">Sistema de Inspecciones Fitosanitarias</small>
                </div>
            </div>
            <div className="d-flex align-items-center gap-3">
                <div className="text-end d-none d-md-block">
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {usuario.nombres} {usuario.apellidos}
                    </div>
                    <small className="text-muted">{usuario.nom_rol}</small>
                </div>
                <div
                    style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: colorVar, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.9rem'
                    }}
                >
                    {getInitials()}
                </div>
            </div>
        </div>
    );
};

export default TopBar;