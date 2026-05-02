import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiTrash2, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { useNotificaciones } from '../../hooks/useNotificaciones';

const formatearFecha = (fecha) => {
    const ahora = new Date();
    const f = new Date(fecha);
    const diffMin = Math.floor((ahora - f) / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `Hace ${diffD} d`;
    return f.toLocaleDateString('es-CO');
};

const CampanaNotificaciones = () => {
    const navigate = useNavigate();
    const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas, eliminarUna, eliminarTodas } = useNotificaciones();
    const [abierto, setAbierto] = useState(false);
    const [expandidaId, setExpandidaId] = useState(null);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClickNotif = async (n) => {
        setExpandidaId(expandidaId === n._id ? null : n._id);
        if (!n.leida) await marcarLeida(n._id);
    };

    const irA = (n, e) => {
        e.stopPropagation();
        if (n.ruta_destino) {
            setAbierto(false);
            navigate(n.ruta_destino);
        }
    };

    return (
        <div className="campana-wrapper" ref={ref} style={{ position: 'relative' }}>
            <button
                className={`btn btn-link p-2 position-relative ${noLeidas > 0 ? 'campana-vibrando' : ''}`}
                onClick={() => setAbierto(!abierto)}
                style={{ color: '#333', textDecoration: 'none' }}
                title="Notificaciones"
            >
                <FiBell size={22} />
                {noLeidas > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ fontSize: '0.65rem' }}>
                        {noLeidas > 99 ? '99+' : noLeidas}
                    </span>
                )}
            </button>

            {abierto && (
                <div className="notif-panel shadow"
                    style={{
                        position: 'absolute', right: 0, top: '110%', width: '380px', maxHeight: '70vh',
                        backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px',
                        zIndex: 1050, display: 'flex', flexDirection: 'column'
                    }}>
                    <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                        <strong>Notificaciones {noLeidas > 0 && `(${noLeidas})`}</strong>
                        <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-link p-1" onClick={marcarTodasLeidas}
                                disabled={noLeidas === 0} title="Marcar todas como leídas">
                                <FiCheckCircle size={16} />
                            </button>
                            <button className="btn btn-sm btn-link p-1 text-danger"
                                onClick={() => { if (window.confirm('¿Limpiar bandeja completa?')) eliminarTodas(); }}
                                disabled={notificaciones.length === 0} title="Limpiar bandeja">
                                <FiTrash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {notificaciones.length === 0 ? (
                            <div className="text-center text-muted p-4">
                                <FiBell size={32} className="opacity-50 mb-2" />
                                <div>No tienes notificaciones</div>
                            </div>
                        ) : (
                            notificaciones.map(n => (
                                <div key={n._id}
                                    onClick={() => handleClickNotif(n)}
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid #f0f0f0',
                                        cursor: 'pointer',
                                        backgroundColor: n.leida ? 'white' : '#f0f8ff'
                                    }}>
                                    <div className="d-flex justify-content-between align-items-start gap-2">
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="d-flex align-items-center gap-2">
                                                {!n.leida && <span style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    backgroundColor: '#0d6efd', flexShrink: 0
                                                }} />}
                                                <strong style={{ fontSize: '0.9rem' }}>{n.titulo}</strong>
                                            </div>
                                            <div className="text-muted small mt-1" style={{
                                                whiteSpace: expandidaId === n._id ? 'normal' : 'nowrap',
                                                overflow: 'hidden', textOverflow: 'ellipsis'
                                            }}>
                                                {n.mensaje}
                                            </div>
                                            {expandidaId === n._id && (
                                                <div className="mt-2 small">
                                                    {n.nom_remitente && n.nom_remitente !== 'Sistema' && (
                                                        <div className="text-muted">De: <strong>{n.nom_remitente}</strong></div>
                                                    )}
                                                    {n.ruta_destino && (
                                                        <button className="btn btn-sm btn-outline-primary mt-2"
                                                            onClick={(e) => irA(n, e)}>
                                                            <FiArrowRight className="me-1" /> Ir a la sección
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            <div className="text-muted small mt-1">{formatearFecha(n.createdAt)}</div>
                                        </div>
                                        <button className="btn btn-sm btn-link text-danger p-0"
                                            onClick={(e) => { e.stopPropagation(); eliminarUna(n._id); }}
                                            title="Eliminar">
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampanaNotificaciones;