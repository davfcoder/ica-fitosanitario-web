const authService = require('../services/authService');

class AuthController {

    async postLogin(req, res) {
        try {
            const { correo_electronico, contrasenia } = req.body;
            const resultado = await authService.autenticarUsuario(correo_electronico, contrasenia);

            res.status(200).json({
                message: 'Inicio de sesión exitoso',
                data: resultado
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({ error: error.message || 'Error en el servidor' });
        }
    }

    async getPerfil(req, res) {
        try {
            const usuario = await authService.obtenerPerfil(req.usuario.id_usuario);

            res.status(200).json({
                message: 'Perfil obtenido exitosamente',
                data: usuario
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({ error: error.message || 'Error en el servidor' });
        }
    }
}

module.exports = new AuthController();