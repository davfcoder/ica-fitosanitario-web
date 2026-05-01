const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ========== 1. SEGURIDAD (Estado del Arte) ==========
// Helmet oculta tecnologías y protege contra ataques comunes (XSS, Clickjacking)
app.use(helmet());

// CORS restrictivo
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // En producción, pon la URL exacta de tu React
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting para prevenir DDoS o Fuerza Bruta en los microservicios
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
    max: 150, // Límite de 150 peticiones por IP
    message: { error: 'Demasiadas peticiones desde esta IP. Intente más tarde.' },
    standardHeaders: true, // Retorna info del límite en cabeceras `RateLimit-*`
    legacyHeaders: false, // Deshabilita cabeceras antiguas `X-RateLimit-*`
});
app.use(limiter);

// ========== 2. LOGGING ==========
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Gateway | ${req.method} ${req.originalUrl}`);
    next();
});

// ========== 3. HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'API Gateway - Sistema ICA',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ========== 4. CONFIGURACIÓN BASE PARA PROXIES ==========
const commonProxyOptions = {
    changeOrigin: true,
    timeout: 15000, // Si el microservicio no responde en 15s, corta la petición
    proxyTimeout: 15000,
    on: {
        proxyReq: (proxyReq, req, res) => {
            // Asegura que el body pase correctamente a los microservicios en POST/PUT
            if (req.body && Object.keys(req.body).length > 0) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        error: (err, req, res) => {
            console.error(`[Proxy Error] Falla hacia ${req.originalUrl}:`, err.message);
            if (!res.headersSent) {
                res.status(503).json({ error: 'Servicio temporalmente no disponible (503)' });
            }
        }
    }
};

// ========== 5. RUTAS DE ENRUTAMIENTO ==========
app.use('/api/gestion', createProxyMiddleware({
    ...commonProxyOptions,
    target: process.env.MS_GESTION_URL || 'http://127.0.0.1:3001',
    pathRewrite: (path) => '/api' + path
}));

app.use('/api/inspeccion', createProxyMiddleware({
    ...commonProxyOptions,
    target: process.env.MS_INSPECCION_URL || 'http://127.0.0.1:3002',
    pathRewrite: (path) => '/api' + path
}));

// ========== 6. FALLBACK 404 ==========
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada en el API Gateway' });
});

// ========== 7. INICIALIZACIÓN Y GRACEFUL SHUTDOWN ==========
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Gateway Seguro ejecutándose en puerto ${PORT}`);
});

// Manejo estricto de cierre para evitar EADDRINUSE
const gracefulShutdown = (signal) => {
    console.log(`\n[Gateway] Señal ${signal} recibida. Deteniendo tráfico...`);
    
    server.close((err) => {
        if (err) {
            console.error('[Gateway] Error durante el cierre:', err);
            process.exit(1);
        }
        console.log('[Gateway] Puerto liberado. Adiós.');
        process.exit(0);
    });

    // Función exclusiva de Node moderno: Corta de tajo cualquier conexión colgada
    if (server.closeAllConnections) {
        server.closeAllConnections();
    }

    // Seguro de vida: Si en 10 segundos no ha cerrado, mátalo
    setTimeout(() => {
        console.error('[Gateway] Forzando cierre tras timeout...');
        process.exit(1);
    }, 10000).unref(); // .unref() evita que este timer mantenga vivo a Node
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = app;