const express = require('express');
const router = express.Router();
const axios = require('axios');
const prestamosModel = require('../models/prestamosModel');

const TIEMPOS_DEMO = {
    domiciliario: 180,
    sala: 210,
    convenio: 240
};

router.get('/prestamos', async (req, res) => {
    try {
        const result = await prestamosModel.obtenerPrestamos();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener prestamos" });
    }
});

router.get('/prestamos/pendientes', async (req, res) => {
    try {
        const result = await prestamosModel.obtenerPrestamosPorEstado('pendiente');
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener pendientes" });
    }
});

router.get('/prestamos/vencidos', async (req, res) => {
    try {
        const result = await prestamosModel.obtenerPrestamosPorEstado('vencido');
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener vencidos" });
    }
});

router.get('/prestamos/solicitudes-devolucion', async (req, res) => {
    try {
        const result = await prestamosModel.obtenerSolicitudesDevolucion();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener solicitudes" });
    }
});

router.get('/prestamos/usuario/:usuario', async (req, res) => {
    try {
        const { usuario } = req.params;
        const result = await prestamosModel.obtenerPrestamosPorUsuario(usuario);
        if (result.length === 0) return res.status(404).json({ error: "El usuario no tiene préstamos" });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener prestamos del usuario" });
    }
});

router.get('/prestamos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await prestamosModel.obtenerPrestamosPorId(id);
        if (!result) return res.status(404).json({ error: "Prestamo no encontrado" });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener prestamo" });
    }
});

router.post('/prestamos', async (req, res) => {
    try {
        const { usuario, codigo_libro, tipo_prestamo } = req.body;
        const tipo = tipo_prestamo?.toLowerCase();
        if (!TIEMPOS_DEMO[tipo]) {
            return res.status(400).json({ error: 'Tipo inválido. Use: domiciliario, sala o convenio' });
        }
        const responseUsuario = await axios.get(`http://localhost:3001/usuarios/${usuario}`);
        const { nombre, email } = responseUsuario.data;
        const responseLibro = await axios.get(`http://localhost:3002/libros/${codigo_libro}`);
        const { titulo, cantidad_disponible } = responseLibro.data;
        if (cantidad_disponible <= 0) {
            return res.status(400).json({ error: 'No hay disponibilidad del libro' });
        }
        const ahora = new Date();
        const fecha_devolucion = new Date(ahora.getTime() + TIEMPOS_DEMO[tipo] * 1000);
        await prestamosModel.crearPrestamo(
            usuario, nombre, email,
            codigo_libro, titulo,
            tipo_prestamo, ahora, fecha_devolucion
        );
        res.status(201).json({ mensaje: "Solicitud enviada. Espera aprobación del administrador." });
    } catch (error) {
        console.error("Error al crear prestamo:", error.message);
        res.status(500).json({ error: "Error al crear prestamo. Verifica que los microservicios estén activos." });
    }
});

router.put('/prestamos/:id/aprobar', async (req, res) => {
    try {
        const { id } = req.params;
        const prestamo = await prestamosModel.obtenerPrestamosPorId(id);
        if (!prestamo) return res.status(404).json({ error: "Préstamo no encontrado" });
        if (prestamo.estado !== 'pendiente') return res.status(400).json({ error: `No se puede aprobar un préstamo en estado '${prestamo.estado}'` });
        const responseLibro = await axios.get(`http://localhost:3002/libros/${prestamo.codigo_libro}`);
        const { cantidad_disponible } = responseLibro.data;
        if (cantidad_disponible <= 0) return res.status(400).json({ error: 'Sin stock disponible' });
        await prestamosModel.cambiarEstado(id, 'activo');
        await axios.put(`http://localhost:3002/libros/${prestamo.codigo_libro}`, {
            cantidad_disponible: cantidad_disponible - 1
        });
        res.status(200).json({ mensaje: "Préstamo aprobado. Stock actualizado." });
    } catch (error) {
        res.status(500).json({ error: "Error al aprobar" });
    }
});

