const Location = require('../model/Location');

// @desc    Save user location
// @route   POST /api/location
// @access  Private
const saveLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Please provide latitude and longitude' });
    }

    const location = await Location.create({
      user: req.user.id,
      latitude,
      longitude
    });

    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all locations (for admin)
// @route   GET /api/location
// @access  Private/Admin
const getLocations = async (req, res) => {
  try {
    const locations = await Location.find().populate('user', 'name email role isActive');
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { saveLocation, getLocations };
