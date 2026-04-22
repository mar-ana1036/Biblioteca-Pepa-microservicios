const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD || 'ana',
    database: process.env.DB_NAME || 'prestamos_db',
    port: 3306
});

// ============================================================
//  CONSULTAS
// ============================================================

async function obtenerPrestamos() {
    const [rows] = await connection.query('SELECT * FROM prestamos ORDER BY id DESC');
    return rows;
}

async function obtenerPrestamosPorId(id) {
    const [rows] = await connection.query(
        'SELECT * FROM prestamos WHERE id = ?',
        [id]
    );
    return rows[0];
}

async function obtenerPrestamosPorUsuario(usuario) {
    const [rows] = await connection.query(
        'SELECT * FROM prestamos WHERE usuario = ? ORDER BY id DESC',
        [usuario]
    );
    return rows;
}

// Obtener préstamos por estado (pendiente, activo, vencido, devuelto, anulado)
async function obtenerPrestamosPorEstado(estado) {
    const [rows] = await connection.query(
        'SELECT * FROM prestamos WHERE estado = ? ORDER BY id DESC',
        [estado]
    );
    return rows;
}

// Obtener préstamos donde el usuario solicitó devolución y aún no se confirma
async function obtenerSolicitudesDevolucion() {
    const [rows] = await connection.query(
        `SELECT * FROM prestamos 
         WHERE solicitud_devolucion = TRUE 
           AND estado IN ('activo', 'vencido')
         ORDER BY id DESC`
    );
    return rows;
}

// ============================================================
//  CREAR
// ============================================================

// Crea préstamo en estado PENDIENTE (usuario solicita, admin aprueba)
async function crearPrestamo(usuario, nombre_usuario, email_usuario, codigo_libro, titulo_libro, tipo_prestamo, fecha_prestamo, fecha_devolucion) {
    const [result] = await connection.query(
        `INSERT INTO prestamos 
        (usuario, nombre_usuario, email_usuario, codigo_libro, titulo_libro, tipo_prestamo, fecha_prestamo, fecha_devolucion, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
        [usuario, nombre_usuario, email_usuario, codigo_libro, titulo_libro, tipo_prestamo, fecha_prestamo, fecha_devolucion]
    );
    return result;
}

// ============================================================
//  ACCIONES DE ESTADO
// ============================================================

// Cambiar estado genérico (aprobar → activo, rechazar → anulado, anular → anulado)
async function cambiarEstado(id, estado) {
    const [result] = await connection.query(
        'UPDATE prestamos SET estado = ? WHERE id = ?',
        [estado, id]
    );
    return result;
}

// Confirmar devolución: estado → devuelto, multa_pagada → true
async function confirmarDevolucion(id) {
    const [result] = await connection.query(
        `UPDATE prestamos 
         SET estado = 'devuelto', 
             multa_pagada = TRUE,
             solicitud_devolucion = FALSE
         WHERE id = ?`,
        [id]
    );
    return result;
}

// Renovar: estado → activo, nueva fecha_devolucion, guarda fecha_renovacion
async function renovarPrestamo(id, nueva_fecha_devolucion) {
    const [result] = await connection.query(
        `UPDATE prestamos 
         SET estado = 'activo',
             fecha_devolucion = ?,
             fecha_renovacion = NOW()
         WHERE id = ?`,
        [nueva_fecha_devolucion, id]
    );
    return result;
}

// Usuario solicita devolución
async function solicitarDevolucion(id) {
    const [result] = await connection.query(
        'UPDATE prestamos SET solicitud_devolucion = TRUE WHERE id = ?',
        [id]
    );
    return result;
}

// ============================================================
//  CRON — marcar vencidos y calcular multa
//  Se llama desde index.js cada 30 segundos
// ============================================================
async function marcarVencidos() {
    const [result] = await connection.query(
        `UPDATE prestamos
         SET estado = 'vencido',
             multa_valor = TIMESTAMPDIFF(SECOND, fecha_devolucion, NOW()) * 200
         WHERE estado = 'activo'
           AND fecha_devolucion < NOW()`
    );
    return result;
}

// ============================================================
//  EDITAR Y ELIMINAR
// ============================================================

async function editarPrestamos(id, usuario, nombre_usuario, email_usuario, codigo_libro, titulo_libro, tipo_prestamo, fecha_prestamo, fecha_devolucion, estado) {
    const [result] = await connection.query(
        `UPDATE prestamos SET 
            usuario = ?, nombre_usuario = ?, email_usuario = ?,
            codigo_libro = ?, titulo_libro = ?, tipo_prestamo = ?,
            fecha_prestamo = ?, fecha_devolucion = ?, estado = ?
         WHERE id = ?`,
        [usuario, nombre_usuario, email_usuario, codigo_libro, titulo_libro, tipo_prestamo, fecha_prestamo, fecha_devolucion, estado, id]
    );
    return result;
}

async function eliminarPrestamos(id) {
    const [result] = await connection.query(
        'DELETE FROM prestamos WHERE id = ?',
        [id]
    );
    return result;
}

// ============================================================
//  EXPORTS
// ============================================================
module.exports = {
    obtenerPrestamos,
    obtenerPrestamosPorId,
    obtenerPrestamosPorUsuario,
    obtenerPrestamosPorEstado,
    obtenerSolicitudesDevolucion,
    crearPrestamo,
    cambiarEstado,
    confirmarDevolucion,
    renovarPrestamo,
    solicitarDevolucion,
    marcarVencidos,
    editarPrestamos,
    eliminarPrestamos
};
