FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src-prestamos/ ./src-prestamos/
EXPOSE 3003
CMD ["node", "src-prestamos/index.js"]
