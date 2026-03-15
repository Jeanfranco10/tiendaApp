 const { executeQuery } = require('../config/database');

// Función helper para enviar respuestas JSON
const sendJSON = (res, statusCode, data) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
};

// Obtener todos los productos con información de categoría y proveedor
const getProductos = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.*,
                c.nombre as categoria_nombre,
                pr.nombre as proveedor_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
            ORDER BY p.fecha_creacion DESC
        `;
        
        const productos = await executeQuery(query);
        
        sendJSON(res, 200, {
            success: true,
            data: productos
        });
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al obtener productos'
        });
    }
};

// Obtener un producto por ID
const getProductoById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                p.*,
                c.nombre as categoria_nombre,
                pr.nombre as proveedor_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
            WHERE p.id = ?
        `;
        
        const productos = await executeQuery(query, [id]);
        
        if (productos.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        sendJSON(res, 200, {
            success: true,
            data: productos[0]
        });
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al obtener producto'
        });
    }
};

// Crear nuevo producto
const createProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, categoria_id, proveedor_id, imagen } = req.body;
        
        // Validaciones básicas
        if (!nombre || !precio) {
            return sendJSON(res, 400, {
                success: false,
                message: 'Nombre y precio son requeridos'
            });
        }
        
        const query = `
            INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, proveedor_id, imagen)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await executeQuery(query, [
            nombre, 
            descripcion || null, 
            precio, 
            stock || 0, 
            categoria_id || null, 
            proveedor_id || null, 
            imagen || null
        ]);
        
        sendJSON(res, 201, {
            success: true,
            message: 'Producto creado exitosamente',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error creando producto:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al crear producto'
        });
    }
};

// Actualizar producto
const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, stock, categoria_id, proveedor_id, imagen, estado } = req.body;
        
        // Verificar que el producto existe
        const checkQuery = 'SELECT id FROM productos WHERE id = ?';
        const existingProduct = await executeQuery(checkQuery, [id]);
        
        if (existingProduct.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        const query = `
            UPDATE productos 
            SET nombre = ?, descripcion = ?, precio = ?, stock = ?, 
                categoria_id = ?, proveedor_id = ?, imagen = ?, estado = ?
            WHERE id = ?
        `;
        
        await executeQuery(query, [
            nombre, 
            descripcion, 
            precio, 
            stock, 
            categoria_id, 
            proveedor_id, 
            imagen, 
            estado || 'activo',
            id
        ]);
        
        sendJSON(res, 200, {
            success: true,
            message: 'Producto actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error actualizando producto:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al actualizar producto'
        });
    }
};

// Eliminar producto
const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el producto existe
        const checkQuery = 'SELECT id FROM productos WHERE id = ?';
        const existingProduct = await executeQuery(checkQuery, [id]);
        
        if (existingProduct.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        // Eliminar producto (esto también eliminará los detalles de venta relacionados por CASCADE)
        const deleteQuery = 'DELETE FROM productos WHERE id = ?';
        await executeQuery(deleteQuery, [id]);
        
        sendJSON(res, 200, {
            success: true,
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando producto:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al eliminar producto'
        });
    }
};

module.exports = {
    getProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto
};