import { useState, useEffect } from 'react';
import { API_GESTION } from '../../api/axiosConfig';
import {
    FiSearch, FiFilter, FiCheck, FiXCircle, FiCornerUpLeft,
    FiAlertCircle, FiMapPin, FiEye, FiX
} from 'react-icons/fi';

const LugaresProduccion = () => {
    const [lugares, setLugares] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // Modal de detalle
    const [modalDetalle, setModalDetalle] = useState(null);
    const [prediosLugar, setPrediosLugar] = useState([]);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    // Modal de acción (aprobar/rechazar/devolver)
    const [modalAccion, setModalAccion] = useState(null); // { lugar, accion }
    const [formAccion, setFormAccion] = useState({ nro_registro_ica: '', observaciones: '' });
    const [ejecutando, setEjecutando] = useState(false);
    const [errorAccion, setErrorAccion] = useState('');

    useEffect(() => {
        cargarLugares();
    }, []);

    const cargarLugares = async () => {
        try {
            setCargando(true);
            const response = await API_GESTION.get('/lugares-produccion');
            setLugares(response.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar lugares');
        } finally {
            setCargando(false);
        }
    };

    // Ver detalle con predios
    const verDetalle = async (lugar) => {
        try {
            setCargandoDetalle(true);
            const response = await API_GESTION.get(`/lugares-produccion/${lugar.id_lugar_produccion}`);
            setModalDetalle(response.data.data);
            setPrediosLugar(response.data.data.predios || []);
        } catch (err) {
            alert('Error al cargar detalle');
        } finally {
            setCargandoDetalle(false);
        }
    };

    // Abrir modal de acción
    const abrirModalAccion = (lugar, accion) => {
        setModalAccion({ lugar, accion });
        setFormAccion({ nro_registro_ica: '', observaciones: '' });
        setErrorAccion('');
    };

    // Ejecutar acción (aprobar/rechazar/devolver)
    const ejecutarAccion = async () => {
        try {
            setEjecutando(true);
            setErrorAccion('');

            const { lugar, accion } = modalAccion;
            let endpoint = '';
            let body = {};

            switch (accion) {
                case 'aprobar':
                    if (!formAccion.nro_registro_ica) {
                        setErrorAccion('El número de registro ICA es obligatorio para aprobar');
                        setEjecutando(false);
                        return;
                    }
                    endpoint = `/lugares-produccion/${lugar.id_lugar_produccion}/aprobar`;
                    body = {
                        nro_registro_ica: formAccion.nro_registro_ica,
                        observaciones: formAccion.observaciones
                    };
                    break;
                case 'rechazar':
                    if (!formAccion.observaciones) {
                        setErrorAccion('Debe indicar el motivo del rechazo');
                        setEjecutando(false);
                        return;
                    }
                    endpoint = `/lugares-produccion/${lugar.id_lugar_produccion}/rechazar`;
                    body = { observaciones: formAccion.observaciones };
                    break;
                case 'devolver':
                    if (!formAccion.observaciones) {
                        setErrorAccion('Debe indicar las observaciones para corrección');
                        setEjecutando(false);
                        return;
                    }
                    endpoint = `/lugares-produccion/${lugar.id_lugar_produccion}/devolver`;
                    body = { observaciones: formAccion.observaciones };
                    break;
                default:
                    return;
            }

            await API_GESTION.patch(endpoint, body);

            const mensajes = {
                aprobar: 'Lugar de producción aprobado exitosamente',
                rechazar: 'Solicitud rechazada',
                devolver: 'Solicitud devuelta para correcciones'
            };

            setExito(mensajes[accion]);
            setModalAccion(null);
            cargarLugares();
            setTimeout(() => setExito(''), 4000);
        } catch (err) {
            setErrorAccion(err.response?.data?.error || 'Error al procesar la acción');
        } finally {
            setEjecutando(false);
        }
    };

    const getEstadoBadge = (estado) => {
        const estilos = {
            'pendiente': 'bg-warning text-dark',
            'aprobado': 'bg-success',
            'rechazado': 'bg-danger',
            'devuelto': 'bg-info text-dark'
        };
        return <span className={`badge ${estilos[estado] || 'bg-secondary'}`}>{estado}</span>;
    };

    const getAccionConfig = (accion) => {
        const config = {
            aprobar: {
                titulo: 'Aprobar Lugar de Producción',
                btnClass: 'btn-success',
                btnTexto: 'Aprobar',
                descripcion: 'Asigne un número de registro ICA para aprobar esta solicitud.'
            },
            rechazar: {
                titulo: 'Rechazar Solicitud',
                btnClass: 'btn-danger',
                btnTexto: 'Rechazar',
                descripcion: 'Indique el motivo por el cual se rechaza la solicitud.'
            },
            devolver: {
                titulo: 'Devolver para Correcciones',
                btnClass: 'btn-info',
                btnTexto: 'Devolver',
                descripcion: 'Indique las observaciones para que el productor corrija la solicitud.'
            }
        };
        return config[accion] || {};
    };

    const lugaresFiltrados = lugares.filter(l => {
        const coincideBusqueda =
            l.nom_lugar_produccion?.toLowerCase().includes(busqueda.toLowerCase()) ||
            l.nro_registro_ica?.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEstado = !filtroEstado || l.estado === filtroEstado;
        return coincideBusqueda && coincideEstado;
    });

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
            <div className="mb-4">
                <h4 style={{ fontWeight: 700 }}>
                    <FiMapPin className="me-2" /> Lugares de Producción
                </h4>
                <p className="text-muted mb-0">Gestión y aprobación de lugares de producción</p>
            </div>

            {exito && <div className="alert alert-success py-2">{exito}</div>}
            {error && <div className="alert alert-danger py-2">{error}</div>}

            {/* Filtros */}
            <div className="content-card mb-4">
                <div className="row g-3">
                    <div className="col-md-8">
                        <div className="input-group">
                            <span className="input-group-text"><FiSearch /></span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar por nombre o registro ICA..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="input-group">
                            <span className="input-group-text"><FiFilter /></span>
                            <select
                                className="form-select"
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                            >
                                <option value="">Todos los estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="aprobado">Aprobado</option>
                                <option value="rechazado">Rechazado</option>
                                <option value="devuelto">Devuelto</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="content-card">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Registro ICA</th>
                                <th>Estado</th>
                                <th>Fecha Solicitud</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lugaresFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-4">
                                        No se encontraron lugares de producción
                                    </td>
                                </tr>
                            ) : (
                                lugaresFiltrados.map(lugar => (
                                    <tr key={lugar.id_lugar_produccion}>
                                        <td><strong>{lugar.id_lugar_produccion}</strong></td>
                                        <td>{lugar.nom_lugar_produccion}</td>
                                        <td>
                                            {lugar.nro_registro_ica && lugar.nro_registro_ica !== '' ? (
                                                <span className="badge bg-light text-dark border">
                                                    {lugar.nro_registro_ica}
                                                </span>
                                            ) : (
                                                <span className="text-muted small">Sin asignar</span>
                                            )}
                                        </td>
                                        <td>{getEstadoBadge(lugar.estado)}</td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {lugar.fec_solicitud
                                                ? new Date(lugar.fec_solicitud).toLocaleDateString('es-CO')
                                                : '-'}
                                        </td>
                                        <td className="text-center">
                                            <div className="d-flex justify-content-center gap-1 flex-wrap">
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => verDetalle(lugar)}
                                                    title="Ver detalle"
                                                >
                                                    <FiEye />
                                                </button>

                                                {(lugar.estado === 'pendiente' || lugar.estado === 'devuelto') && (
                                                    <button
                                                        className="btn btn-sm btn-outline-success"
                                                        onClick={() => abrirModalAccion(lugar, 'aprobar')}
                                                        title="Aprobar"
                                                    >
                                                        <FiCheck />
                                                    </button>
                                                )}

                                                {lugar.estado === 'pendiente' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => abrirModalAccion(lugar, 'rechazar')}
                                                            title="Rechazar"
                                                        >
                                                            <FiXCircle />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-info"
                                                            onClick={() => abrirModalAccion(lugar, 'devolver')}
                                                            title="Devolver"
                                                        >
                                                            <FiCornerUpLeft />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-3 text-muted small">
                    Mostrando {lugaresFiltrados.length} de {lugares.length} lugares
                </div>
            </div>

            {/* Modal Detalle */}
            {modalDetalle && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Detalle: {modalDetalle.nom_lugar_produccion}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setModalDetalle(null)} />
                            </div>
                            <div className="modal-body">
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <strong>Estado:</strong> {getEstadoBadge(modalDetalle.estado)}
                                    </div>
                                    <div className="col-md-6">
                                        <strong>Registro ICA:</strong>{' '}
                                        {modalDetalle.nro_registro_ica || 'Sin asignar'}
                                    </div>
                                    <div className="col-md-6">
                                        <strong>Fecha solicitud:</strong>{' '}
                                        {modalDetalle.fec_solicitud
                                            ? new Date(modalDetalle.fec_solicitud).toLocaleDateString('es-CO')
                                            : '-'}
                                    </div>
                                    <div className="col-md-6">
                                        <strong>Fecha aprobación:</strong>{' '}
                                        {modalDetalle.fec_aprobacion
                                            ? new Date(modalDetalle.fec_aprobacion).toLocaleDateString('es-CO')
                                            : '-'}
                                    </div>
                                    {modalDetalle.observaciones_admin && (
                                        <div className="col-12">
                                            <strong>Observaciones del administrador:</strong>
                                            <p className="text-muted mb-0 mt-1">{modalDetalle.observaciones_admin}</p>
                                        </div>
                                    )}
                                </div>

                                <h6 className="fw-bold mt-3 mb-2">Predios asociados:</h6>
                                {prediosLugar.length === 0 ? (
                                    <p className="text-muted">No hay predios asociados</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Nro. Predial</th>
                                                    <th>Nombre</th>
                                                    <th>Municipio</th>
                                                    <th>Área (ha)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {prediosLugar.map(p => (
                                                    <tr key={p.id_predio}>
                                                        <td>{p.num_predial}</td>
                                                        <td>{p.nom_predio}</td>
                                                        <td>{p.municipio}, {p.departamento}</td>
                                                        <td>{p.area_total}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="fw-bold">
                                                    <td colSpan="3" className="text-end">Área total:</td>
                                                    <td>
                                                        {prediosLugar.reduce((sum, p) => sum + p.area_total, 0).toFixed(2)} ha
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setModalDetalle(null)}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Acción (Aprobar/Rechazar/Devolver) */}
            {modalAccion && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {getAccionConfig(modalAccion.accion).titulo}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModalAccion(null)}
                                />
                            </div>
                            <div className="modal-body">
                                {errorAccion && (
                                    <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                                        <FiAlertCircle />
                                        <span>{errorAccion}</span>
                                    </div>
                                )}

                                <p className="text-muted mb-3">
                                    {getAccionConfig(modalAccion.accion).descripcion}
                                </p>

                                <p className="fw-bold mb-3">
                                    Lugar: {modalAccion.lugar.nom_lugar_produccion}
                                </p>

                                {/* Campo registro ICA solo para aprobar */}
                                {modalAccion.accion === 'aprobar' && (
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Número de Registro ICA *
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formAccion.nro_registro_ica}
                                            onChange={(e) => setFormAccion(prev => ({
                                                ...prev,
                                                nro_registro_ica: e.target.value
                                            }))}
                                            placeholder="Ej: ICA-2024-001234"
                                        />
                                    </div>
                                )}

                                {/* Observaciones */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Observaciones {modalAccion.accion !== 'aprobar' ? '*' : '(opcional)'}
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={formAccion.observaciones}
                                        onChange={(e) => setFormAccion(prev => ({
                                            ...prev,
                                            observaciones: e.target.value
                                        }))}
                                        placeholder={
                                            modalAccion.accion === 'aprobar'
                                                ? 'Observaciones opcionales...'
                                                : 'Escriba el motivo o las correcciones requeridas...'
                                        }
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setModalAccion(null)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className={`btn ${getAccionConfig(modalAccion.accion).btnClass} text-white`}
                                    onClick={ejecutarAccion}
                                    disabled={ejecutando}
                                >
                                    {ejecutando
                                        ? 'Procesando...'
                                        : getAccionConfig(modalAccion.accion).btnTexto}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LugaresProduccion;