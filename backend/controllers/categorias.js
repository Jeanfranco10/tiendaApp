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

// Obtener todas las categorías
const getCategorias = async (req, res) => {
    try {
        const query = `
            SELECT c.*, 
                   COUNT(p.id) as total_productos
            FROM categorias c
            LEFT JOIN productos p ON c.id = p.categoria_id
            GROUP BY c.id
            ORDER BY c.fecha_creacion DESC
        `;
        
        const categorias = await executeQuery(query);
        
        sendJSON(res, 200, {
            success: true,
            data: categorias
        });
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al obtener categorías'
        });
    }
};

// Obtener categoría por ID
const getCategoriaById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = 'SELECT * FROM categorias WHERE id = ?';
        const categorias = await executeQuery(query, [id]);
        
        if (categorias.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Categoría no encontrada'
            });
        }
        
        sendJSON(res, 200, {
            success: true,
            data: categorias[0]
        });
    } catch (error) {
        console.error('Error obteniendo categoría:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al obtener categoría'
        });
    }
};

// Crear nueva categoría
const createCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        
        if (!nombre) {
            return sendJSON(res, 400, {
                success: false,
                message: 'El nombre es requerido'
            });
        }
        
        // Verificar que no exista una categoría con el mismo nombre
        const checkQuery = 'SELECT id FROM categorias WHERE nombre = ?';
        const existing = await executeQuery(checkQuery, [nombre]);
        
        if (existing.length > 0) {
            return sendJSON(res, 400, {
                success: false,
                message: 'Ya existe una categoría con ese nombre'
            });
        }
        
        const query = 'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)';
        const result = await executeQuery(query, [nombre, descripcion || null]);
        
        sendJSON(res, 201, {
            success: true,
            message: 'Categoría creada exitosamente',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error creando categoría:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al crear categoría'
        });
    }
};

// Actualizar categoría
const updateCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, estado } = req.body;
        
        // Verificar que la categoría existe
        const checkQuery = 'SELECT id FROM categorias WHERE id = ?';
        const existing = await executeQuery(checkQuery, [id]);
        
        if (existing.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Categoría no encontrada'
            });
        }
        
        const query = `
            UPDATE categorias 
            SET nombre = ?, descripcion = ?, estado = ?
            WHERE id = ?
        `;
        
        await executeQuery(query, [nombre, descripcion, estado || 'activo', id]);
        
        sendJSON(res, 200, {
            success: true,
            message: 'Categoría actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al actualizar categoría'
        });
    }
};

// Eliminar categoría
const deleteCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que la categoría existe
        const checkQuery = 'SELECT id FROM categorias WHERE id = ?';
        const existing = await executeQuery(checkQuery, [id]);
        
        if (existing.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Categoría no encontrada'
            });
        }
        
        // Verificar si hay productos usando esta categoría
        const productsQuery = 'SELECT COUNT(*) as count FROM productos WHERE categoria_id = ?';
        const productCount = await executeQuery(productsQuery, [id]);
        
        if (productCount[0].count > 0) {
            return sendJSON(res, 400, {
                success: false,
                message: 'No se puede eliminar la categoría porque tiene productos asociados'
            });
        }
        
        const deleteQuery = 'DELETE FROM categorias WHERE id = ?';
        await executeQuery(deleteQuery, [id]);
        
        sendJSON(res, 200, {
            success: true,
            message: 'Categoría eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al eliminar categoría'
        });
    }
};

module.exports = {
    getCategorias,
    getCategoriaById,
    createCategoria,
    updateCategoria,
    deleteCategoria
};