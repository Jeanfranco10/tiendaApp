const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categorias');

router.get('/', categoriasController.getCategorias);
router.post('/', categoriasController.createCategoria);
router.get('/:id', categoriasController.getCategoriaById);
router.put('/:id', categoriasController.updateCategoria);
router.delete('/:id', categoriasController.deleteCategoria);

module.exports = router;
