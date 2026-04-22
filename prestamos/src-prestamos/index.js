const express = require('express');
const prestamosController = require('./controllers/prestamosController');
const { marcarVencidos } = require('./models/prestamosModel');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

app.use(morgan('dev'));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});
app.use(prestamosController);

// ============================================================
//  CRON — revisa préstamos vencidos cada 30 segundos
//  Cambia estado 'activo' → 'vencido' y calcula multa
// ============================================================
setInterval(async () => {
    try {
        const result = await marcarVencidos();
        if (result.affectedRows > 0) {
            console.log(`[CRON] ${result.affectedRows} préstamo(s) marcado(s) como vencido(s)`);
        }
    } catch (error) {
        console.error('[CRON] Error al verificar vencidos:', error.message);
    }
}, 30000); // cada 30 segundos

app.listen(3003, () => {
    console.log('Microservicio de prestamos escuchando en el puerto 3003');
    console.log('[CRON] Verificador de vencidos activo cada 30 segundos');
});
