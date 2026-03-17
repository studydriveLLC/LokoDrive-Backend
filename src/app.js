const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('sanitize-html'); 
const compression = require('compression');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const logger = require('./config/logger');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middlewares/errorHandler');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const socialRoutes = require('./routes/socialRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// 1. Middlewares globaux de Sécurité
app.use(helmet()); // Protège les headers HTTP (X-Powered-By, XSS Protection, etc.)

// Configuration CORS stricte
app.use(cors({
  origin: env.NODE_ENV === 'production' ? env.CLIENT_URL : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Limitation du nombre de requêtes (Anti-DDOS basique / Bruteforce)
const limiter = rateLimit({
  max: 1000, // 1000 requêtes
  windowMs: 60 * 60 * 1000, // par heure et par IP
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer dans une heure.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 2. Parsers et Compression
app.use(express.json({ limit: '10kb' })); // Refuse les payloads massifs
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // Indispensable pour lire le cookie HttpOnly du Refresh Token
app.use(compression()); // Compresse les réponses HTTP (Gzip) pour la performance

// 3. Middlewares de nettoyage des données (Data Sanitization)
// Contre les injections NoSQL (ex: { "email": { "$gt": "" } })
app.use(mongoSanitize());

// Middleware simple pour nettoyer les entrées contre le XSS (cross-site scripting)
app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
});

// Middleware pour logger chaque requête HTTP en dev
if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });
}

// 4. Routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API opérationnelle' });
});

// 5. Gestion des routes non trouvées (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Impossible de trouver ${req.originalUrl} sur ce serveur!`, 404));
});

// 6. Gestionnaire d'erreurs global (doit toujours être le dernier middleware)
app.use(globalErrorHandler);

module.exports = app;