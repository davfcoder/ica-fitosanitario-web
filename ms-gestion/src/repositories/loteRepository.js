const pool = require('../config/database');

class LoteRepository {

    async findAll() {
        const [rows] = await pool.execute(
            `SELECT l.*, v.nom_variedad, ev.nom_especie, ev.nom_comun, ev.ciclo_cultivo,
                    lp.nom_lugar_produccion
             FROM Lote l
             INNER JOIN VariedadEspecie v ON l.id_variedad = v.id_variedad
             INNER JOIN EspecieVegetal ev ON v.id_especie = ev.id_especie
             INNER JOIN LugarProduccion lp ON l.id_lugar_produccion = lp.id_lugar_produccion
             ORDER BY l.id_lote ASC`
        );
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT l.*, v.nom_variedad, v.id_especie, ev.nom_especie, ev.nom_comun, ev.ciclo_cultivo,
                    lp.nom_lugar_produccion, lp.id_usuario_productor
             FROM Lote l
             INNER JOIN VariedadEspecie v ON l.id_variedad = v.id_variedad
             INNER JOIN EspecieVegetal ev ON v.id_especie = ev.id_especie
             INNER JOIN LugarProduccion lp ON l.id_lugar_produccion = lp.id_lugar_produccion
             WHERE l.id_lote = ?`, [id]
        );
        return rows[0] || null;
    }

    async findByProductor(idProductor) {
        const [rows] = await pool.execute(
            `SELECT l.*, v.nom_variedad, ev.nom_especie, ev.nom_comun, ev.ciclo_cultivo,
                    lp.nom_lugar_produccion
            FROM Lote l
            INNER JOIN VariedadEspecie v ON l.id_variedad = v.id_variedad
            INNER JOIN EspecieVegetal ev ON v.id_especie = ev.id_especie
            INNER JOIN LugarProduccion lp ON l.id_lugar_produccion = lp.id_lugar_produccion
            WHERE lp.id_usuario_productor = ?
            ORDER BY lp.nom_lugar_produccion ASC, l.numero ASC`, [idProductor]
        );
        return rows;
    }

    async findByLugarProduccion(idLugar) {
        const [rows] = await pool.execute(
            `SELECT l.*, v.nom_variedad, ev.nom_especie, ev.nom_comun, ev.ciclo_cultivo
             FROM Lote l
             INNER JOIN VariedadEspecie v ON l.id_variedad = v.id_variedad
             INNER JOIN EspecieVegetal ev ON v.id_especie = ev.id_especie
             WHERE l.id_lugar_produccion = ?
             ORDER BY l.numero ASC`, [idLugar]
        );
        return rows;
    }

    async findLotesActivosByLugar(idLugar) {
        const [rows] = await pool.execute(
            `SELECT l.*, v.nom_variedad, v.id_especie, ev.nom_especie, ev.nom_comun
             FROM Lote l
             INNER JOIN VariedadEspecie v ON l.id_variedad = v.id_variedad
             INNER JOIN EspecieVegetal ev ON v.id_especie = ev.id_especie
             WHERE l.id_lugar_produccion = ? AND l.fec_eliminacion IS NULL
             ORDER BY l.numero ASC`, [idLugar]
        );
        return rows;
    }

    async save(lote) {
        const [result] = await pool.execute(
            `INSERT INTO Lote (numero, area_total, fec_siembra, fec_eliminacion, id_variedad, id_lugar_produccion)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                lote.numero,
                lote.area_total,
                lote.fec_siembra || null,
                lote.fec_eliminacion || null,
                lote.id_variedad,
                lote.id_lugar_produccion
            ]
        );
        return { id_lote: result.insertId, ...lote };
    }

    async update(id, lote) {
        const [result] = await pool.execute(
            `UPDATE Lote SET numero = ?, area_total = ?, fec_siembra = ?, fec_eliminacion = ?,
                    id_variedad = ?, id_lugar_produccion = ?
             WHERE id_lote = ?`,
            [
                lote.numero,
                lote.area_total,
                lote.fec_siembra || null,
                lote.fec_eliminacion || null,
                lote.id_variedad,
                lote.id_lugar_produccion,
                id
            ]
        );
        return result.affectedRows > 0;
    }

    async delete(id) {
        const [result] = await pool.execute(
            `DELETE FROM Lote WHERE id_lote = ?`, [id]
        );
        return result.affectedRows > 0;
    }

    // Sumar área de lotes de un lugar
    async sumarAreaLotes(idLugar) {
        const [rows] = await pool.execute(
            `SELECT COALESCE(SUM(area_total), 0) as area_total_lotes
             FROM Lote WHERE id_lugar_produccion = ? AND fec_eliminacion IS NULL`, [idLugar]
        );
        return rows[0].area_total_lotes;
    }
}

module.exports = new LoteRepository();