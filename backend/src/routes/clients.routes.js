const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/clients.controller');

// GET /api/clients      -> liste les contacts
router.get('/', clientsController.getClients);

// POST /api/clients     -> crée un contact
router.post('/', clientsController.createClient);

// PUT /api/clients/:id     -> modifie un contact existant
router.put('/:id', clientsController.updateClient);

// DELETE /api/clients/:id  -> supprime un contact
router.delete('/:id', clientsController.deleteClient);

// GET /api/clients/:id     -> récupère les détails d'un contact
router.get('/:id', clientsController.getClientDetail);

module.exports = router;