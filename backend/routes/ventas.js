const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventas');

router.get('/', ventasController.getVentas);
router.post('/', ventasController.createVenta);
router.get('/:id', ventasController.getVentaById);

module.exports = router;
