 const bcrypt = require('bcrypt');
const { executeQuery } = require('../config/database');
const { generateToken } = require('../middleware/auth');

// Función helper para enviar respuestas JSON (igual que en tu server.js)
const sendJSON = (res, statusCode, data) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
};

// Login de usuario
const login = async (req, res) => {
    try {
        //Obtiene las credenciales que el usuario proporcionó.
        const { username, password } = req.body;

        // Validar que se enviaron los datos
        if (!username || !password) {
            return sendJSON(res, 400, {
                success: false,
                message: 'Username y password son requeridos'
            });
        }

        // Buscar usuario en la base de datos
        const query = 'SELECT * FROM usuarios WHERE username = ? AND estado = "activo"';
        const users = await executeQuery(query, [username]);

        //Comprueba si la consulta no encontró ningún usuario.
        if (users.length === 0) {
            return sendJSON(res, 401, {
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        //Si se encontró un usuario, toma el primer (y único) resultado de la consulta.
        const user = users[0];

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        //Comprueba si la contraseña ingresada no coincide con la hasheada.
        if (!passwordMatch) {
            return sendJSON(res, 401, {
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Si el nombre de usuario existe y la contraseña es correcta,Generar token JWT
        const token = generateToken(user);

        // Respuesta exitosa (sin enviar la contraseña)
        //El password: _ es una forma de decir "saca la propiedad password y no la guardes en ninguna variable".
        const { password: _, ...userWithoutPassword } = user;
        
        sendJSON(res, 200, {
            success: true,
            message: 'Login exitoso',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Error en login:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Registro de usuario (opcional)
const register = async (req, res) => {
    try {
        const { username, email, password, nombre } = req.body;

        // Validaciones básicas
        if (!username || !email || !password || !nombre) {
            return sendJSON(res, 400, {
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Verificar si el usuario ya existe
        const checkQuery = 'SELECT id FROM usuarios WHERE username = ? OR email = ?';
        const existingUsers = await executeQuery(checkQuery, [username, email]);

        if (existingUsers.length > 0) {
            return sendJSON(res, 400, {
                success: false,
                message: 'El usuario o email ya existe'
            });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar nuevo usuario
        const insertQuery = `
            INSERT INTO usuarios (username, email, password, nombre) 
            VALUES (?, ?, ?, ?)
        `;
        const result = await executeQuery(insertQuery, [username, email, hashedPassword, nombre]);

        sendJSON(res, 201, {
            success: true,
            message: 'Usuario registrado exitosamente',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Error en registro:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Verificar token (para mantener sesión)
const verifySession = async (req, res) => {
    try {
        // El middleware ya verificó el token, solo devolvemos la info del usuario
        const query = 'SELECT id, username, email, nombre FROM usuarios WHERE id = ?';
        const users = await executeQuery(query, [req.user.id]);

        if (users.length === 0) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        sendJSON(res, 200, {
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Error verificando sesión:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    login,
    register,
    verifySession
};