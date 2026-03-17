FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
# Utilisation de PM2 pour lancer le script dans src
CMD ["npx", "pm2-runtime", "ecosystem.config.js"]