FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src-libros/ ./src-libros/
EXPOSE 3002
CMD ["node", "src-libros/index.js"]
