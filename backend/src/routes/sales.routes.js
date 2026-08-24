const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');

router.get('/', salesController.getSales);
router.post('/', salesController.createSale);
router.get('/taxes', salesController.getTaxes); // AVANT /:id
router.get('/payment-terms', salesController.getPaymentTerms); // AVANT /:id
router.get('/salespersons', salesController.getSalespersons); // AVANT /:id
router.get('/:id', salesController.getSaleDetail);
router.put('/:id', salesController.updateSale);
router.delete('/:id', salesController.deleteSale);
router.post('/:id/send', salesController.sendSale);
router.post('/:id/confirm', salesController.confirmSale);
router.post('/:id/cancel', salesController.cancelSale);
router.post('/:id/duplicate', salesController.duplicateSale);
router.get('/:id/share', salesController.getShareLink);
router.post('/:id/invoice', salesController.invoiceSale);

module.exports = router;