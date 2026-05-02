import { useEffect } from 'react';
import useUbicacionDane from '../../hooks/useUbicacionDane';
import { FiMapPin } from 'react-icons/fi';

const SelectorUbicacion = ({ form, onChange, disabled = false }) => {
    const {
        departamentos,
        municipios,
        cargarMunicipios,
        limpiarMunicipios
    } = useUbicacionDane();

    // Cargar municipios cuando cambia el departamento
    useEffect(() => {
        if (form.departamento) {
            cargarMunicipios(form.departamento);
        } else {
            limpiarMunicipios();
        }
    }, [form.departamento]);

    const handleDepartamentoChange = (e) => {
        onChange({
            departamento: e.target.value,
            municipio: '',
            vereda: ''
        });
    };

    const handleMunicipioChange = (e) => {
        onChange({
            municipio: e.target.value,
            vereda: ''
        });
    };

    const handleVeredaChange = (e) => {
        onChange({ vereda: e.target.value });
    };

    return (
        <div>
            <h6 className="fw-semibold text-muted mb-2">
                <FiMapPin className="me-1" /> Ubicación Geográfica
            </h6>

            <div className="row g-3">
                {/* DEPARTAMENTO */}
                <div className="col-md-6">
                    <label className="form-label fw-semibold">Departamento *</label>
                    <select
                        className="form-select"
                        value={form.departamento || ''}
                        onChange={handleDepartamentoChange}
                        required
                        disabled={disabled}
                    >
                        <option value="">Seleccione departamento...</option>
                        {departamentos.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                {/* MUNICIPIO */}
                <div className="col-md-6">
                    <label className="form-label fw-semibold">Municipio *</label>
                    <select
                        className="form-select"
                        value={form.municipio || ''}
                        onChange={handleMunicipioChange}
                        required
                        disabled={disabled || !form.departamento}
                    >
                        <option value="">
                            {!form.departamento
                                ? 'Primero seleccione departamento'
                                : 'Seleccione municipio...'}
                        </option>
                        {municipios.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                {/* VEREDA - texto libre */}
                <div className="col-12">
                    <label className="form-label fw-semibold">Vereda *</label>
                    <input
                        type="text"
                        className="form-control"
                        value={form.vereda || ''}
                        onChange={handleVeredaChange}
                        required
                        disabled={disabled || !form.municipio}
                        placeholder="Escriba el nombre de la vereda"
                    />
                    <small className="text-muted">
                        Ingrese el nombre de la vereda manualmente.
                    </small>
                </div>
            </div>
        </div>
    );
};

export default SelectorUbicacion;