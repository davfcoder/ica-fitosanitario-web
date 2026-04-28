const pool = require('../config/database');

class PlagaRepository {

    async findAll() {
        const [rows] = await pool.execute(
            `SELECT * FROM Plaga ORDER BY id_plaga ASC`
        );
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT * FROM Plaga WHERE id_plaga = ?`, [id]
        );
        return rows[0] || null;
    }

    async findByNomEspecie(nomEspecie) {
        const [rows] = await pool.execute(
            `SELECT * FROM Plaga WHERE nom_especie = ?`, [nomEspecie]
        );
        return rows[0] || null;
    }

    async save(plaga) {
        const [result] = await pool.execute(
            `INSERT INTO Plaga (nom_especie, nombre_comun) VALUES (?, ?)`,
            [plaga.nom_especie, plaga.nombre_comun]
        );
        return { id_plaga: result.insertId, ...plaga };
    }

    async update(id, plaga) {
        const [result] = await pool.execute(
            `UPDATE Plaga SET nom_especie = ?, nombre_comun = ? WHERE id_plaga = ?`,
            [plaga.nom_especie, plaga.nombre_comun, id]
        );
        return result.affectedRows > 0;
    }

    async delete(id) {
        const [result] = await pool.execute(
            `DELETE FROM Plaga WHERE id_plaga = ?`, [id]
        );
        return result.affectedRows > 0;
    }

    // Verificar si tiene asociación con especies
    async estaEnUsoEspeciePlaga(id) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as total FROM EspeciePlaga WHERE id_plaga = ?`, [id]
        );
        return rows[0].total > 0;
    }

    // Obtener plagas asociadas a una especie vegetal
    async findByEspecie(idEspecie) {
        const [rows] = await pool.execute(
            `SELECT p.* FROM Plaga p 
             INNER JOIN EspeciePlaga ep ON p.id_plaga = ep.id_plaga 
             WHERE ep.id_especie = ?`, [idEspecie]
        );
        return rows;
    }

    // Asociar plaga con especie vegetal
    async asociarEspecie(idEspecie, idPlaga) {
        const [result] = await pool.execute(
            `INSERT IGNORE INTO EspeciePlaga (id_especie, id_plaga) VALUES (?, ?)`,
            [idEspecie, idPlaga]
        );
        return result.affectedRows > 0;
    }

    // Desasociar plaga de especie vegetal
    async desasociarEspecie(idEspecie, idPlaga) {
        const [result] = await pool.execute(
            `DELETE FROM EspeciePlaga WHERE id_especie = ? AND id_plaga = ?`,
            [idEspecie, idPlaga]
        );
        return result.affectedRows > 0;
    }
}

module.exports = new PlagaRepository();