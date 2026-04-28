const pool = require('../config/database');

class EspecieVegetalRepository {

    async findAll() {
        const [rows] = await pool.execute(
            `SELECT * FROM EspecieVegetal ORDER BY id_especie ASC`
        );
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT * FROM EspecieVegetal WHERE id_especie = ?`, [id]
        );
        return rows[0] || null;
    }

    async findByNomEspecie(nomEspecie) {
        const [rows] = await pool.execute(
            `SELECT * FROM EspecieVegetal WHERE nom_especie = ?`, [nomEspecie]
        );
        return rows[0] || null;
    }

    async save(especie) {
        const [result] = await pool.execute(
            `INSERT INTO EspecieVegetal (nom_especie, nom_comun, ciclo_cultivo) VALUES (?, ?, ?)`,
            [especie.nom_especie, especie.nom_comun, especie.ciclo_cultivo]
        );
        return { id_especie: result.insertId, ...especie };
    }

    async update(id, especie) {
        const [result] = await pool.execute(
            `UPDATE EspecieVegetal SET nom_especie = ?, nom_comun = ?, ciclo_cultivo = ? WHERE id_especie = ?`,
            [especie.nom_especie, especie.nom_comun, especie.ciclo_cultivo, id]
        );
        return result.affectedRows > 0;
    }

    async delete(id) {
        const [result] = await pool.execute(
            `DELETE FROM EspecieVegetal WHERE id_especie = ?`, [id]
        );
        return result.affectedRows > 0;
    }

    // Verificar si tiene variedades asociadas
    async tieneVariedades(id) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as total FROM VariedadEspecie WHERE id_especie = ?`, [id]
        );
        return rows[0].total > 0;
    }

    // Verificar si está en uso en LugarEspecie
    async estaEnUsoLugarEspecie(id) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as total FROM LugarEspecie WHERE id_especie = ?`, [id]
        );
        return rows[0].total > 0;
    }
}

module.exports = new EspecieVegetalRepository();