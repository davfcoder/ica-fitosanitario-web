import { useState, useEffect } from 'react';
import { API_GESTION } from '../../api/axiosConfig';
import {
    FiPlus, FiEdit2, FiTrash2, FiSearch, FiSave, FiX,
    FiLayers, FiAlertCircle, FiFilter, FiCalendar
} from 'react-icons/fi';

const MisLotes = () => {
    const [lotes, setLotes] = useState([]);
    const [lugares, setLugares] = useState([]);
    const [variedades, setVariedades] = useState([]);
    const [especies, setEspecies] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroLugar, setFiltroLugar] = useState('');

    // Formulario
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({
        numero: '', area_total: '', fec_siembra: '',
        fec_eliminacion: '', id_variedad: '', id_lugar_produccion: ''
    });
    const [guardando, setGuardando] = useState(false);

    // Variedades filtradas por especie seleccionada
    const [filtroEspecieForm, setFiltroEspecieForm] = useState('');
    const [variedadesFiltradas, setVariedadesFiltradas] = useState([]);

    // Modal eliminar
    const [modalEliminar, setModalEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);
    const [errorEliminar, setErrorEliminar] = useState('');

    // Área disponible
    const [areaInfo, setAreaInfo] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    // Filtrar variedades cuando cambia la especie en el formulario
    useEffect(() => {
        if (filtroEspecieForm) {
            const filtradas = variedades.filter(v => v.id_especie === Number(filtroEspecieForm));
            setVariedadesFiltradas(filtradas);
            // Si la variedad seleccionada no está en las filtradas, limpiar
            if (!filtradas.find(v => v.id_variedad === Number(form.id_variedad))) {
                setForm(prev => ({ ...prev, id_variedad: '' }));
            }
        } else {
            setVariedadesFiltradas(variedades);
        }
    }, [filtroEspecieForm, variedades]);

    // Cargar área disponible cuando cambia el lugar en el formulario
    useEffect(() => {
        if (form.id_lugar_produccion) {
            cargarAreaDisponible(form.id_lugar_produccion);
        } else {
            setAreaInfo(null);
        }
    }, [form.id_lugar_produccion]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [lotesRes, lugaresRes, variedadesRes, especiesRes] = await Promise.all([
                API_GESTION.get('/lotes'),
                API_GESTION.get('/lugares-produccion'),
                API_GESTION.get('/variedades'),
                API_GESTION.get('/especies-vegetales')
            ]);

            setLotes(lotesRes.data.data);
            // Solo lugares aprobados para crear lotes
            setLugares(lugaresRes.data.data.filter(l => l.estado === 'aprobado'));
            setVariedades(variedadesRes.data.data);
            setEspecies(especiesRes.data.data);
            setVariedadesFiltradas(variedadesRes.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar datos');
        } finally {
            setCargando(false);
        }
    };

    const cargarAreaDisponible = async (idLugar) => {
        try {
            const areaRes = await API_GESTION.get(`/lugares-produccion/${idLugar}/area`);
            const lotesLugar = await API_GESTION.get(`/lotes?lugar=${idLugar}`);
            const areaTotal = areaRes.data.data.area_total_hectareas;
            const areaUsada = lotesLugar.data.data.reduce((sum, l) => sum + l.area_total, 0);

            // Si estamos editando, no contar el lote actual
            let descuento = 0;
            if (editando) {
                const loteActual = lotesLugar.data.data.find(l => l.id_lote === editando);
                if (loteActual) descuento = loteActual.area_total;
            }

            setAreaInfo({
                total: areaTotal,
                usada: areaUsada - descuento,
                disponible: areaTotal - (areaUsada - descuento)
            });
        } catch (err) {
            setAreaInfo(null);
        }
    };

    const formVacio = {
        numero: '', area_total: '', fec_siembra: '',
        fec_eliminacion: '', id_variedad: '', id_lugar_produccion: ''
    };

    const abrirFormCrear = () => {
        setForm(formVacio);
        setEditando(null);
        setFiltroEspecieForm('');
        setMostrarForm(true);
        setError('');
        setExito('');
        setAreaInfo(null);
    };

    const abrirFormEditar = (lote) => {
        // Encontrar la especie de la variedad del lote
        const variedad = variedades.find(v => v.id_variedad === lote.id_variedad);
        const idEspecie = variedad ? variedad.id_especie : '';

        setForm({
            numero: lote.numero || '',
            area_total: lote.area_total || '',
            fec_siembra: lote.fec_siembra ? lote.fec_siembra.split('T')[0] : '',
            fec_eliminacion: lote.fec_eliminacion ? lote.fec_eliminacion.split('T')[0] : '',
            id_variedad: lote.id_variedad || '',
            id_lugar_produccion: lote.id_lugar_produccion || ''
        });
        setEditando(lote.id_lote);
        setFiltroEspecieForm(String(idEspecie));
        setMostrarForm(true);
        setError('');
        setExito('');
    };

    const cerrarForm = () => {
        setMostrarForm(false);
        setEditando(null);
        setForm(formVacio);
        setFiltroEspecieForm('');
        setError('');
        setAreaInfo(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');
        setGuardando(true);

        try {
            const datos = {
                ...form,
                area_total: Number(form.area_total),
                id_variedad: Number(form.id_variedad),
                id_lugar_produccion: Number(form.id_lugar_produccion)
            };

            // Limpiar fecha eliminación si está vacía
            if (!datos.fec_eliminacion) datos.fec_eliminacion = null;
            if (!datos.fec_siembra) datos.fec_siembra = null;

            if (editando) {
                await API_GESTION.put(`/lotes/${editando}`, datos);
                setExito('Lote actualizado exitosamente');
            } else {
                await API_GESTION.post('/lotes', datos);
                setExito('Lote registrado exitosamente');
            }
            cerrarForm();
            cargarDatos();
            setTimeout(() => setExito(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar lote');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarLote = async (id) => {
        try {
            setEliminando(true);
            setErrorEliminar('');
            await API_GESTION.delete(`/lotes/${id}`);
            setLotes(prev => prev.filter(l => l.id_lote !== id));
            setModalEliminar(null);
            setExito('Lote eliminado exitosamente');
            setTimeout(() => setExito(''), 3000);
        } catch (err) {
            setErrorEliminar(err.response?.data?.error || 'Error al eliminar lote');
        } finally {
            setEliminando(false);
        }
    };

    const getNombreLugar = (id) => {
        const lugar = lugares.find(l => l.id_lugar_produccion === id);
        return lugar ? lugar.nom_lugar_produccion : `Lugar #${id}`;
    };

    const getNombreVariedad = (id) => {
        const variedad = variedades.find(v => v.id_variedad === id);
        if (!variedad) return `Variedad #${id}`;
        const especie = especies.find(e => e.id_especie === variedad.id_especie);
        return `${variedad.nom_variedad} (${especie?.nom_comun || '?'})`;
    };

    const lotesFiltrados = lotes.filter(l => {
        const coincideBusqueda =
            l.numero?.toLowerCase().includes(busqueda.toLowerCase()) ||
            getNombreVariedad(l.id_variedad).toLowerCase().includes(busqueda.toLowerCase());
        const coincideLugar = !filtroLugar || l.id_lugar_produccion === Number(filtroLugar);
        return coincideBusqueda && coincideLugar;
    });

    if (cargando) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border" style={{ color: 'var(--color-productor)' }} role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h4 style={{ fontWeight: 700 }}>
                        <FiLayers className="me-2" /> Gestión de Lotes
                    </h4>
                    <p className="text-muted mb-0">Administre los lotes de sus lugares de producción</p>
                </div>
                {lugares.length > 0 && (
                    <button className="btn btn-primary-productor text-white" onClick={abrirFormCrear}>
                        <FiPlus className="me-2" /> Nuevo Lote
                    </button>
                )}
            </div>

            {exito && <div className="alert alert-success py-2">{exito}</div>}

            {lugares.length === 0 && (
                <div className="alert alert-info">
                    <FiAlertCircle className="me-2" />
                    No tiene lugares de producción aprobados. Debe tener al menos un lugar aprobado para registrar lotes.
                </div>
            )}

            {/* Formulario */}
            {mostrarForm && (
                <div className="content-card mb-4 border-start border-4" style={{ borderColor: 'var(--color-productor)' }}>
                    <h6 className="fw-bold mb-3">
                        {editando ? 'Editar Lote' : 'Nuevo Lote'}
                    </h6>
                    {error && (
                        <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                            <FiAlertCircle /> <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            {/* Lugar de producción */}
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Lugar de Producción *</label>
                                <select
                                    className="form-select" name="id_lugar_produccion"
                                    value={form.id_lugar_produccion} onChange={handleChange}
                                    required disabled={Boolean(editando)}
                                >
                                    <option value="">Seleccione lugar...</option>
                                    {lugares.map(l => (
                                        <option key={l.id_lugar_produccion} value={l.id_lugar_produccion}>
                                            {l.nom_lugar_produccion}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Número de lote */}
                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Número de Lote *</label>
                                <input
                                    type="text" className="form-control" name="numero"
                                    value={form.numero} onChange={handleChange}
                                    required placeholder="Ej: L-001"
                                />
                            </div>

                            {/* Área */}
                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Área Total (ha) *</label>
                                <input
                                    type="number" step="0.01" className="form-control" name="area_total"
                                    value={form.area_total} onChange={handleChange}
                                    required min="0.01" placeholder="Ej: 5.5"
                                />
                                {areaInfo && (
                                    <small className={`mt-1 d-block ${areaInfo.disponible <= 0 ? 'text-danger' : 'text-success'}`}>
                                        Disponible: {areaInfo.disponible.toFixed(2)} ha de {areaInfo.total.toFixed(2)} ha
                                    </small>
                                )}
                            </div>

                            {/* Especie (filtro para variedad) */}
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Especie Vegetal (filtrar variedad)</label>
                                <select
                                    className="form-select"
                                    value={filtroEspecieForm}
                                    onChange={(e) => setFiltroEspecieForm(e.target.value)}
                                >
                                    <option value="">Todas las especies</option>
                                    {especies.map(e => (
                                        <option key={e.id_especie} value={e.id_especie}>
                                            {e.nom_comun} ({e.nom_especie})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Variedad */}
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Variedad de Especie *</label>
                                <select
                                    className="form-select" name="id_variedad"
                                    value={form.id_variedad} onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccione variedad...</option>
                                    {variedadesFiltradas.map(v => {
                                        const esp = especies.find(e => e.id_especie === v.id_especie);
                                        return (
                                            <option key={v.id_variedad} value={v.id_variedad}>
                                                {v.nom_variedad} — {esp?.nom_comun || '?'}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Fechas */}
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">
                                    <FiCalendar className="me-1" /> Fecha de Siembra
                                </label>
                                <input
                                    type="date" className="form-control" name="fec_siembra"
                                    value={form.fec_siembra} onChange={handleChange}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">
                                    <FiCalendar className="me-1" /> Fecha de Eliminación
                                </label>
                                <input
                                    type="date" className="form-control" name="fec_eliminacion"
                                    value={form.fec_eliminacion} onChange={handleChange}
                                    min={form.fec_siembra || undefined}
                                />
                                <small className="text-muted">Dejar vacío si el lote está activo</small>
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-3 pt-3 border-top">
                            <button type="submit" className="btn btn-primary-productor text-white" disabled={guardando}>
                                <FiSave className="me-2" />
                                {guardando ? 'Guardando...' : (editando ? 'Actualizar Lote' : 'Registrar Lote')}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={cerrarForm}>
                                <FiX className="me-2" /> Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filtros */}
            <div className="content-card mb-4">
                <div className="row g-3">
                    <div className="col-md-6">
                        <div className="input-group">
                            <span className="input-group-text"><FiSearch /></span>
                            <input
                                type="text" className="form-control"
                                placeholder="Buscar por número o variedad..."
                                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="input-group">
                            <span className="input-group-text"><FiFilter /></span>
                            <select
                                className="form-select" value={filtroLugar}
                                onChange={(e) => setFiltroLugar(e.target.value)}
                            >
                                <option value="">Todos los lugares</option>
                                {lugares.map(l => (
                                    <option key={l.id_lugar_produccion} value={l.id_lugar_produccion}>
                                        {l.nom_lugar_produccion}
                                    </option>
                                ))}
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
                                <th>Número</th>
                                <th>Lugar de Producción</th>
                                <th>Variedad / Especie</th>
                                <th>Área (ha)</th>
                                <th>Siembra</th>
                                <th>Estado</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lotesFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center text-muted py-4">
                                        No se encontraron lotes
                                    </td>
                                </tr>
                            ) : (
                                lotesFiltrados.map(lote => (
                                    <tr key={lote.id_lote}>
                                        <td><strong>{lote.numero}</strong></td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {getNombreLugar(lote.id_lugar_produccion)}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {getNombreVariedad(lote.id_variedad)}
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark border">
                                                {lote.area_total} ha
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {lote.fec_siembra
                                                ? new Date(lote.fec_siembra).toLocaleDateString('es-CO')
                                                : '-'}
                                        </td>
                                        <td>
                                            {lote.fec_eliminacion ? (
                                                <span className="badge bg-secondary">Eliminado</span>
                                            ) : (
                                                <span className="badge bg-success">Activo</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-outline-primary me-1"
                                                onClick={() => abrirFormEditar(lote)}
                                                title="Editar"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => { setModalEliminar(lote); setErrorEliminar(''); }}
                                                title="Eliminar"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-3 text-muted small">
                    Mostrando {lotesFiltrados.length} de {lotes.length} lotes
                </div>
            </div>

            {/* Modal eliminar */}
            {modalEliminar && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirmar Eliminación</h5>
                                <button type="button" className="btn-close"
                                    onClick={() => { setModalEliminar(null); setErrorEliminar(''); }} />
                            </div>
                            <div className="modal-body">
                                {errorEliminar && (
                                    <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                                        <FiAlertCircle /> <span>{errorEliminar}</span>
                                    </div>
                                )}
                                <p>¿Está seguro de eliminar el lote:</p>
                                <p className="fw-bold">
                                    {modalEliminar.numero} — {getNombreVariedad(modalEliminar.id_variedad)}
                                </p>
                                <p className="text-muted small">
                                    {getNombreLugar(modalEliminar.id_lugar_produccion)} | {modalEliminar.area_total} ha
                                </p>
                                <div className="alert alert-warning py-2">
                                    <small>Esta acción no se puede deshacer.</small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary"
                                    onClick={() => { setModalEliminar(null); setErrorEliminar(''); }}>
                                    Cancelar
                                </button>
                                <button className="btn btn-danger"
                                    onClick={() => eliminarLote(modalEliminar.id_lote)}
                                    disabled={eliminando}>
                                    {eliminando ? 'Eliminando...' : 'Eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MisLotes;