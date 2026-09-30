const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');

router.get('/unpaid-invoices', paymentsController.getUnpaidInvoices); // AVANT /:id
router.get('/', paymentsController.getPayments);
router.post('/', paymentsController.createPayment);
router.get('/:id', paymentsController.getPaymentDetail);
router.post('/:id/confirm', paymentsController.confirmPayment);
router.post('/:id/cancel', paymentsController.cancelPayment);
router.delete('/:id', paymentsController.deletePayment);
router.put('/:id', paymentsController.updatePayment);
router.post('/:id/send-receipt', paymentsController.sendReceipt);
router.post('/:id/reset-draft', paymentsController.resetPaymentToDraft);
router.get('/:id/messages', paymentsController.getPaymentMessages);
router.post('/:id/messages', paymentsController.postPaymentMessage);

module.exports = router;