import { useEffect } from 'react';
import useUbicacionDane from '../../hooks/useUbicacionDane';
import { FiMapPin, FiLoader, FiAlertCircle } from 'react-icons/fi';

const SelectorUbicacion = ({ form, onChange, disabled = false }) => {
    const {
        departamentos,
        municipios,
        cargandoDptos,
        cargandoMunicipios,
        errorUbicacion,
        cargarMunicipios,
        limpiarMunicipios
    } = useUbicacionDane();

    // Cargar municipios cuando cambia departamento
    useEffect(() => {
        if (form.cod_dane_dpto) {
            cargarMunicipios(form.cod_dane_dpto);
        } else {
            limpiarMunicipios();
        }
    }, [form.cod_dane_dpto]);

    const handleDepartamentoChange = (e) => {
        const codDpto = e.target.value;
        const dpto = departamentos.find(d => d.cod === codDpto);

        onChange({
            cod_dane_dpto: codDpto,
            departamento: dpto?.nombre || '',
            cod_dane_municipio: '',
            municipio: '',
            cod_dane_vereda: '',
            vereda: ''
        });
    };

    const handleMunicipioChange = (e) => {
        const codMpio = e.target.value;
        const mpio = municipios.find(m => m.cod === codMpio);

        onChange({
            cod_dane_municipio: codMpio,
            municipio: mpio?.nombre || '',
            cod_dane_vereda: '',
            vereda: ''
        });
    };

    const LoadingIcon = () => <FiLoader className="ms-2 spinner-icon" size={14} />;

    return (
        <div>
            <h6 className="fw-semibold text-muted mb-2">
                <FiMapPin className="me-1" /> Ubicación Geográfica
            </h6>

            {errorUbicacion && (
                <div className="alert alert-warning py-2 d-flex align-items-center gap-2 mb-3">
                    <FiAlertCircle />
                    <small>{errorUbicacion}. Puede escribir los datos manualmente.</small>
                </div>
            )}

            <div className="row g-3">
                {/* DEPARTAMENTO */}
                <div className="col-md-6">
                    <label className="form-label fw-semibold">
                        Departamento *
                        {cargandoDptos && <LoadingIcon />}
                    </label>
                    {departamentos.length > 0 ? (
                        <select
                            className="form-select"
                            value={form.cod_dane_dpto || ''}
                            onChange={handleDepartamentoChange}
                            required
                            disabled={disabled || cargandoDptos}
                        >
                            <option value="">Seleccione departamento...</option>
                            {departamentos.map(d => (
                                <option key={d.cod} value={d.cod}>
                                    {d.nombre}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="row g-2">
                            <div className="col-4">
                                <input
                                    type="text" className="form-control"
                                    value={form.cod_dane_dpto || ''}
                                    onChange={(e) => onChange({ cod_dane_dpto: e.target.value })}
                                    placeholder="Código" required disabled={disabled}
                                />
                            </div>
                            <div className="col-8">
                                <input
                                    type="text" className="form-control"
                                    value={form.departamento || ''}
                                    onChange={(e) => onChange({ departamento: e.target.value })}
                                    placeholder="Departamento" required disabled={disabled}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* MUNICIPIO */}
                <div className="col-md-6">
                    <label className="form-label fw-semibold">
                        Municipio *
                        {cargandoMunicipios && <LoadingIcon />}
                    </label>
                    {municipios.length > 0 ? (
                        <select
                            className="form-select"
                            value={form.cod_dane_municipio || ''}
                            onChange={handleMunicipioChange}
                            required
                            disabled={disabled || cargandoMunicipios || !form.cod_dane_dpto}
                        >
                            <option value="">
                                {!form.cod_dane_dpto
                                    ? 'Primero seleccione departamento'
                                    : cargandoMunicipios
                                        ? 'Cargando...'
                                        : 'Seleccione municipio...'}
                            </option>
                            {municipios.map(m => (
                                <option key={m.cod} value={m.cod}>
                                    {m.nombre}
                                </option>
                            ))}
                        </select>
                    ) : form.cod_dane_dpto ? (
                        <div className="row g-2">
                            <div className="col-4">
                                <input
                                    type="text" className="form-control"
                                    value={form.cod_dane_municipio || ''}
                                    onChange={(e) => onChange({ cod_dane_municipio: e.target.value })}
                                    placeholder="Código" required disabled={disabled}
                                />
                            </div>
                            <div className="col-8">
                                <input
                                    type="text" className="form-control"
                                    value={form.municipio || ''}
                                    onChange={(e) => onChange({ municipio: e.target.value })}
                                    placeholder="Municipio" required disabled={disabled}
                                />
                            </div>
                        </div>
                    ) : (
                        <select className="form-select" disabled>
                            <option>Primero seleccione departamento</option>
                        </select>
                    )}
                </div>

                {/* VEREDA - Manual con código y nombre */}
                <div className="col-md-4">
                    <label className="form-label fw-semibold">Código Vereda *</label>
                    <input
                        type="text" className="form-control"
                        name="cod_dane_vereda"
                        value={form.cod_dane_vereda || ''}
                        onChange={(e) => onChange({ cod_dane_vereda: e.target.value })}
                        required disabled={disabled || !form.cod_dane_municipio}
                        placeholder="Ej: 05001001"
                    />
                </div>
                <div className="col-md-8">
                    <label className="form-label fw-semibold">Nombre Vereda *</label>
                    <input
                        type="text" className="form-control"
                        name="vereda"
                        value={form.vereda || ''}
                        onChange={(e) => onChange({ vereda: e.target.value })}
                        required disabled={disabled || !form.cod_dane_municipio}
                        placeholder="Ej: Vereda El Carmen"
                    />
                </div>
            </div>

            <small className="text-muted mt-2 d-block">
                📡 Datos cargados desde api-colombia.com
            </small>
        </div>
    );
};

export default SelectorUbicacion;