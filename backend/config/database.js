 require('dotenv').config();

 const mysql = require('mysql2/promise');

 // Configuración de la conexión a MySQL
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true, //Indica que si no hay conexiones disponibles, el programa esperará.
    connectionLimit: 10, //Establece un límite de 10 conexiones simultáneas. Esto es importante para que tu aplicación no sature la base de datos.
    queueLimit: 0//Si las conexiones están ocupadas, no se encolarán más
};

// Crear el pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL exitosa');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error.message);
        return false;
    }
};

// Función helper para ejecutar queries
const executeQuery = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return results;
    } catch (error) {
        console.error('Error ejecutando query:', error);
        throw error;
    }
};

const getConnection = async () => {
    return await pool.getConnection();
};

module.exports = {
    pool,
    testConnection,
    executeQuery,
     getConnection
};