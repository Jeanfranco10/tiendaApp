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

// Obtener todos los clientes
const getClientes = async (req, res) => {
    try {
        const query = `
            SELECT c.*, 
                   COUNT(v.id) as total_ventas
            FROM clientes c
            LEFT JOIN ventas v ON c.id = v.cliente_id
            GROUP BY c.id
            ORDER BY c.fecha_registro DESC
        `;
        
        const clientes = await executeQuery(query);
        
        sendJSON(res, 200, {
            success: true,
            data: clientes
        });
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al obtener clientes'
        });
    }
};

// Obtener cliente por ID
const getClientesById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = 'SELECT * FROM clientes WHERE id = ?';
        const clientes = await executeQuery(query, [id]);
        
        if (clientes.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        sendJSON(res, 200, {
            success: true,
            data: clientes[0]
        });
    } catch (error) {
        console.error('Error obteniendo cliente:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al obtener cliente'
        });
    }
};

// Crear nuevo cliente
const createClientes = async (req, res) => {
    try {
        const { nombre, email, telefono, direccion } = req.body;
        
        if (!nombre) {
            return sendJSON(res, 400, {
                success: false,
                message: 'El nombre es requerido'
            });
        }
        
        // Verificar que no exista un cliente con el mismo nombre
        const checkQuery = 'SELECT id FROM clientes WHERE nombre = ?';
        const existing = await executeQuery(checkQuery, [nombre]);
        
        if (existing.length > 0) {
            return sendJSON(res, 400, {
                success: false,
                message: 'Ya existe un cliente con ese nombre'
            });
        }
        
        const query = 'INSERT INTO clientes (nombre, email, telefono, direccion) VALUES (?, ?, ?, ?)';
        const result = await executeQuery(query, [nombre, email, telefono, direccion]);
        
        sendJSON(res, 201, {
            success: true,
            message: 'Cliente creado exitosamente',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error creando cliente:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al crear cliente'
        });
    }
};

// Actualizar cliente
const updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, telefono, direccion, estado } = req.body;
        
        // Verificar que el cliente existe
        const checkQuery = 'SELECT id FROM clientes WHERE id = ?';
        const existing = await executeQuery(checkQuery, [id]);
        
        if (existing.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        const query = `
            UPDATE clientes
            SET nombre = ?, email = ?, telefono = ?, direccion = ?, estado = ?
            WHERE id = ?
        `;
        
        await executeQuery(query, [nombre, email, telefono, direccion, estado || 'activo', id]);
        
        sendJSON(res, 200, {
            success: true,
            message: 'Cliente actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error actualizando cliente:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al actualizar cliente'
        });
    }
};

// Eliminar cliente
const deleteClientes = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el cliente existe
        const checkQuery = 'SELECT id FROM clientes WHERE id = ?';
        const existing = await executeQuery(checkQuery, [id]);
        
        if (existing.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        // Verificar si hay ventas usando este cliente
        const clientQuery = 'SELECT COUNT(*) as count FROM ventas WHERE cliente_id = ?';
        const clientCount = await executeQuery(clientQuery, [id]);
        
        if (clientCount[0].count > 0) {
            return sendJSON(res, 400, {
                success: false,
                message: 'No se puede eliminar el cliente porque tiene ventas asociadas'
            });
        }
        
        const deleteQuery = 'DELETE FROM clientes WHERE id = ?';
        await executeQuery(deleteQuery, [id]);
        
        sendJSON(res, 200, {
            success: true,
            message: 'Cliente eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando cliente:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al eliminar cliente'
        });
    }
};

module.exports = {
    getClientes,
    getClientesById,
    createClientes,
    updateCliente,
    deleteClientes
};