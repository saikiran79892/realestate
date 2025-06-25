const express = require('express');
const router = express.Router();
const Property = require('../models/Property');


router.get('/properties', async (req, res) => {
  try {
    const properties = await Property.find({ status: 'approved' })
      .populate('createdBy', 'name email')
      .select('title propertyType price address beds baths sqft landArea zoning floorNumber totalFloors imageUrl createdAt createdBy createdByModel')
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Error fetching properties' });
  }
});


router.get('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, status: 'approved' })
      .populate('createdBy', 'name email');
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ message: 'Error fetching property' });
  }
});

module.exports = router;
