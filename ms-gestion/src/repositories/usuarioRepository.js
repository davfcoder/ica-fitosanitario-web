const pool = require('../config/database');

class UsuarioRepository {

    // Buscar usuario por correo electrónico (para login)
    async findByCorreo(correo) {
        const [rows] = await pool.execute(
            `SELECT u.*, r.nom_rol, r.descripcion as rol_descripcion 
             FROM Usuarios u 
             INNER JOIN Roles r ON u.id_rol = r.id_rol 
             WHERE u.correo_electronico = ?`,
            [correo]
        );
        return rows[0] || null;
    }

    // Buscar usuario por ID
    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT u.id_usuario, u.num_identificacion, u.nombres, u.apellidos, 
                    u.direccion, u.telefono, u.correo_electronico, u.nro_registro_ica, 
                    u.tarjeta_profesional, u.id_rol, r.nom_rol 
             FROM Usuarios u 
             INNER JOIN Roles r ON u.id_rol = r.id_rol 
             WHERE u.id_usuario = ?`,
            [id]
        );
        return rows[0] || null;
    }

    // Listar todos los usuarios
    async findAll() {
        const [rows] = await pool.execute(
            `SELECT u.id_usuario, u.num_identificacion, u.nombres, u.apellidos, 
                    u.direccion, u.telefono, u.correo_electronico, u.nro_registro_ica, 
                    u.tarjeta_profesional, u.id_rol, r.nom_rol 
             FROM Usuarios u 
             INNER JOIN Roles r ON u.id_rol = r.id_rol 
             ORDER BY u.id_usuario ASC`
        );
        return rows;
    }

    // Buscar por número de identificación (para validar duplicados)
    async findByNumIdentificacion(numIdentificacion) {
        const [rows] = await pool.execute(
            `SELECT id_usuario FROM Usuarios WHERE num_identificacion = ?`,
            [numIdentificacion]
        );
        return rows[0] || null;
    }

    // Crear usuario
    async save(usuario) {
        const [result] = await pool.execute(
            `INSERT INTO Usuarios (num_identificacion, nombres, apellidos, direccion, 
                                   telefono, correo_electronico, contrasenia, 
                                   nro_registro_ica, tarjeta_profesional, id_rol) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuario.num_identificacion,
                usuario.nombres,
                usuario.apellidos,
                usuario.direccion,
                usuario.telefono,
                usuario.correo_electronico,
                usuario.contrasenia,
                usuario.nro_registro_ica || null,
                usuario.tarjeta_profesional || null,
                usuario.id_rol
            ]
        );
        return { id_usuario: result.insertId, ...usuario };
    }

    // Actualizar usuario
    async update(id, usuario) {
        const [result] = await pool.execute(
            `UPDATE Usuarios SET num_identificacion = ?, nombres = ?, apellidos = ?, 
                    direccion = ?, telefono = ?, correo_electronico = ?, 
                    nro_registro_ica = ?, tarjeta_profesional = ?, id_rol = ? 
             WHERE id_usuario = ?`,
            [
                usuario.num_identificacion,
                usuario.nombres,
                usuario.apellidos,
                usuario.direccion,
                usuario.telefono,
                usuario.correo_electronico,
                usuario.nro_registro_ica || null,
                usuario.tarjeta_profesional || null,
                usuario.id_rol,
                id
            ]
        );
        return result.affectedRows > 0;
    }

    // Actualizar contraseña
    async updatePassword(id, hashedPassword) {
        const [result] = await pool.execute(
            `UPDATE Usuarios SET contrasenia = ? WHERE id_usuario = ?`,
            [hashedPassword, id]
        );
        return result.affectedRows > 0;
    }

    // Eliminar usuario
    async delete(id) {
        const [result] = await pool.execute(
            `DELETE FROM Usuarios WHERE id_usuario = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    // Listar usuarios por rol
    async findByRol(idRol) {
        const [rows] = await pool.execute(
            `SELECT u.id_usuario, u.num_identificacion, u.nombres, u.apellidos, 
                    u.correo_electronico, u.nro_registro_ica, u.tarjeta_profesional, 
                    u.id_rol, r.nom_rol 
             FROM Usuarios u 
             INNER JOIN Roles r ON u.id_rol = r.id_rol 
             WHERE u.id_rol = ?`,
            [idRol]
        );
        return rows;
    }
}

module.exports = new UsuarioRepository();