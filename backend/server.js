require('dotenv').config();   

const http = require('http');
const { testConnection } = require('./config/database');
const app = require('./app');

const PORT = process.env.PORT || 3000;

// 1. 🛑 CAPTURA DE ERRORES GLOBALES (Ponlo aquí arriba para que atrape todo)
process.on('uncaughtException', (err) => {
    console.error('❌ CRÍTICO: Error no capturado:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ CRÍTICO: Promesa rechazada no manejada:', reason);
});

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos.');
      process.exit(1);
    }

    // 2. 🚀 INICIAR SERVIDOR ESCUCHANDO EN 0.0.0.0
    http.createServer(app).listen(PORT, '0.0.0.0', () => { // 👈 Agregamos '0.0.0.0'
      console.log(`🚀 Servidor iniciado en el puerto: ${PORT}`);
      console.log(`📊 Base de datos conectada correctamente`);
      console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre ordenado
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

startServer();