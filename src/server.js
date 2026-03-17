const http = require('http');
const app = require('./app'); // Car app.js est dans src/ avec server.js
const env = require('./config/env');
const logger = require('./config/logger');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');

process.on('uncaughtException', (err) => {
  logger.fatal('UNCAUGHT EXCEPTION! Arret en cours...');
  logger.fatal(err.name, err.message, err.stack);
  process.exit(1);
});

const server = http.createServer(app);
initSocket(server);

const startServer = async () => {
  await connectDB();

  server.listen(env.PORT, () => {
    logger.info(`Serveur demarre en mode ${env.NODE_ENV} sur le port ${env.PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    logger.fatal('UNHANDLED REJECTION! Arret en cours...');
    logger.fatal(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  process.on('SIGTERM', () => {
    logger.info('Signal SIGTERM recu. Arret gracieux...');
    server.close(() => {
      logger.info('Serveur arrete.');
    });
  });
};

startServer();