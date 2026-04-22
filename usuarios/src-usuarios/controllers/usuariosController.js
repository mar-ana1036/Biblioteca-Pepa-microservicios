const { Router } = require('express');
const router = Router();
const usuariosModel = require('../models/usuariosModel');

// 1. OBTENER TODOS
router.get('/usuarios', async (req, res) => {
    try {
        const result = await usuariosModel.traerUsuarios();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// 2. OBTENER UNO POR USUARIO
router.get('/usuarios/:usuario', async (req, res) => {
    try {
        const { usuario } = req.params;
        const result = await usuariosModel.traerUsuario(usuario);
        if (!result[0]) return res.status(404).json({ error: "Usuario no encontrado" });
        res.status(200).json(result[0]);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener usuario" });
    }
});

// 3. LOGIN — retorna rol para redirigir en frontend
router.post('/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;
        const result = await usuariosModel.validarUsuario(usuario, password);
        if (!result[0]) return res.status(401).json({ error: "Credenciales incorrectas" });
        res.status(200).json(result[0]);
    } catch (error) {
        res.status(500).json({ error: "Error al validar usuario" });
    }
});

// 4. REGISTRO — crea usuario normal
router.post('/usuarios', async (req, res) => {
    try {
        const { nombre, email, usuario, password } = req.body;
        const existe = await usuariosModel.traerUsuario(usuario);
        if (existe[0]) return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
        await usuariosModel.crearUsuario(nombre, email, usuario, password);
        res.status(201).json({ mensaje: "Usuario creado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al crear usuario" });
    }
});

// 5. EDITAR USUARIO
router.put('/usuarios/:usuario', async (req, res) => {
    try {
        const { usuario } = req.params;
        const { nombre, email, password } = req.body;
        await usuariosModel.editarUsuario(usuario, nombre, email, password);
        res.status(200).json({ mensaje: "Usuario actualizado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
});

// 6. ELIMINAR USUARIO
router.delete('/usuarios/:usuario', async (req, res) => {
    try {
        const { usuario } = req.params;
        await usuariosModel.eliminarUsuario(usuario);
        res.status(200).json({ mensaje: "Usuario eliminado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

module.exports = router;