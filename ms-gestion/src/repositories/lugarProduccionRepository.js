const pool = require('../config/database');

class LugarProduccionRepository {

    // Cambiar estado con observaciones del productor
    async updateEstadoProductor(id, estado, observacionesProductor) {
        const [result] = await pool.execute(
            `UPDATE LugarProduccion SET estado = ?, observaciones_productor = ? 
            WHERE id_lugar_produccion = ?`,
            [estado, observacionesProductor || null, id]
        );
        return result.affectedRows > 0;
    }

    // Cambiar estado y observaciones admin SIN tocar nro_registro_ica ni fec_aprobacion
    async updateEstadoSimple(id, estado, observacionesAdmin) {
        const [result] = await pool.execute(
            `UPDATE LugarProduccion SET estado = ?, observaciones_admin = ?, 
            observaciones_productor = NULL
            WHERE id_lugar_produccion = ?`,
            [estado, observacionesAdmin || null, id]
        );
        return result.affectedRows > 0;
    }

    // Verificar lotes activos (sin fecha de eliminación)
    async tieneLotesActivos(id) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as total FROM Lote 
            WHERE id_lugar_produccion = ? AND fec_eliminacion IS NULL`, [id]
        );
        return rows[0].total > 0;
    }

    // Eliminar registros de LugarEspecie al cancelar
    async deleteLugarEspecies(id) {
        const [result] = await pool.execute(
            `DELETE FROM LugarEspecie WHERE id_lugar_produccion = ?`, [id]
        );
        return result.affectedRows;
    }

    async findAll() {
        const [rows] = await pool.execute(
            `SELECT lp.*, u.nombres as productor_nombres, u.apellidos as productor_apellidos
             FROM LugarProduccion lp
             INNER JOIN Usuarios u ON lp.id_usuario_productor = u.id_usuario
             ORDER BY lp.id_lugar_produccion ASC`
        );
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT lp.*, u.nombres as productor_nombres, u.apellidos as productor_apellidos,
                    u.correo_electronico as productor_correo
             FROM LugarProduccion lp
             INNER JOIN Usuarios u ON lp.id_usuario_productor = u.id_usuario
             WHERE lp.id_lugar_produccion = ?`, [id]
        );
        return rows[0] || null;
    }

    async findByProductor(idProductor) {
        const [rows] = await pool.execute(
            `SELECT lp.* FROM LugarProduccion lp 
             WHERE lp.id_usuario_productor = ? 
             ORDER BY lp.fec_solicitud DESC`, [idProductor]
        );
        return rows;
    }

    async findByEstado(estado) {
        const [rows] = await pool.execute(
            `SELECT lp.*, u.nombres as productor_nombres, u.apellidos as productor_apellidos
             FROM LugarProduccion lp
             INNER JOIN Usuarios u ON lp.id_usuario_productor = u.id_usuario
             WHERE lp.estado = ?
             ORDER BY lp.fec_solicitud ASC`, [estado]
        );
        return rows;
    }

    async save(lugar) {
        const [result] = await pool.execute(
            `INSERT INTO LugarProduccion (nom_lugar_produccion, nro_registro_ica, id_usuario_productor, 
                                           estado, observaciones_admin, fec_solicitud) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
                lugar.nom_lugar_produccion,
                lugar.nro_registro_ica || '',
                lugar.id_usuario_productor,
                lugar.estado || 'pendiente',
                lugar.observaciones_admin || null
            ]
        );
        return { id_lugar_produccion: result.insertId, ...lugar };
    }

    async update(id, lugar) {
        const [result] = await pool.execute(
            `UPDATE LugarProduccion SET nom_lugar_produccion = ?, nro_registro_ica = ?, 
                    id_usuario_productor = ?, estado = ?, observaciones_admin = ?
             WHERE id_lugar_produccion = ?`,
            [
                lugar.nom_lugar_produccion,
                lugar.nro_registro_ica,
                lugar.id_usuario_productor,
                lugar.estado,
                lugar.observaciones_admin || null,
                id
            ]
        );
        return result.affectedRows > 0;
    }

    async updateEstado(id, estado, observaciones, nroRegistroIca) {
        let query, params;

        if (estado === 'aprobado') {
            query = `UPDATE LugarProduccion SET estado = ?, observaciones_admin = ?, 
                     nro_registro_ica = ?, fec_aprobacion = NOW() WHERE id_lugar_produccion = ?`;
            params = [estado, observaciones || null, nroRegistroIca, id];
        } else {
            query = `UPDATE LugarProduccion SET estado = ?, observaciones_admin = ? 
                     WHERE id_lugar_produccion = ?`;
            params = [estado, observaciones || null, id];
        }

        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    }

    async delete(id) {
        const [result] = await pool.execute(
            `DELETE FROM LugarProduccion WHERE id_lugar_produccion = ?`, [id]
        );
        return result.affectedRows > 0;
    }

    // Verificar si tiene lotes
    async tieneLotes(id) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as total FROM Lote WHERE id_lugar_produccion = ?`, [id]
        );
        return rows[0].total > 0;
    }

    // Verificar si tiene predios asociados
    async tienePredios(id) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as total FROM Predio WHERE id_lugar_produccion = ?`, [id]
        );
        return rows[0].total > 0;
    }

    // Obtener predios asociados a un lugar
    async getPredios(id) {
        const [rows] = await pool.execute(
            `SELECT p.* FROM Predio p WHERE p.id_lugar_produccion = ?`, [id]
        );
        return rows;
    }

    // Actualizar solo el nombre del lugar
    async updateNombre(id, nombre) {
        const [result] = await pool.execute(
            `UPDATE LugarProduccion SET nom_lugar_produccion = ? WHERE id_lugar_produccion = ?`,
            [nombre, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = new LugarProduccionRepository();