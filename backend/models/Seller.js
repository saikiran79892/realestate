
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\+?[\d\s()-]{10,}$/, 'Please enter a valid phone number'],
  },
  role: {
    type: String,
    default: 'seller',
    immutable: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


sellerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


sellerSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Seller', sellerSchema);