router.put('/prestamos/:id/rechazar', async (req, res) => {
    try {
        const { id } = req.params;
        const prestamo = await prestamosModel.obtenerPrestamosPorId(id);
        if (!prestamo) return res.status(404).json({ error: "Préstamo no encontrado" });
        if (prestamo.estado !== 'pendiente') return res.status(400).json({ error: `No se puede rechazar en estado '${prestamo.estado}'` });
        await prestamosModel.cambiarEstado(id, 'anulado');
        res.status(200).json({ mensaje: "Préstamo rechazado." });
    } catch (error) {
        res.status(500).json({ error: "Error al rechazar" });
    }
});

router.put('/prestamos/:id/anular', async (req, res) => {
    try {
        const { id } = req.params;
        const prestamo = await prestamosModel.obtenerPrestamosPorId(id);
        if (!prestamo) return res.status(404).json({ error: "Préstamo no encontrado" });
        if (!['activo', 'vencido'].includes(prestamo.estado)) return res.status(400).json({ error: `No se puede anular en estado '${prestamo.estado}'` });
        const responseLibro = await axios.get(`http://localhost:3002/libros/${prestamo.codigo_libro}`);
        const { cantidad_disponible } = responseLibro.data;
        await prestamosModel.cambiarEstado(id, 'anulado');
        await axios.put(`http://localhost:3002/libros/${prestamo.codigo_libro}`, {
            cantidad_disponible: cantidad_disponible + 1
        });
        res.status(200).json({ mensaje: "Préstamo anulado. Stock restaurado." });
    } catch (error) {
        res.status(500).json({ error: "Error al anular" });
    }
});

router.put('/prestamos/:id/confirmar-devolucion', async (req, res) => {
    try {
        const { id } = req.params;
        const prestamo = await prestamosModel.obtenerPrestamosPorId(id);
        if (!prestamo) return res.status(404).json({ error: "Préstamo no encontrado" });
        if (!['activo', 'vencido'].includes(prestamo.estado)) return res.status(400).json({ error: `No se puede devolver en estado '${prestamo.estado}'` });
        const responseLibro = await axios.get(`http://localhost:3002/libros/${prestamo.codigo_libro}`);
        const { cantidad_disponible } = responseLibro.data;
        await prestamosModel.confirmarDevolucion(id);
        await axios.put(`http://localhost:3002/libros/${prestamo.codigo_libro}`, {
            cantidad_disponible: cantidad_disponible + 1
        });
        res.status(200).json({ mensaje: "Devolución confirmada. Stock restaurado." });
    } catch (error) {
        res.status(500).json({ error: "Error al confirmar devolución" });
    }
});

router.put('/prestamos/:id/renovar', async (req, res) => {
    try {
        const { id } = req.params;
        const prestamo = await prestamosModel.obtenerPrestamosPorId(id);
        if (!prestamo) return res.status(404).json({ error: "Préstamo no encontrado" });
        if (!['activo', 'vencido'].includes(prestamo.estado)) return res.status(400).json({ error: `No se puede renovar en estado '${prestamo.estado}'` });
        const tipo = prestamo.tipo_prestamo.toLowerCase();
        const nueva_fecha = new Date(Date.now() + TIEMPOS_DEMO[tipo] * 1000);
        await prestamosModel.renovarPrestamo(id, nueva_fecha);
        res.status(200).json({ mensaje: "Préstamo renovado." });
    } catch (error) {
        res.status(500).json({ error: "Error al renovar" });
    }
});

router.put('/prestamos/:id/solicitar-devolucion', async (req, res) => {
    try {
        const { id } = req.params;
        const prestamo = await prestamosModel.obtenerPrestamosPorId(id);
        if (!prestamo) return res.status(404).json({ error: "Préstamo no encontrado" });
        if (!['activo', 'vencido'].includes(prestamo.estado)) return res.status(400).json({ error: `No puedes solicitar devolución en estado '${prestamo.estado}'` });
        if (prestamo.solicitud_devolucion) return res.status(400).json({ error: "Ya enviaste una solicitud de devolución." });
        await prestamosModel.solicitarDevolucion(id);
        res.status(200).json({ mensaje: "Solicitud enviada. El administrador la confirmará." });
    } catch (error) {
        res.status(500).json({ error: "Error al solicitar devolución" });
    }
});

router.delete('/prestamos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prestamosModel.eliminarPrestamos(id);
        res.status(200).json({ mensaje: "Prestamo eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

module.exports = router;
