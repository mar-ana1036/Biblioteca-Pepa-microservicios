-- ============================================================
--  BASE DE DATOS: usuarios_db
-- ============================================================
DROP DATABASE IF EXISTS usuarios_db;
CREATE DATABASE usuarios_db;
USE usuarios_db;

CREATE TABLE usuarios (
    usuario        VARCHAR(50)  NOT NULL,          -- nombre de usuario
    correo         VARCHAR(100) UNIQUE,            -- correo electrónico
    nombre         VARCHAR(100),                   -- nombre real
    apellido       VARCHAR(100),                   -- apellido
    password       VARCHAR(255),                   -- contraseña (encriptada)
    telefono       VARCHAR(20),                    -- teléfono
    fecha_registro DATE,                           -- fecha de registro
    estado         VARCHAR(20),                    -- estado (activo, inactivo, etc.)
    rol            VARCHAR(20),                    -- rol (admin, usuario, etc.)
    PRIMARY KEY (usuario)
);

-- Admin predeterminado
INSERT INTO usuarios (nombre, email, usuario, password, rol) VALUES
('Administrador', 'admin@biblioteca.com', 'admin', 'admin123', 'admin');

-- ============================================================
--  BASE DE DATOS: libros_db
-- ============================================================
DROP DATABASE IF EXISTS libros_db;
CREATE DATABASE libros_db;
USE libros_db;

CREATE TABLE libros (
    codigo              VARCHAR(10)  NOT NULL,   -- código único del libro
    titulo              VARCHAR(255),            -- título del libro
    autor               VARCHAR(255),            -- autor
    genero              VARCHAR(100),            -- género literario
    cantidad_disponible INT,                     -- cantidad de ejemplares disponibles
    PRIMARY KEY (codigo)
);

-- ============================================================
--  BASE DE DATOS: prestamos_db
-- ============================================================
DROP DATABASE IF EXISTS prestamos_db;
CREATE DATABASE prestamos_db;
USE prestamos_db;

CREATE TABLE prestamos (
    id                      INT(11)         NOT NULL AUTO_INCREMENT,

    -- datos del usuario al momento del préstamo
    usuario                 VARCHAR(20)     NOT NULL,
    nombre_usuario          VARCHAR(50),
    email_usuario           VARCHAR(50),

    -- datos del libro al momento del préstamo
    codigo_libro            VARCHAR(20)     NOT NULL,
    titulo_libro            VARCHAR(100),

    -- tipo y fechas
    tipo_prestamo           ENUM('domiciliario', 'sala', 'convenio') NOT NULL,
    fecha_prestamo          DATETIME        DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion        DATETIME        NOT NULL,   -- calculada al crear
    fecha_renovacion        DATETIME        DEFAULT NULL,

    -- estado del préstamo
    estado                  ENUM(
                                'pendiente',   -- usuario solicitó, espera aprobación
                                'activo',      -- admin aprobó, libro entregado
                                'vencido',     -- pasó la fecha, CRON lo marcó
                                'devuelto',    -- admin confirmó devolución física
                                'anulado'      -- rechazado o cancelado por admin
                            ) DEFAULT 'pendiente',

    -- devolución en dos pasos
    solicitud_devolucion    BOOLEAN         DEFAULT FALSE,  -- usuario pidió devolver

    -- multa por vencimiento
    multa_valor             DECIMAL(8,2)    DEFAULT 0.00,
    multa_pagada            BOOLEAN         DEFAULT FALSE,

    PRIMARY KEY (id)
);

-- ============================================================
--  NOTAS PARA EL BACKEND
-- ============================================================
-- fecha_devolucion se calcula al crear el préstamo:
--   domiciliario → NOW() + 60  segundos  (demo) / + 14 días (producción)
--   sala         → NOW() + 90  segundos  (demo) / +  1 día  (producción)
--   convenio     → NOW() + 120 segundos  (demo) / + 30 días (producción)
--
-- CRON cada 30 segundos:
--   UPDATE prestamos
--   SET estado = 'vencido',
--       multa_valor = TIMESTAMPDIFF(SECOND, fecha_devolucion, NOW()) * 200
--   WHERE estado = 'activo'
--     AND fecha_devolucion < NOW();
--
-- Al aprobar  (admin) → estado='activo',  stock -1
-- Al rechazar (admin) → estado='anulado', stock sin cambio
-- Al devolver (admin) → estado='devuelto', stock +1, multa_pagada=TRUE
-- Al anular   (admin) → estado='anulado', stock +1 (si estaba activo/vencido)
-- Al renovar  (admin) → estado='activo',  nueva fecha_devolucion
-- ============================================================
