const express = require('express');
const router = express.Router();
const suppliersController = require('../controllers/suppliers.controller');

router.get('/', suppliersController.getSuppliers);
router.post('/', suppliersController.createSupplier);
router.put('/:id', suppliersController.updateSupplier);
router.delete('/:id', suppliersController.deleteSupplier);
router.get('/:id', suppliersController.getSupplierDetail);

module.exports = router;