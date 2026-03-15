 const { executeQuery, getConnection } = require('../config/database'); // Necesitamos getConnection para transacciones

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

// Obtener todas las ventas (con JOIN a clientes para más información)
const getVentas = async (req, res) => {
    try {
        const query = `
            SELECT 
                v.id AS venta_id,
                v.fecha_venta,
                v.subtotal AS subtotal_venta,
                v.impuestos,
                v.total,
                v.estado,
                c.nombre AS cliente_nombre,
                c.email AS cliente_email
            FROM ventas v
            JOIN clientes c ON v.cliente_id = c.id 
            ORDER BY v.fecha_venta DESC
        `;
        
        const ventas = await executeQuery(query);
        
        sendJSON(res, 200, {
            success: true,
            data: ventas
        });
    } catch (error) {
        console.error('Error obteniendo ventas:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al obtener ventas'
        });
    }
};

// Obtener venta por ID (incluyendo sus detalles)
const getVentaById = async (req, res) => {
    try {
        const { id } = req.params; // ID de la venta
        
        // 1. Obtener la información principal de la venta
        const ventaQuery = `
            SELECT 
               v.id AS venta_id,
                v.fecha_venta,
                v.subtotal AS subtotal_venta,
                v.impuestos,
                v.total,
                v.estado,
                c.nombre AS cliente_nombre,
                c.email AS cliente_email
            FROM ventas v
            JOIN clientes c ON v.cliente_id = c.id 
            WHERE v.id = ?
        `;
        const ventaResult = await executeQuery(ventaQuery, [id]);
        
        if (ventaResult.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Venta no encontrada'
            });
        }
        
        const venta = ventaResult[0];
        
        // 2. Obtener los detalles de esa venta
        const detallesQuery = `
            SELECT 
                vd.id AS detalle_id,
                vd.producto_id,
                p.nombre AS producto_nombre, -- Asumiendo 'nombre_producto' en productos
                vd.cantidad,
                vd.precio_unitario,
                vd.subtotal AS subtotal_detalle
            FROM venta_detalles vd
            JOIN productos p ON vd.producto_id = p.id 
            WHERE vd.venta_id = ?
        `;
        const detalles = await executeQuery(detallesQuery, [id]);
        
        // Combinar la venta y sus detalles
        //Los agrega al objeto venta.
        venta.detalles = detalles;
        
        sendJSON(res, 200, {
            success: true,
            data: venta
        });
    } catch (error) {
        console.error('Error obteniendo venta por ID:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error al obtener venta por ID'
        });
    }
};

// Crear nueva venta (con sus detalles, usando transacción)
const createVenta = async (req, res) => {
    let connection; 
    try {
        // Los datos del cuerpo de la petición
        const { cliente_id, detalles,estado } = req.body; 

         

        const impuestos_porcentaje = 0.18; // Ejemplo: 18% de impuestos, puedes cambiarlo o pasarlo por req.body

        if (!cliente_id || !detalles || detalles.length === 0) {
            return sendJSON(res, 400, {
                success: false,
                message: 'El ID del cliente y los detalles de la venta son requeridos.'
            });
        }

        // Validar detalles y calcular el subtotal de la venta
        let subtotalVenta = 0;
        for (const detalle of detalles) {
            if (!detalle.producto_id || !detalle.cantidad || detalle.precio_unitario === undefined) {
                return sendJSON(res, 400, {
                    success: false,
                    message: 'Cada detalle de venta debe tener producto_id, cantidad y precio_unitario.'
                });
            }
            // Asegúrate de que cantidad y precio_unitario sean números
            detalle.cantidad = Number(detalle.cantidad);
            detalle.precio_unitario = Number(detalle.precio_unitario);
            detalle.subtotal = detalle.cantidad * detalle.precio_unitario;
            subtotalVenta += detalle.subtotal;
        }

        const impuestosVenta = subtotalVenta * impuestos_porcentaje;
        const totalVenta = subtotalVenta + impuestosVenta;
        const fecha_venta = new Date().toISOString().slice(0, 10); // Formato YYYY-MM-DD

        // Normalizamos el estado para que coincida con el ENUM en minúsculas
        const estadoValido = ['pendiente','cancelada','completada'];
        const estadoNormalizado = (estado || '').toLowerCase();
        const estadoVenta = estadoValido.includes(estadoNormalizado) 
            ? estadoNormalizado 
            : 'completada';

        

        // --- Inicio de la Transacción ---
        connection = await getConnection(); 
        await connection.beginTransaction(); 
        
        // 1. Insertar la venta principal
        const insertVentaQuery = `
            INSERT INTO ventas (cliente_id, fecha_venta, subtotal, impuestos, total, estado) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const ventaResult = await connection.execute(insertVentaQuery, [
            cliente_id, 
            fecha_venta, 
            subtotalVenta, 
            impuestosVenta, 
            totalVenta, 
            estadoVenta
        ]);
        const ventaId = ventaResult[0].insertId; // ID de la venta recién creada

        // 2. Insertar cada detalle de la venta
        const insertDetalleQuery = `
            INSERT INTO venta_detalles (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
            VALUES (?, ?, ?, ?, ?)
        `;
        for (const detalle of detalles) {
            await connection.execute(insertDetalleQuery, [
                ventaId, 
                detalle.producto_id, 
                detalle.cantidad, 
                detalle.precio_unitario, 
                detalle.subtotal // El subtotal del detalle ya lo calculamos antes
            ]);
        }
        
        await connection.commit(); 
        // --- Fin de la Transacción ---
        
        sendJSON(res, 201, {
            success: true,
            message: 'Venta creada exitosamente',
            data: { id: ventaId, total: totalVenta ,estado:estadoVenta}
        });

    } catch (error) {
        console.error('Error creando venta:', error);
        if (connection) {
            try {
                await connection.rollback(); 
                console.log('Transacción de venta revertida.');
            } catch (rollbackError) {
                console.error('Error al hacer rollback:', rollbackError);
            }
        }
        sendJSON(res, 500, {
            success: false,
            message: 'Error al crear venta'
        });
    } finally {
        if (connection) {
            connection.release(); 
        }
    }
};

module.exports = {
    getVentas,
    getVentaById,
    createVenta
};