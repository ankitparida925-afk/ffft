const express = require('express');
const router = express.Router();
const { saveLocation, getLocations } = require('../controller/locationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, saveLocation);
router.get('/', protect, adminOnly, getLocations);

module.exports = router;
