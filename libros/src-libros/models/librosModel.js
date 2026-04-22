const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',  // ✅ cambia localhost por esto
    user: 'root',
    password: process.env.DB_PASSWORD || 'ana',
    database: process.env.DB_NAME || 'libros_db',
    port: 3306  // ✅ cambia 3307 por 3007
});

async function traerLibros() {
    const result = await connection.query('SELECT * FROM libros');
    return result[0];
}

async function traerLibro(codigo) {
    const result = await connection.query(
        'SELECT * FROM libros WHERE codigo = ?', [codigo]
    );
    return result[0];
}

async function crearLibro(codigo, titulo, autor, genero, cantidad_disponible) {
    const result = await connection.query(
        'INSERT INTO libros (codigo, titulo, autor, genero, cantidad_disponible) VALUES(?,?,?,?,?)',
        [codigo, titulo, autor, genero, cantidad_disponible]
    );
    return result;
}

async function actualizarLibro(codigo, cantidad_disponible) {
    const result = await connection.query(
        'UPDATE libros SET cantidad_disponible=? WHERE codigo=?',
        [cantidad_disponible, codigo]
    );
    return result;
}

async function eliminarLibro(codigo) {
    const result = await connection.query(
        'DELETE FROM libros WHERE codigo = ?', [codigo]
    );
    return result;
}

module.exports = {
    traerLibros,
    traerLibro,
    crearLibro,
    actualizarLibro,
    eliminarLibro
};
