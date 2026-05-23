const bcrypt = require('bcrypt');
const { executeQuery } = require('../config/database');
const { generateToken } = require('../middleware/auth');

// Login de usuario
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username y password son requeridos'
            });
        }

        const query = "SELECT * FROM usuarios WHERE username = ? AND estado = 'activo'";
        const users = await executeQuery(query, [username]);

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const token = generateToken(user);
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Registro de usuario
const register = async (req, res) => {
    try {
        const { username, email, password, nombre } = req.body;

        if (!username || !email || !password || !nombre) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        const checkQuery = 'SELECT id FROM usuarios WHERE username = ? OR email = ?';
        const existingUsers = await executeQuery(checkQuery, [username, email]);

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El usuario o email ya existe'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertQuery = `
            INSERT INTO usuarios (username, email, password, nombre) 
            VALUES (?, ?, ?, ?)
        `;
        const result = await executeQuery(insertQuery, [username, email, hashedPassword, nombre]);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Verificar token
const verifySession = async (req, res) => {
    try {
        const query = 'SELECT id, username, email, nombre FROM usuarios WHERE id = ?';
        const users = await executeQuery(query, [req.user.id]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error('Error verificando sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = { login, register, verifySession };