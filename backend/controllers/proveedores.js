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

// Obtener todos los proveedores
const getProveedores = async (req, res) => {
    try {
        const query = `
            SELECT p.*, 
                   COUNT(pr.id) as total_productos
            FROM proveedores p
            LEFT JOIN productos pr ON p.id = pr.proveedor_id
            GROUP BY p.id
            ORDER BY p.fecha_creacion DESC
        `;
        
        const proveedores = await executeQuery(query);
        
        sendJSON(res, 200, {
            success: true,
            data: proveedores
        });
    } catch (error) {
        console.error('Error obteniendo proveedores:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al obtener proveedores'
        });
    }
};

// Obtener proveedor por ID
const getProveedorById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = 'SELECT * FROM proveedores WHERE id = ?';
        const proveedores = await executeQuery(query, [id]);
        
        if (proveedores.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Proveedor no encontrado'
            });
        }
        
        sendJSON(res, 200, {
            success: true,
            data: proveedores[0]
        });
    } catch (error) {
        console.error('Error obteniendo proveedor:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al obtener proveedor'
        });
    }
};

// Crear nuevo proveedor
const createProveedor = async (req, res) => {
    try {
        const { nombre, contacto, telefono, email, direccion } = req.body;
        
        if (!nombre) {
            return sendJSON(res, 400, {
                success: false,
                message: 'El nombre es requerido'
            });
        }
        
        const query = `
            INSERT INTO proveedores (nombre, contacto, telefono, email, direccion)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const result = await executeQuery(query, [
            nombre,
            contacto || null,
            telefono || null,
            email || null,
            direccion || null
        ]);
        
        sendJSON(res, 201, {
            success: true,
            message: 'Proveedor creado exitosamente',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error creando proveedor:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al crear proveedor'
        });
    }
};

// Actualizar proveedor
const updateProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, contacto, telefono, email, direccion, estado } = req.body;
        
        // Verificar que el proveedor existe
        const checkQuery = 'SELECT id FROM proveedores WHERE id = ?';
        const existing = await executeQuery(checkQuery, [id]);
        
        if (existing.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Proveedor no encontrado'
            });
        }
        
        const query = `
            UPDATE proveedores 
            SET nombre = ?, contacto = ?, telefono = ?, email = ?, direccion = ?, estado = ?
            WHERE id = ?
        `;
        
        await executeQuery(query, [
            nombre,
            contacto,
            telefono,
            email,
            direccion,
            estado || 'activo',
            id
        ]);
        
        sendJSON(res, 200, {
            success: true,
            message: 'Proveedor actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error actualizando proveedor:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al actualizar proveedor'
        });
    }
};

// Eliminar proveedor
const deleteProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el proveedor existe
        const checkQuery = 'SELECT id FROM proveedores WHERE id = ?';
        const existing = await executeQuery(checkQuery, [id]);
        
        if (existing.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Proveedor no encontrado'
            });
        }
        
        // Verificar si hay productos usando este proveedor
        const productsQuery = 'SELECT COUNT(*) as count FROM productos WHERE proveedor_id = ?';
        const productCount = await executeQuery(productsQuery, [id]);
        
        if (productCount[0].count > 0) {
            return sendJSON(res, 400, {
                success: false,
                message: 'No se puede eliminar el proveedor porque tiene productos asociados'
            });
        }
        
        const deleteQuery = 'DELETE FROM proveedores WHERE id = ?';
        await executeQuery(deleteQuery, [id]);
        
        sendJSON(res, 200, {
            success: true,
            message: 'Proveedor eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando proveedor:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al eliminar proveedor'
        });
    }
};

module.exports = {
    getProveedores,
    getProveedorById,
    createProveedor,
    updateProveedor,
    deleteProveedor
};