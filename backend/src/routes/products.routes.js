const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');

router.get('/', productsController.getProducts);
router.post('/', productsController.createProduct);
router.get('/:id', productsController.getProductDetail);
router.put('/:id', productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);


module.exports = router;