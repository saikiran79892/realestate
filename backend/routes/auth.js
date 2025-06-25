
const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');

const router = express.Router();


const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};


const validateRegistration = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 50) {
    errors.push('Name must be between 2 and 50 characters');
  }
  
  if (!data.username || data.username.trim().length < 3 || data.username.trim().length > 30) {
    errors.push('Username must be between 3 and 30 characters');
  }
  
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (!['buyer', 'seller', 'admin'].includes(data.role)) {
    errors.push('Invalid role specified');
  }
  
  if (['buyer', 'seller'].includes(data.role)) {
    if (!data.phoneNumber || !/^\+?[\d\s()-]{10,}$/.test(data.phoneNumber)) {
      errors.push('Valid phone number is required for buyers and sellers');
    }
  }

  return errors;
};


const validateSignin = (data) => {
  const errors = [];
  
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (!['buyer', 'seller', 'admin'].includes(data.role)) {
    errors.push('Invalid role specified');
  }

  return errors;
};


router.post('/register', async (req, res) => {
  try {
    
    const validationErrors = validateRegistration(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation error',
        details: validationErrors,
      });
    }

    const { name, username, email, password, phoneNumber, role } = req.body;

    
    const Model = role === 'admin' ? Admin : role === 'seller' ? Seller : Buyer;

    
    const userExists = await Model.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    
    const user = new Model({
      name,
      username,
      email,
      password,
      phoneNumber: role === 'admin' ? undefined : phoneNumber,
      role,
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.post('/signin', async (req, res) => {
  try {
    
    const validationErrors = validateSignin(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation error',
        details: validationErrors,
      });
    }

    const { email, password, role } = req.body;

    
    const Model = role === 'admin' ? Admin : role === 'seller' ? Seller : Buyer;

    
    const user = await Model.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or role' });
    }

    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = generateToken(user);

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;