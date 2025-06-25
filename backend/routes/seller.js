const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Property = require('../models/Property');
const Seller = require('../models/Seller');
const Appointment = require('../models/Appointment');


const verifySeller = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== 'seller') {
        return res.status(403).json({ message: 'Access denied. Seller only.' });
      }

      const seller = await Seller.findById(decoded.id);
      if (!seller) {
        return res.status(401).json({ message: 'Seller not found' });
      }

      req.seller = seller;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'JsonWebTokenError' || jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      throw jwtError;
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


router.get('/dashboard-stats', verifySeller, async (req, res) => {
  try {
    
    const properties = await Property.find({ createdBy: req.seller._id });
    
    
    const appointments = await Appointment.find({
      property: { $in: properties.map(p => p._id) }
    });

    
    const stats = {
      totalProperties: properties.length,
      approvedProperties: properties.filter(p => p.status === 'approved').length,
      pendingProperties: properties.filter(p => p.status === 'pending').length,
      rejectedProperties: properties.filter(p => p.status === 'rejected').length,
      totalAppointments: appointments.length,
      recentActivity: properties
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map(p => ({
          id: p._id,
          title: p.title,
          status: p.status,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          appointmentCount: appointments.filter(a => a.property.toString() === p._id.toString()).length
        }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.get('/profile', verifySeller, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id).select('-password');
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    res.json(seller);
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.put('/profile', verifySeller, async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;
    
    
    if (!name || !email || !phoneNumber) {
      return res.status(400).json({ message: 'Name, email and phone number are required' });
    }

    
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    
    const existingSeller = await Seller.findOne({ 
      email, 
      _id: { $ne: req.seller._id } 
    });
    
    if (existingSeller) {
      return res.status(400).json({ message: 'Email is already taken' });
    }

    
    const updatedSeller = await Seller.findByIdAndUpdate(
      req.seller._id,
      { name, email, phoneNumber },
      { new: true }
    ).select('-password');

    res.json(updatedSeller);
  } catch (error) {
    console.error('Error updating seller profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.put('/change-password', verifySeller, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    
    const seller = await Seller.findById(req.seller._id);
    
    
    const isMatch = await seller.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    
    seller.password = newPassword;
    await seller.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.get('/properties', verifySeller, async (req, res) => {
  try {
    
    if (!req.seller?._id) {
      return res.status(401).json({ message: 'Unauthorized - Invalid seller ID' });
    }

    const properties = await Property.find({ createdBy: req.seller._id, createdByModel: 'Seller' })
      .sort({ createdAt: -1 }) 
      .lean(); 

    if (!properties) {
      return res.status(404).json({ message: 'No properties found' });
    }

    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.post('/properties', verifySeller, async (req, res) => {
  try {
    const { 
      title, 
      price, 
      address, 
      propertyType, 
      imageUrl,
      beds,
      baths, 
      sqft,
      landArea,
      zoning,
      floorNumber,
      totalFloors
    } = req.body;
    
    
    if (!title || !price || !address || !propertyType || !imageUrl) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    
    if (propertyType === 'house' && (!beds || !baths || !sqft)) {
      return res.status(400).json({ message: 'House properties require beds, baths, and sqft' });
    }
    if (propertyType === 'land' && (!landArea || !zoning)) {
      return res.status(400).json({ message: 'Land properties require land area and zoning' });
    }
    if (propertyType === 'apartment' && (!floorNumber || !totalFloors)) {
      return res.status(400).json({ message: 'Apartment properties require floor number and total floors' });
    }

    const property = new Property({
      title,
      price,
      address,
      propertyType,
      imageUrl,
      beds,
      baths,
      sqft,
      landArea,
      zoning,
      floorNumber,
      totalFloors,
      createdBy: req.seller._id,
      createdByModel: 'Seller',
      status: 'pending'
    });

    const savedProperty = await property.save();
    res.status(201).json(savedProperty);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.put('/properties/:id', verifySeller, async (req, res) => {
  try {
    const { 
      title, 
      price, 
      address, 
      propertyType, 
      imageUrl, 
      beds, 
      baths, 
      sqft,
      landArea,
      zoning,
      floorNumber,
      totalFloors
    } = req.body;
    
    
    if (!title || !price || !address || !propertyType || !imageUrl) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    
    if (propertyType === 'house' && (!beds || !baths || !sqft)) {
      return res.status(400).json({ message: 'House properties require beds, baths, and sqft' });
    }
    if (propertyType === 'land' && (!landArea || !zoning)) {
      return res.status(400).json({ message: 'Land properties require land area and zoning' });
    }
    if (propertyType === 'apartment' && (!floorNumber || !totalFloors)) {
      return res.status(400).json({ message: 'Apartment properties require floor number and total floors' });
    }

    const property = await Property.findOne({ _id: req.params.id, createdBy: req.seller._id });
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    
    const updates = {
      title,
      price,
      address,
      propertyType,
      imageUrl,
      beds,
      baths,
      sqft,
      landArea,
      zoning,
      floorNumber,
      totalFloors,
      status: 'pending',
      updatedAt: new Date()
    };

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json(updatedProperty);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.delete('/properties/:id', verifySeller, async (req, res) => {
  try {
    
    if (!req.params.id) {
      return res.status(400).json({ message: 'Property ID is required' });
    }

    const property = await Property.findOneAndDelete({ 
      _id: req.params.id, 
      createdBy: req.seller._id,
      createdByModel: 'Seller'
    });
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json({ message: 'Property deleted successfully', deletedProperty: property });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



router.get('/appointments', verifySeller, async (req, res) => {
  try {
    const appointments = await Appointment.find({ seller: req.seller._id })
      .populate('buyer', 'name email phoneNumber')
      .populate('property', 'title address price imageUrl beds baths sqft')
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.put('/appointments/:id', verifySeller, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status',
        allowed: ['pending', 'accepted', 'rejected', 'completed']
      });
    }

    const appointment = await Appointment.findOneAndUpdate(
      { 
        _id: req.params.id,
        seller: req.seller._id 
      },
      { status },
      { new: true }
    ).populate('buyer', 'name email phoneNumber');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.get('/appointments/:id', verifySeller, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      seller: req.seller._id
    }).populate('buyer', 'name email phoneNumber');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.put('/appointments/:id', verifySeller, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status',
        allowed: ['pending', 'accepted', 'rejected', 'completed']
      });
    }

    const appointment = await Appointment.findOneAndUpdate(
      { 
        _id: req.params.id,
        seller: req.seller._id 
      },
      { status },
      { new: true }
    ).populate('buyer', 'name email phoneNumber');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});







module.exports = router;
