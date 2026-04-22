FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src-usuarios/ ./src-usuarios/
EXPOSE 3001
CMD ["node", "src-usuarios/index.js"]
