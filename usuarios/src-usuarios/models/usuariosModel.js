const mysql = require('mysql2/promise');

// 🔹 Pool de conexión
const connection = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: 'root',
  password: process.env.DB_PASSWORD || 'ana',
  database: process.env.DB_NAME || 'usuarios_db',
  port: 3306
});


// ===============================
// 🔹 TRAER TODOS LOS USUARIOS
// ===============================
async function traerUsuarios() {
  const [result] = await connection.query('SELECT * FROM usuarios');
  return result;
}


// ===============================
// 🔹 TRAER USUARIO POR ID (usuario)
// ===============================
async function traerUsuario(usuario) {
  const [result] = await connection.query(
    'SELECT * FROM usuarios WHERE usuario = ?',
    [usuario]
  );
  return result;
}


// ===============================
// 🔹 VALIDAR LOGIN
// ===============================
async function validarUsuario(usuario, password) {
  const [result] = await connection.query(
    'SELECT * FROM usuarios WHERE usuario = ? AND password = ?',
    [usuario, password]
  );
  return result;
}


// ===============================
// 🔹 CREAR USUARIO (NORMAL)
// ===============================
async function crearUsuario(nombre, apellido, correo, usuario, password, telefono) {
  const [result] = await connection.query(
    `INSERT INTO usuarios 
    (nombre, apellido, correo, usuario, password, telefono, fecha_registro, estado, rol)
    VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'activo', 'usuario')`,
    [nombre, apellido, correo, usuario, password, telefono]
  );
  return result;
}


// ===============================
// 🔹 EDITAR USUARIO
// ===============================
async function editarUsuario(usuario, nombre, apellido, correo, password, telefono, estado, rol) {
  const [result] = await connection.query(
    `UPDATE usuarios 
     SET nombre=?, apellido=?, correo=?, password=?, telefono=?, estado=?, rol=? 
     WHERE usuario=?`,
    [nombre, apellido, correo, password, telefono, estado, rol, usuario]
  );
  return result;
}


// ===============================
// 🔹 ELIMINAR USUARIO
// ===============================
async function eliminarUsuario(usuario) {
  const [result] = await connection.query(
    'DELETE FROM usuarios WHERE usuario=?',
    [usuario]
  );
  return result;
}


// ===============================
// 🔹 EXPORTAR
// ===============================
module.exports = {
  traerUsuarios,
  traerUsuario,
  validarUsuario,
  crearUsuario,
  editarUsuario,
  eliminarUsuario
};