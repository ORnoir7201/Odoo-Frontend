const express = require('express');
const router = express.Router();
const purchasesController = require('../controllers/purchases.controller');

router.get('/', purchasesController.getPurchases);
router.post('/', purchasesController.createPurchase);
router.get('/taxes', purchasesController.getTaxes); // AVANT /:id, sinon "taxes" serait pris pour un id
router.get('/buyers', purchasesController.getBuyers); // AVANT /:id
router.get('/:id', purchasesController.getPurchaseDetail);
router.put('/:id', purchasesController.updatePurchase);
router.delete('/:id', purchasesController.deletePurchase);
router.post('/:id/send', purchasesController.sendPurchase);
router.post('/:id/confirm', purchasesController.confirmPurchase);
router.post('/:id/cancel', purchasesController.cancelPurchase);
router.post('/:id/duplicate', purchasesController.duplicatePurchase);
router.get('/:id/share', purchasesController.getShareLink);

module.exports = router;