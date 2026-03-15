 /* const http = require('http');
const url = require('url');
const cors = require('cors');
const { testConnection } = require('./config/database');
const { verifyToken } = require('./middleware/auth');

// Importar controladores de rutas
const authController = require('./routes/auth');
const productosController = require('./routes/productos');
const categoriasController = require('./routes/categorias');
const proveedoresController = require('./routes/proveedores');
const clientesController= require('./routes/clientes');
const ventasController = require('./routes/ventas');

//Si existe una variable de entorno PORT, la usa; si no, por defecto será 3000.
const PORT = process.env.PORT || 3000;

// Función helper para parsear el body de las peticiones
const parseBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();  //le llega la informacion y lo va concatenando 
        });
        req.on('end', () => { // se han recibido los datos
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
    });
};

// Función helper para enviar respuestas JSON
const sendJSON = (res, statusCode, data) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',// Le dice al cliente que el cuerpo de la respuesta es un JSON. Sin él, el cliente podría no saber cómo interpretar los datos.
        'Access-Control-Allow-Origin': '*', //Este es un encabezado CORS (Cross-Origin Resource Sharing). El * significa que cualquier origen (cualquier dominio o puerto) puede acceder a los recursos de tu API. 
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',//Otro encabezado CORS. Indica qué métodos HTTP están permitidos cuando se accede a este recurso desde un origen diferente. Aquí se permiten los métodos comunes de CRUD y OPTIONS.
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'//Un tercer encabezado CORS. Especifica qué encabezados de solicitud pueden ser utilizados por el cliente al realizar solicitudes de origen cruzado. Content-Type es necesario para enviar JSON, y Authorization es crucial para enviar el token JWT en las solicitudes protegidas.
    });
    res.end(JSON.stringify(data));//Termina la respuesta HTTP y envía el data proporcionado al cliente.
};
*/
// Middleware de CORS para OPTIONS

