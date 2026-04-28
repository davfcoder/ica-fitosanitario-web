const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();

app.use(cors());

// Log de peticiones
app.use((req, res, next) => {
    console.log(`[Gateway] ${req.method} ${req.originalUrl}`);
    next();
});

// Health check del gateway
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'API Gateway - Sistema ICA',
        timestamp: new Date().toISOString(),
        microservicios: {
            ms_gestion: process.env.MS_GESTION_URL,
            ms_inspeccion: process.env.MS_INSPECCION_URL
        }
    });
});

// ========== PROXY → MS GESTIÓN (puerto 3001) ==========
app.use('/api/gestion', createProxyMiddleware({
    target: process.env.MS_GESTION_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
        // Cuando llega aquí, Express ya quitó /api/gestion
        // path = /auth/login  →  necesitamos /api/auth/login
        const newPath = '/api' + path;
        console.log(`[Proxy Gestión] ${path} → ${newPath}`);
        return newPath;
    },
    on: {
        proxyReq: (proxyReq, req, res) => {
            if (req.body && Object.keys(req.body).length > 0) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        proxyRes: (proxyRes, req, res) => {
            console.log(`[Proxy Gestión] Respuesta: ${proxyRes.statusCode}`);
        },
        error: (err, req, res) => {
            console.error('[Proxy Gestión] Error:', err.message);
            res.status(502).json({ error: 'MS Gestión no disponible' });
        }
    }
}));

// ========== PROXY → MS INSPECCIÓN (puerto 3002) ==========
app.use('/api/inspeccion', createProxyMiddleware({
    target: process.env.MS_INSPECCION_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
        // path = /solicitudes  →  necesitamos /api/solicitudes
        const newPath = '/api' + path;
        console.log(`[Proxy Inspección] ${path} → ${newPath}`);
        return newPath;
    },
    on: {
        proxyReq: (proxyReq, req, res) => {
            if (req.body && Object.keys(req.body).length > 0) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        proxyRes: (proxyRes, req, res) => {
            console.log(`[Proxy Inspección] Respuesta: ${proxyRes.statusCode}`);
        },
        error: (err, req, res) => {
            console.error('[Proxy Inspección] Error:', err.message);
            res.status(502).json({ error: 'MS Inspección no disponible' });
        }
    }
}));

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada en el Gateway' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 API Gateway corriendo en puerto ${PORT}`);
    console.log(`   → MS Gestión:    ${process.env.MS_GESTION_URL}`);
    console.log(`   → MS Inspección: ${process.env.MS_INSPECCION_URL}`);
});

module.exports = app;