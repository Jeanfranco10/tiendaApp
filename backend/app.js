const express = require('express');
const cors = require('cors');
const { verifyToken } = require('./middleware/auth');

// Importar routers
const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const categoriasRoutes = require('./routes/categorias');
const proveedoresRoutes = require('./routes/proveedores');
const clientesRoutes = require('./routes/clientes');
const ventasRoutes = require('./routes/ventas');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas públicas (no requieren token)
app.use('/api/auth', authRoutes);

// Middleware de autenticación para rutas protegidas
app.use('/api', verifyToken);

// Rutas protegidas
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ventas', ventasRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send(`
    <h1>API del Sistema de Gestión de Tienda</h1>
    <p>Servidor funcionando correctamente</p>
    <h2>Endpoints disponibles:</h2>
    <ul>
      <li>POST /api/auth/login - Iniciar sesión</li>
      <li>POST /api/auth/register - Registrar usuario</li>
      <li>GET /api/auth/verify - Verificar sesión</li>
      <li>GET /api/productos - Obtener productos</li>
      <li>POST /api/productos - Crear producto</li>
      <li>GET /api/categorias - Obtener categorías</li>
      <li>POST /api/categorias - Crear categoría</li>
      <li>GET /api/clientes - Obtener clientes</li>
      <li>POST /api/clientes - Crear clientes</li>
      <li>GET /api/ventas - Obtener ventas</li>
      <li>POST /api/ventas - Crear ventas</li>
      <li>GET /api/proveedores - Obtener proveedores</li>
      <li>POST /api/proveedores - Crear proveedor</li>
    </ul>
  `);
});

module.exports = app;