/*  Esta solicitud OPTIONS se llama "pre-vuelo" (preflight). El navegador la usa para preguntarle al servidor: 
"¿Estás dispuesto a aceptar una solicitud real desde mi origen con estos métodos y encabezados?"*/
/*
const handleCORS = (res) => {//Si la respuesta del pre-vuelo es satisfactoria, entonces el navegador enviará la solicitud "real". Si no lo es, el navegador bloqueará la solicitud real y lanzará un error CORS en la consola del desarrollador.
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
};

// Crear el servidor
const server = http.createServer(async (req, res) => {

    //Extrae la información esencial de la solicitud para poder decidir cómo enrutarla.
    const parsedUrl = url.parse(req.url, true);//Usa el módulo url para desglosar la URL de la solicitud (req.url) en sus componentes. El true al final le dice que también debe parsear los parámetros de consulta (query parameters) en un objeto.
    const method = req.method;// Obtiene el método HTTP de la solicitud (ej. GET, POST, PUT, DELETE, OPTIONS).
    const pathname = parsedUrl.pathname;//Obtiene la ruta de la URL, sin los parámetros de consulta (ej. /api/productos o /api/categorias/1).

    // Manejar CORS
    if (method === 'OPTIONS') {
        return handleCORS(res); //Si el método HTTP de la solicitud es OPTIONS, llama a la función handleCORS (que explicamos antes) y luego return para terminar el procesamiento de esta solicitud.
    }

    try {
        // Parsear el body para métodos POST, PUT
        if (method === 'POST' || method === 'PUT') {
            req.body = await parseBody(req);//llama a parseBody(req) para leer y convertir el cuerpo en un objeto JavaScript, y lo asigna a req.body.
        }

        // Parsear query parameters
        req.query = parsedUrl.query;//Asigna los parámetros de consulta de la URL (ej. ?nombre=ejemplo) al objeto req.query, haciéndolos fácilmente accesibles en los controladores.
        
        // Extraer parámetros de la URL
        const pathParts = pathname.split('/').filter(part => part); //divide en cada ruta el / y elimina el  cadena vacio si esta con /
        
        // ===== RUTAS DE AUTENTICACIÓN (sin protección) =====

        /* Estas son las únicas rutas de tu API que no requieren un token de autenticación para ser accedidas. Son 
        la puerta de entrada para que los usuarios inicien sesión o se registren y obtengan un token. */
        /*
        if (pathname === '/api/auth/login' && method === 'POST') {
            return await authController.login(req, res);
        }
        
        if (pathname === '/api/auth/register' && method === 'POST') {
            return await authController.register(req, res);
        }

        // Wrapper para convertir verifyToken en Promise
        const verifyTokenPromise = (req, res) => {
        return new Promise((resolve, reject) => {
        verifyToken(req, res, (error) => {
            if (error) reject(error);
            else resolve();
           });
        });
    };

        // ===== MIDDLEWARE DE AUTENTICACIÓN PARA RUTAS PROTEGIDAS =====
        //verifica si la ruta es api, excepto los dos pasa a verificar el tokem
        if (pathname.startsWith('/api/') && pathname !== '/api/auth/login' && pathname !== '/api/auth/register') {
            // Verificar token para todas las rutas API excepto login y register
            try {
                req.headers = req.headers || {};// Asegura que req.headers existe
                await verifyTokenPromise(req, res);
            } catch (error) {
                return sendJSON(res, 401, {
                    success: false,
                    message: 'Token inválido o expirado'
                });
            }
        }

        // ===== RUTAS PROTEGIDAS =====
        
        // Verificar sesión
        if (pathname === '/api/auth/verify' && method === 'GET') {
            return await authController.verifySession(req, res);
        }

        // ===== RUTAS DE PRODUCTOS =====
        if (pathname === '/api/productos' && method === 'GET') {
            return await productosController.getProductos(req, res);
        }
        
        if (pathname === '/api/productos' && method === 'POST') {
            return await productosController.createProducto(req, res);
        }
        
        if (pathname.match(/^\/api\/productos\/\d+$/) && method === 'GET') {
            req.params = { id: pathParts[2] };
            return await productosController.getProductoById(req, res);
        }
        
        if (pathname.match(/^\/api\/productos\/\d+$/) && method === 'PUT') {
            req.params = { id: pathParts[2] };
            return await productosController.updateProducto(req, res);
        }
        
        if (pathname.match(/^\/api\/productos\/\d+$/) && method === 'DELETE') {
            req.params = { id: pathParts[2] };
            return await productosController.deleteProducto(req, res);
        }

        // ===== RUTAS DE CATEGORÍAS =====
        if (pathname === '/api/categorias' && method === 'GET') {
            return await categoriasController.getCategorias(req, res);
        }
        
        if (pathname === '/api/categorias' && method === 'POST') {
            return await categoriasController.createCategoria(req, res);
        }
        
        if (pathname.match(/^\/api\/categorias\/\d+$/) && method === 'GET') {
            req.params = { id: pathParts[2] };
            return await categoriasController.getCategoriaById(req, res);
        }
        
        if (pathname.match(/^\/api\/categorias\/\d+$/) && method === 'PUT') {
            req.params = { id: pathParts[2] };
            return await categoriasController.updateCategoria(req, res);
        }
        
        if (pathname.match(/^\/api\/categorias\/\d+$/) && method === 'DELETE') {
            req.params = { id: pathParts[2] };
            return await categoriasController.deleteCategoria(req, res);
        }

        // ===== RUTAS DE CLIENTES =====
        if (pathname === '/api/clientes' && method === 'GET') {
            return await clientesController.getClientes(req, res);
        }
        
        if (pathname === '/api/clientes' && method === 'POST') {
            return await clientesController.createClientes(req, res);
        }
        
        if (pathname.match(/^\/api\/clientes\/\d+$/) && method === 'GET') {
            req.params = { id: pathParts[2] };
            return await clientesController.getClientesById(req, res);
        }
        
        if (pathname.match(/^\/api\/clientes\/\d+$/) && method === 'PUT') {
            req.params = { id: pathParts[2] };
            return await clientesController.updateCliente(req, res);
        }
        
        if (pathname.match(/^\/api\/clientes\/\d+$/) && method === 'DELETE') {
            req.params = { id: pathParts[2] };
            return await clientesController.deleteClientes(req, res);
        }

        // ===== RUTAS DE VENTAS =====**
    if (pathname === '/api/ventas' && method === 'GET') {
        return await ventasController.getVentas(req, res);
    }
    if (pathname === '/api/ventas' && method === 'POST') {
        return await ventasController.createVenta(req, res);
    }
    if (pathname.match(/^\/api\/ventas\/\d+$/) && method === 'GET') {
        req.params = { id: pathParts[2] };
        return await ventasController.getVentaById(req, res);
    }

        // ===== RUTAS DE PROVEEDORES =====
        if (pathname === '/api/proveedores' && method === 'GET') {
            return await proveedoresController.getProveedores(req, res);
        }
        
        if (pathname === '/api/proveedores' && method === 'POST') {
            return await proveedoresController.createProveedor(req, res);
        }
        
        if (pathname.match(/^\/api\/proveedores\/\d+$/) && method === 'GET') {
            req.params = { id: pathParts[2] };
            return await proveedoresController.getProveedorById(req, res);
        }
        
        if (pathname.match(/^\/api\/proveedores\/\d+$/) && method === 'PUT') {
            req.params = { id: pathParts[2] };
            return await proveedoresController.updateProveedor(req, res);
        }
        
        if (pathname.match(/^\/api\/proveedores\/\d+$/) && method === 'DELETE') {
            req.params = { id: pathParts[2] };
            return await proveedoresController.deleteProveedor(req, res);
        }

        // ===== RUTA PARA SERVIR ARCHIVOS ESTÁTICOS (FRONTEND) =====
        if (pathname === '/' || pathname === '/index.html') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Sistema de Gestión de Tienda</title>
                </head>
                <body>
                    <h1>API del Sistema de Gestión de Tienda</h1>
                    <p>El servidor está funcionando correctamente en el puerto ${PORT}</p>
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
                </body>
                </html>
            `);
            return;
        }

        // ===== RUTA NO ENCONTRADA =====
        sendJSON(res, 404, {
            success: false,
            message: 'Ruta no encontrada'
        });

    } catch (error) {
        console.error('Error en el servidor:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error interno del servidor'
        });
    }
});
/*
// Iniciar el servidor
const startServer = async () => {
    try {
        // Probar conexión a la base de datos
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos. Verifica tu configuración.');
            process.exit(1);
        }

        // Iniciar servidor
        server.listen(PORT, () => {
            console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
            console.log(`📊 Base de datos conectada correctamente`);
            console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
        });

    } catch (error) {
        console.error('❌ Error iniciando el servidor:', error);
        process.exit(1);
    }
};

// Manejar cierre graceful del servidor
//Captura señales de cierre (Ctrl+C o apagado).
process.on('SIGTERM', () => {
    console.log('🛑 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

//Cierra el servidor de forma ordenada.
process.on('SIGINT', () => {
    console.log('🛑 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

// Iniciar la aplicación
startServer();*/