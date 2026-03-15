require('dotenv').config();

const jwt = require('jsonwebtoken');

 // Clave secreta para JWT (en producción debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware para verificar token JWT
const verifyToken = (req, res, next) => {
    //Busca el token en el encabezado Authorization de la solicitud.
    const token = req.headers['authorization'] || req.headers['Authorization'];
    
    //Si no hay token, devuelve un error 401 ("No autorizado").
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token no proporcionado' 
        });
    }


    try {
        // Remover 'Bearer ' del token si existe
        //Si sí (token.startsWith('Bearer ')), entonces token.slice(7) corta los primeros 7 caracteres ("Bearer ") para quedarse solo con el token puro.
        //Si no, simplemente usa el token tal cual.
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        
        // Verificar el token
        const decoded = jwt.verify(cleanToken, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: 'Token inválido' 
        });
    }
};

// Función para generar token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            email: user.email 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

module.exports = {
    verifyToken,
    generateToken,
    JWT_SECRET
};