const pool = require('../config/mysqlDatabase');

class SolicitudInspeccionRepository {

    // Verificar si un asistente ya tiene solicitud asignada en una fecha
    async findByAsistenteYFecha(idAsistente, fecha) {
        const [rows] = await pool.execute(
            `SELECT id_solicitud FROM SolicitudInspeccion 
            WHERE id_asistente_asignado = ? AND fec_programada = ? 
            AND estado IN ('asignada', 'en_proceso')`,
            [idAsistente, fecha]
        );
        return rows;
    }

    // Cancelar solicitud
    async cancelarSolicitud(idSolicitud, observaciones) {
        const [result] = await pool.execute(
            `UPDATE SolicitudInspeccion SET estado = 'cancelada', observaciones_admin = ?
            WHERE id_solicitud = ?`,
            [observaciones, idSolicitud]
        );
        return result.affectedRows > 0;
    }

    // Marcar como inconclusa
    async marcarInconclusa(idSolicitud, observaciones) {
        const [result] = await pool.execute(
            `UPDATE SolicitudInspeccion SET estado = 'inconclusa', observaciones_asistente = ?
            WHERE id_solicitud = ?`,
            [observaciones, idSolicitud]
        );
        return result.affectedRows > 0;
    }

    async findAll() {
        const [rows] = await pool.execute(
            `SELECT si.*, 
                    lp.nom_lugar_produccion, lp.nro_registro_ica,
                    sol.nombres as solicitante_nombres, sol.apellidos as solicitante_apellidos,
                    asi.nombres as asistente_nombres, asi.apellidos as asistente_apellidos
             FROM SolicitudInspeccion si
             INNER JOIN LugarProduccion lp ON si.id_lugar_produccion = lp.id_lugar_produccion
             INNER JOIN Usuarios sol ON si.id_usuario_solicitante = sol.id_usuario
             LEFT JOIN Usuarios asi ON si.id_asistente_asignado = asi.id_usuario
             ORDER BY si.fec_solicitud DESC`
        );
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT si.*, 
                    lp.nom_lugar_produccion, lp.nro_registro_ica, lp.id_usuario_productor,
                    sol.nombres as solicitante_nombres, sol.apellidos as solicitante_apellidos,
                    asi.nombres as asistente_nombres, asi.apellidos as asistente_apellidos
             FROM SolicitudInspeccion si
             INNER JOIN LugarProduccion lp ON si.id_lugar_produccion = lp.id_lugar_produccion
             INNER JOIN Usuarios sol ON si.id_usuario_solicitante = sol.id_usuario
             LEFT JOIN Usuarios asi ON si.id_asistente_asignado = asi.id_usuario
             WHERE si.id_solicitud = ?`, [id]
        );
        return rows[0] || null;
    }

    async findPendientes() {
        const [rows] = await pool.execute(
            `SELECT si.*, 
                    lp.nom_lugar_produccion,
                    sol.nombres as solicitante_nombres, sol.apellidos as solicitante_apellidos
             FROM SolicitudInspeccion si
             INNER JOIN LugarProduccion lp ON si.id_lugar_produccion = lp.id_lugar_produccion
             INNER JOIN Usuarios sol ON si.id_usuario_solicitante = sol.id_usuario
             WHERE si.estado = 'pendiente'
             ORDER BY si.fec_solicitud ASC`
        );
        return rows;
    }

    async findByAsistente(idAsistente) {
        const [rows] = await pool.execute(
            `SELECT si.*, 
                    lp.nom_lugar_produccion, lp.nro_registro_ica,
                    sol.nombres as solicitante_nombres, sol.apellidos as solicitante_apellidos
             FROM SolicitudInspeccion si
             INNER JOIN LugarProduccion lp ON si.id_lugar_produccion = lp.id_lugar_produccion
             INNER JOIN Usuarios sol ON si.id_usuario_solicitante = sol.id_usuario
             WHERE si.id_asistente_asignado = ?
             ORDER BY si.fec_programada ASC`, [idAsistente]
        );
        return rows;
    }

    async findBySolicitante(idSolicitante) {
        const [rows] = await pool.execute(
            `SELECT si.*, 
                    lp.nom_lugar_produccion,
                    asi.nombres as asistente_nombres, asi.apellidos as asistente_apellidos
             FROM SolicitudInspeccion si
             INNER JOIN LugarProduccion lp ON si.id_lugar_produccion = lp.id_lugar_produccion
             LEFT JOIN Usuarios asi ON si.id_asistente_asignado = asi.id_usuario
             WHERE si.id_usuario_solicitante = ?
             ORDER BY si.fec_solicitud DESC`, [idSolicitante]
        );
        return rows;
    }

    async save(solicitud) {
        const [result] = await pool.execute(
            `INSERT INTO SolicitudInspeccion (id_lugar_produccion, id_usuario_solicitante, motivo, estado, observaciones_productor)
            VALUES (?, ?, ?, 'pendiente', ?)`,
            [solicitud.id_lugar_produccion, solicitud.id_usuario_solicitante, solicitud.motivo, solicitud.observaciones_productor || null]
        );
        return { id_solicitud: result.insertId, ...solicitud };
    }

    async asignarAsistente(idSolicitud, idAsistente, fechaProgramada) {
        const [result] = await pool.execute(
            `UPDATE SolicitudInspeccion SET id_asistente_asignado = ?, fec_programada = ?, estado = 'asignada'
             WHERE id_solicitud = ?`,
            [idAsistente, fechaProgramada, idSolicitud]
        );
        return result.affectedRows > 0;
    }

    async updateEstado(idSolicitud, estado) {
        let query, params;
        if (estado === 'completada') {
            query = `UPDATE SolicitudInspeccion SET estado = ?, fec_completada = NOW() WHERE id_solicitud = ?`;
            params = [estado, idSolicitud];
        } else {
            query = `UPDATE SolicitudInspeccion SET estado = ? WHERE id_solicitud = ?`;
            params = [estado, idSolicitud];
        }
        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    }

    // Contar solicitudes por estado
    async contarPorEstado(estado) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as total FROM SolicitudInspeccion WHERE estado = ?`, [estado]
        );
        return rows[0].total;
    }

    // Verificar lotes activos del lugar
    async verificarLotesActivos(idLugar) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as total FROM Lote WHERE id_lugar_produccion = ? AND fec_eliminacion IS NULL`,
            [idLugar]
        );
        return rows[0].total > 0;
    }
}

module.exports = new SolicitudInspeccionRepository();