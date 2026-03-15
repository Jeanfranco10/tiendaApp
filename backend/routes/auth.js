const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas (no requieren token)
router.post('/login', authController.login);
router.post('/register', authController.register);

// Ruta protegida (requiere token)
router.get('/verify',verifyToken, authController.verifySession);

module.exports = router;
