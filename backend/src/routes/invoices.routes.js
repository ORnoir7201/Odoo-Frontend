const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoices.controller');

router.get('/overview', invoicesController.getOverview); // AVANT /:id
router.get('/', invoicesController.getInvoices);
router.post('/', invoicesController.createInvoice);
router.get('/:id', invoicesController.getInvoiceDetail);
router.put('/:id', invoicesController.updateInvoice);
router.delete('/:id', invoicesController.deleteInvoice);
router.post('/:id/confirm', invoicesController.confirmInvoice);
router.post('/:id/cancel', invoicesController.cancelInvoice);
router.post('/:id/duplicate', invoicesController.duplicateInvoice);
router.get('/:id/share', invoicesController.getShareLink);
router.post('/:id/send', invoicesController.sendInvoice);
router.post('/:id/reset-draft', invoicesController.resetInvoiceToDraft);
router.post('/:id/add-refund', invoicesController.addRefund);
router.get('/:id/messages', invoicesController.getInvoiceMessages);
router.post('/:id/messages', invoicesController.postInvoiceMessage);

module.exports = router;