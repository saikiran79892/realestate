
const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  propertyType: {
    type: String,
    required: [true, 'Property type is required'],
    enum: ['house', 'land', 'apartment'],
  },
  price: {
    type: String,
    required: [true, 'Price is required'],
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['approved', 'pending', 'rejected'],
    default: 'pending',
  },
  
  beds: {
    type: Number,
    required: function() { return this.propertyType === 'house'; },
  },
  baths: {
    type: Number, 
    required: function() { return this.propertyType === 'house'; },
  },
  sqft: {
    type: String,
    required: function() { return this.propertyType === 'house'; },
    trim: true,
  },
  
  landArea: {
    type: String,
    required: function() { return this.propertyType === 'land'; },
    trim: true,
  },
  zoning: {
    type: String,
    required: function() { return this.propertyType === 'land'; },
    trim: true,
  },
  
  floorNumber: {
    type: Number,
    required: function() { return this.propertyType === 'apartment'; },
  },
  totalFloors: {
    type: Number,
    required: function() { return this.propertyType === 'apartment'; },
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
    required: [true, 'Created by is required'],
  },
  createdByModel: {
    type: String,
    required: true,
    enum: ['Admin', 'Seller'],
  },
  interested: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Property', propertySchema);