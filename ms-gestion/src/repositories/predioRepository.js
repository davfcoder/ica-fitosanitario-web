const pool = require('../config/database');

class PredioRepository {

    async findAll() {
        const [rows] = await pool.execute(
            `SELECT p.*, u.nombres as propietario_nombres, u.apellidos as propietario_apellidos,
                    u.num_identificacion as propietario_identificacion
             FROM Predio p
             INNER JOIN Usuarios u ON p.id_propietario = u.id_usuario
             ORDER BY p.id_predio ASC`
        );
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT p.*, u.nombres as propietario_nombres, u.apellidos as propietario_apellidos,
                    u.num_identificacion as propietario_identificacion
             FROM Predio p
             INNER JOIN Usuarios u ON p.id_propietario = u.id_usuario
             WHERE p.id_predio = ?`, [id]
        );
        return rows[0] || null;
    }

    async findByNumPredial(numPredial) {
        const [rows] = await pool.execute(
            `SELECT * FROM Predio WHERE num_predial = ?`, [numPredial]
        );
        return rows[0] || null;
    }

    async findByIdLugar(idLugar) {
        const [rows] = await pool.execute(
            `SELECT p.*, u.nombres as propietario_nombres, u.apellidos as propietario_apellidos
             FROM Predio p
             INNER JOIN Usuarios u ON p.id_propietario = u.id_usuario
             WHERE p.id_lugar_produccion = ?`, [idLugar]
        );
        return rows;
    }

    async findByPropietario(idPropietario) {
        const [rows] = await pool.execute(
            `SELECT p.* FROM Predio p WHERE p.id_propietario = ?`, [idPropietario]
        );
        return rows;
    }

    async findDisponibles() {
        const [rows] = await pool.execute(
            `SELECT p.*, u.nombres as propietario_nombres, u.apellidos as propietario_apellidos
             FROM Predio p
             INNER JOIN Usuarios u ON p.id_propietario = u.id_usuario
             WHERE p.id_lugar_produccion IS NULL
             ORDER BY p.id_predio ASC`
        );
        return rows;
    }

    async save(predio) {
        const [result] = await pool.execute(
            `INSERT INTO Predio (num_predial, nro_registro_ica, nom_predio, direccion, cx, cy, 
                                 area_total, id_propietario, cod_dane_dpto, departamento, 
                                 cod_dane_municipio, municipio, cod_dane_vereda, vereda, id_lugar_produccion) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                predio.num_predial,
                predio.nro_registro_ica || null,
                predio.nom_predio,
                predio.direccion,
                predio.cx,
                predio.cy,
                predio.area_total,
                predio.id_propietario,
                predio.cod_dane_dpto,
                predio.departamento,
                predio.cod_dane_municipio,
                predio.municipio,
                predio.cod_dane_vereda,
                predio.vereda,
                predio.id_lugar_produccion || null
            ]
        );
        return { id_predio: result.insertId, ...predio };
    }

    async update(id, predio) {
        const [result] = await pool.execute(
            `UPDATE Predio SET num_predial = ?, nro_registro_ica = ?, nom_predio = ?, direccion = ?,
                    cx = ?, cy = ?, area_total = ?, id_propietario = ?, cod_dane_dpto = ?, 
                    departamento = ?, cod_dane_municipio = ?, municipio = ?, cod_dane_vereda = ?, 
                    vereda = ?, id_lugar_produccion = ?
             WHERE id_predio = ?`,
            [
                predio.num_predial,
                predio.nro_registro_ica || null,
                predio.nom_predio,
                predio.direccion,
                predio.cx,
                predio.cy,
                predio.area_total,
                predio.id_propietario,
                predio.cod_dane_dpto,
                predio.departamento,
                predio.cod_dane_municipio,
                predio.municipio,
                predio.cod_dane_vereda,
                predio.vereda,
                predio.id_lugar_produccion || null,
                id
            ]
        );
        return result.affectedRows > 0;
    }

    async updateLugarProduccion(idPredio, idLugar) {
        const [result] = await pool.execute(
            `UPDATE Predio SET id_lugar_produccion = ? WHERE id_predio = ?`,
            [idLugar, idPredio]
        );
        return result.affectedRows > 0;
    }

    async delete(id) {
        const [result] = await pool.execute(
            `DELETE FROM Predio WHERE id_predio = ?`, [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = new PredioRepository();