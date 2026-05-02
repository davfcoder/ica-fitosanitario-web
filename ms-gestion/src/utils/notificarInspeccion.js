const axios = require('axios');

const URL_INSPECCION = process.env.MS_INSPECCION_URL || 'http://localhost:3002';
const KEY = process.env.INTERNAL_SERVICE_KEY;

const notificar = async (payload) => {
    try {
        await axios.post(
            `${URL_INSPECCION}/api/notificaciones/internal`,
            payload,
            { headers: { 'x-internal-key': KEY }, timeout: 3000 }
        );
    } catch (err) {
        // No bloquear el flujo principal si la notificación falla
        console.error('[notificar] Error al crear notificación:', err.message);
    }
};

module.exports = notificar;