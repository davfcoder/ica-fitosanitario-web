const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectMongo = require('./config/mongoDatabase');
require('./config/mysqlDatabase'); // Inicializa pool MySQL

const solicitudRoutes = require('./routes/solicitudInspeccionRoutes');
const inspeccionRoutes = require('./routes/inspeccionRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/inspecciones', inspeccionRoutes);
app.use('/api/notificaciones', notificacionRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', service: 'MS Inspecciones Fitosanitarias', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada en MS Inspección' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3002;

// Conectar MongoDB y luego levantar servidor
connectMongo().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 MS Inspección corriendo en puerto ${PORT}`);
    });
});

module.exports = app;