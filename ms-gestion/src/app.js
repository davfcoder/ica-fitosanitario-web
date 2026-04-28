const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const predioRoutes = require('./routes/predioRoutes');
const especieVegetalRoutes = require('./routes/especieVegetalRoutes');
const variedadEspecieRoutes = require('./routes/variedadEspecieRoutes');
const plagaRoutes = require('./routes/plagaRoutes');
const lugarProduccionRoutes = require('./routes/lugarProduccionRoutes');
const lugarEspecieRoutes = require('./routes/lugarEspecieRoutes');
const loteRoutes = require('./routes/loteRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Registro de rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/predios', predioRoutes);
app.use('/api/especies-vegetales', especieVegetalRoutes);
app.use('/api/variedades', variedadEspecieRoutes);
app.use('/api/plagas', plagaRoutes);
app.use('/api/lugares-produccion', lugarProduccionRoutes);
app.use('/api/lugar-especie', lugarEspecieRoutes);
app.use('/api/lotes', loteRoutes);

// Ruta de salud del microservicio
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', service: 'MS Gestión Agrícola', timestamp: new Date().toISOString() });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada en MS Gestión' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 MS Gestión corriendo en puerto ${PORT}`);
});

module.exports = app;