/**
 * Middleware de autorización por rol.
 * Recibe un arreglo de roles permitidos y verifica que el usuario autenticado
 * tenga uno de esos roles.
 * 
 * Uso: verificarRol(['Administrador ICA', 'Productor'])
 */
const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        if (!rolesPermitidos.includes(req.usuario.nom_rol)) {
            return res.status(403).json({ 
                error: 'No tiene permisos para acceder a este recurso',
                rol_actual: req.usuario.nom_rol,
                roles_requeridos: rolesPermitidos
            });
        }

        next();
    };
};

module.exports = verificarRol;