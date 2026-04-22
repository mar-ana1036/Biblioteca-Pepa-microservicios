# Biblioteca Microservicios

Sistema de gestión de biblioteca basado en microservicios con Node.js, Docker y HAProxy.

## Arquitectura

| Microservicio | Puerto | Descripcion |
|---|---|---|
| usuarios | 3001 | Gestion de usuarios |
| libros | 3002 | Gestion de libros |
| prestamos | 3003 | Gestion de prestamos |

## Tecnologias
- Node.js + Express
- MySQL
- Docker + Docker Compose
- HAProxy (balanceo de carga)

## Levantar el proyecto
docker compose up --build -d

## Escalar replicas
docker compose up --scale usuarios=3 --scale libros=3 --scale prestamos=3 -d

## Panel HAProxy
http://192.168.100.2:8404/stats

## Pruebas de desempeno
ab -n 100 -c 10 http://localhost:3001/usuarios

## Imagenes Docker Hub
- anamarirvera/biblioteca-usuarios
- anamarirvera/biblioteca-libros
- anamarirvera/biblioteca-prestamos
