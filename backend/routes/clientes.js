const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes');

router.get('/', clientesController.getClientes);
router.post('/', clientesController.createClientes);
router.get('/:id', clientesController.getClientesById);
router.put('/:id', clientesController.updateCliente);
router.delete('/:id', clientesController.deleteClientes);

module.exports = router;
