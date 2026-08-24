const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const companySwitchController = require('../controllers/companySwitch.controller');
const usersController = require('../controllers/users.controller');

router.get('/layouts', settingsController.getLayouts);
router.get('/company', settingsController.getMyCompanySettings);
router.put('/company', settingsController.updateMyCompanySettings);
router.get('/my-companies', companySwitchController.getMyCompanies);
router.post('/switch-company', companySwitchController.switchCompany);
router.get('/languages', usersController.getLanguages);
router.get('/companies', settingsController.getCompaniesAdmin);
router.post('/companies', settingsController.createCompanyAdmin);
router.get('/companies/:id', settingsController.getCompanyAdminDetail);
router.put('/companies/:id', settingsController.updateCompanyAdmin);

module.exports = router;