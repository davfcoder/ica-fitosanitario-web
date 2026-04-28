const pool = require('../config/database');

class LugarEspecieRepository {

    async findByIdLugar(idLugar) {
        const [rows] = await pool.execute(
            `SELECT le.*, ev.nom_especie, ev.nom_comun, ev.ciclo_cultivo
             FROM LugarEspecie le
             INNER JOIN EspecieVegetal ev ON le.id_especie = ev.id_especie
             WHERE le.id_lugar_produccion = ?`, [idLugar]
        );
        return rows;
    }

    async findByLugarYEspecie(idLugar, idEspecie) {
        const [rows] = await pool.execute(
            `SELECT le.*, ev.nom_especie, ev.nom_comun, ev.ciclo_cultivo
             FROM LugarEspecie le
             INNER JOIN EspecieVegetal ev ON le.id_especie = ev.id_especie
             WHERE le.id_lugar_produccion = ? AND le.id_especie = ?`,
            [idLugar, idEspecie]
        );
        return rows[0] || null;
    }

    async save(lugarEspecie) {
        const [result] = await pool.execute(
            `INSERT INTO LugarEspecie (id_lugar_produccion, id_especie, area_dest_cultivo, capacidad_produccion_max)
             VALUES (?, ?, ?, ?)`,
            [
                lugarEspecie.id_lugar_produccion,
                lugarEspecie.id_especie,
                lugarEspecie.area_dest_cultivo,
                lugarEspecie.capacidad_produccion_max
            ]
        );
        return lugarEspecie;
    }

    async update(idLugar, idEspecie, datos) {
        const [result] = await pool.execute(
            `UPDATE LugarEspecie SET area_dest_cultivo = ?, capacidad_produccion_max = ?
             WHERE id_lugar_produccion = ? AND id_especie = ?`,
            [datos.area_dest_cultivo, datos.capacidad_produccion_max, idLugar, idEspecie]
        );
        return result.affectedRows > 0;
    }

    async delete(idLugar, idEspecie) {
        const [result] = await pool.execute(
            `DELETE FROM LugarEspecie WHERE id_lugar_produccion = ? AND id_especie = ?`,
            [idLugar, idEspecie]
        );
        return result.affectedRows > 0;
    }

    // Sumar área destinada de todas las proyecciones de un lugar
    async sumarAreaDestinada(idLugar) {
        const [rows] = await pool.execute(
            `SELECT COALESCE(SUM(area_dest_cultivo), 0) as area_total_destinada
             FROM LugarEspecie WHERE id_lugar_produccion = ?`, [idLugar]
        );
        return rows[0].area_total_destinada;
    }
}

module.exports = new LugarEspecieRepository();