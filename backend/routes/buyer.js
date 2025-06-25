



const express = require('express');
const router = express.Router();
const Buyer = require('../models/Buyer');
const jwt = require('jsonwebtoken');
const Property= require('../models/Property');
const Seller = require('../models/Seller');
const Admin = require('../models/Admin');
const Appointment = require('../models/Appointment');



const verifyBuyer = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const buyer = await Buyer.findById(decoded.id);

    if (!buyer) {
      return res.status(401).json({ message: 'Token is invalid' });
    }

    req.buyer = buyer;
    next();
  } catch (error) {
    console.error('Error verifying buyer token:', error);
    res.status(401).json({ message: 'Token is invalid' });
  }
};


router.get('/profile', verifyBuyer, async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.buyer._id).select('-password');
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    res.json(buyer);
  } catch (error) {
    console.error('Error fetching buyer profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.put('/profile', verifyBuyer, async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;
    
    
    if (!name || !email || !phoneNumber) {
      return res.status(400).json({ message: 'Name, email and phone number are required' });
    }

    
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    
    const existingBuyer = await Buyer.findOne({ 
      email, 
      _id: { $ne: req.buyer._id } 
    });
    
    if (existingBuyer) {
      return res.status(400).json({ message: 'Email is already taken' });
    }

    
    const updatedBuyer = await Buyer.findByIdAndUpdate(
      req.buyer._id,
      { name, email, phoneNumber },
      { new: true }
    ).select('-password');

    res.json(updatedBuyer);
  } catch (error) {
    console.error('Error updating buyer profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.put('/change-password', verifyBuyer, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    
    const buyer = await Buyer.findById(req.buyer._id);
    
    
    const isMatch = await buyer.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    
    buyer.password = newPassword;
    await buyer.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.get('/properties', verifyBuyer, async (req, res) => {
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


router.get('/properties/:id', verifyBuyer, async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, status: 'approved' })
      .populate('createdBy', 'name email phoneNumber')
      .select('title propertyType price address beds baths sqft landArea zoning floorNumber totalFloors imageUrl createdAt createdBy createdByModel interested status');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    
    let creator = null;
    if (property.createdByModel === 'Seller') {
      creator = await Seller.findById(property.createdBy).select('name email phoneNumber');
    } else if (property.createdByModel === 'Admin') {
      creator = await Admin.findById(property.createdBy).select('name email phoneNumber');
    }

    
    const buyer = await Buyer.findById(req.buyer._id).select('name email phoneNumber');
    const isInterested = property.interested && property.interested.includes(req.buyer._id);

    res.json({ 
      property, 
      creator, 
      buyer,
      isInterested 
    });
  } catch (error) {
    console.error('Error fetching property details:', error);
    res.status(500).json({ message: 'Error fetching property details', error: error.message });
  }
});



router.post('/properties/:id/interested', verifyBuyer, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const { action } = req.body;
    if (!['mark', 'unmark'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be either "mark" or "unmark"' });
    }

    if (action === 'unmark') {
      
      await Property.findByIdAndUpdate(
        req.params.id,
        { $pull: { interested: req.buyer._id } }
      );
      res.json({ message: 'Property unmarked as interested successfully' });
    } else {
      
      await Property.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { interested: req.buyer._id } }
      );
      res.json({ message: 'Property marked as interested successfully' });
    }
  } catch (error) {
    console.error('Error updating property interest:', error);
    res.status(500).json({ message: 'Error updating property interest', error: error.message });
  }
});


router.get('/appointments', verifyBuyer, async (req, res) => {
  try {
    const appointments = await Appointment.find({ buyer: req.buyer._id })
      .populate('seller', 'name email phoneNumber')
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.get('/appointments/:id', verifyBuyer, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      buyer: req.buyer._id
    }).populate('seller', 'name email phoneNumber');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.post('/appointments', verifyBuyer, async (req, res) => {
  try {
    const { propertyId, sellerId, date, placeToVisit, message } = req.body;

    
    if (!propertyId || !sellerId || !date || !placeToVisit || !message) {
      return res.status(400).json({ 
        message: 'Property ID, seller details, date, place to visit and message are required' 
      });
    }

    
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    
    const sellerExists = await Seller.findById(sellerId);
    if (!sellerExists) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const appointment = new Appointment({
      date,
      placeToVisit,
      message,
      seller: sellerId,
      buyer: req.buyer._id,
      property: propertyId 
    });

    await appointment.save();
    
    
    await appointment.populate([
      { path: 'seller', select: 'name email phoneNumber' },
      { path: 'property', select: 'title address price imageUrl' }
    ]);

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.delete('/appointments/:id', verifyBuyer, async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndDelete({
      _id: req.params.id,
      buyer: req.buyer._id,
      status: 'pending' 
    });

    if (!appointment) {
      return res.status(404).json({ 
        message: 'Appointment not found or cannot be cancelled' 
      });
    }

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;
