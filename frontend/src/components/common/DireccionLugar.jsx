import { FiMapPin } from 'react-icons/fi';

/**
 * Muestra la dirección del lugar de producción (basada en el primer predio asociado).
 * Recibe los campos: direccion_lugar, vereda_lugar, municipio_lugar, departamento_lugar.
 */
const DireccionLugar = ({ solicitud, compact = false }) => {
    if (!solicitud?.direccion_lugar) {
        return (
            <div className="text-muted small">
                <FiMapPin className="me-1" /> Sin dirección registrada
            </div>
        );
    }

    if (compact) {
        return (
            <span className="text-muted small">
                <FiMapPin className="me-1" size={12} />
                {solicitud.direccion_lugar}
                {solicitud.vereda_lugar ? ` — ${solicitud.vereda_lugar}` : ''}
                {solicitud.municipio_lugar ? `, ${solicitud.municipio_lugar}` : ''}
            </span>
        );
    }

    return (
        <div>
            <div>{solicitud.direccion_lugar}</div>
            <small className="text-muted">
                {solicitud.vereda_lugar && `Vereda ${solicitud.vereda_lugar}`}
                {solicitud.vereda_lugar && solicitud.municipio_lugar && ' — '}
                {solicitud.municipio_lugar}
                {solicitud.departamento_lugar && `, ${solicitud.departamento_lugar}`}
            </small>
        </div>
    );
};

export default DireccionLugar;