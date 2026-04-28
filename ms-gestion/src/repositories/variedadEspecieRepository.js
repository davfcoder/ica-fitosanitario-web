const pool = require('../config/database');

class VariedadEspecieRepository {

    async findAll() {
        const [rows] = await pool.execute(
            `SELECT v.*, e.nom_especie, e.nom_comun, e.ciclo_cultivo 
             FROM VariedadEspecie v 
             INNER JOIN EspecieVegetal e ON v.id_especie = e.id_especie 
             ORDER BY v.id_variedad ASC`
        );
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT v.*, e.nom_especie, e.nom_comun, e.ciclo_cultivo 
             FROM VariedadEspecie v 
             INNER JOIN EspecieVegetal e ON v.id_especie = e.id_especie 
             WHERE v.id_variedad = ?`, [id]
        );
        return rows[0] || null;
    }

    async findByIdEspecie(idEspecie) {
        const [rows] = await pool.execute(
            `SELECT v.*, e.nom_especie, e.nom_comun 
             FROM VariedadEspecie v 
             INNER JOIN EspecieVegetal e ON v.id_especie = e.id_especie 
             WHERE v.id_especie = ?`, [idEspecie]
        );
        return rows;
    }

    async findByNombreYEspecie(nomVariedad, idEspecie) {
        const [rows] = await pool.execute(
            `SELECT * FROM VariedadEspecie WHERE nom_variedad = ? AND id_especie = ?`,
            [nomVariedad, idEspecie]
        );
        return rows[0] || null;
    }

    async save(variedad) {
        const [result] = await pool.execute(
            `INSERT INTO VariedadEspecie (nom_variedad, id_especie) VALUES (?, ?)`,
            [variedad.nom_variedad, variedad.id_especie]
        );
        return { id_variedad: result.insertId, ...variedad };
    }

    async update(id, variedad) {
        const [result] = await pool.execute(
            `UPDATE VariedadEspecie SET nom_variedad = ?, id_especie = ? WHERE id_variedad = ?`,
            [variedad.nom_variedad, variedad.id_especie, id]
        );
        return result.affectedRows > 0;
    }

    async delete(id) {
        const [result] = await pool.execute(
            `DELETE FROM VariedadEspecie WHERE id_variedad = ?`, [id]
        );
        return result.affectedRows > 0;
    }

    // Verificar si está en uso en Lotes
    async estaEnUsoLote(id) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as total FROM Lote WHERE id_variedad = ?`, [id]
        );
        return rows[0].total > 0;
    }
}

module.exports = new VariedadEspecieRepository();