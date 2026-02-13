require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./database/mongoose');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

// Confiar en el proxy (necesario para Render/Rate Limit)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Conectar a MongoDB
connectDB();

// Middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: false, // Desactivar para desarrollo
}));

// CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Límite de 100 requests por ventana
    message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde'
});

app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   🚀 Gala Licores - Servidor Iniciado       ║
╚═══════════════════════════════════════════════╝

✓ Servidor corriendo en: http://localhost:${PORT}
✓ Entorno: ${process.env.NODE_ENV || 'development'}
✓ Base de datos: MongoDB
✓ JWT configurado

Páginas disponibles:
  → Login:      http://localhost:${PORT}/login.html
  → Registro:   http://localhost:${PORT}/register.html
  → Catálogo:   http://localhost:${PORT}/catalog.html

API Endpoints:
  → POST /api/auth/register
  → POST /api/auth/login
  → GET  /api/auth/verify
  → GET  /api/auth/profile
  `);
});
