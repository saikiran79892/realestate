const express = require('express');

const router = express.Router();
const jwt = require('jsonwebtoken');
const Property = require('../models/Property');
const Admin = require('../models/Admin');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};


router.get('/properties', verifyToken, async (req, res) => {
  try {
    const properties = await Property.find()
      .populate('createdBy', 'name email')
      .select('title propertyType price address beds baths sqft landArea zoning floorNumber totalFloors imageUrl createdAt createdBy createdByModel status isApproved')
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Error fetching properties' });
  }
});


router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    
    const totalProperties = await Property.find().count();

    
    const totalBuyers = await Buyer.find().count();
    const totalSellers = await Seller.find().count();
    const totalUsers = totalBuyers + totalSellers;

    
    const recentProperties = await Property.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title location price status isApproved');

    
    const recentBuyers = await Buyer.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name email role');

    const recentSellers = await Seller.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .select('name email role');

    const recentUsers = [...recentBuyers, ...recentSellers]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    res.json({
      totalProperties,
      totalUsers,
      recentProperties,
      recentUsers
    });

  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});


router.get('/profile', verifyToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (admin) {
      res.json(admin);
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching profile.' });
  }
});


router.put('/profile', verifyToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    
    const { name, username, email } = req.body;

    if (email && email !== admin.email) {
      const emailExists = await Admin.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
    }
    
    if (username && username !== admin.username) {
      const usernameExists = await Admin.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    admin.name = name || admin.name;
    admin.username = username || admin.username;
    admin.email = email || admin.email;
    
    const updatedAdmin = await admin.save();

    
    res.json({
      _id: updatedAdmin._id,
      name: updatedAdmin.name,
      username: updatedAdmin.username,
      email: updatedAdmin.email,
      role: updatedAdmin.role,
      createdAt: updatedAdmin.createdAt,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error while updating profile.' });
  }
});


router.put('/properties/:id', verifyToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const propertyData = {
      ...req.body,
    };

    
    const requiredFields = ['title', 'propertyType', 'price', 'address'];
    const missingFields = requiredFields.filter(field => !propertyData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        fields: missingFields 
      });
    }

    
    if (propertyData.propertyType === 'house') {
      if (!propertyData.beds || !propertyData.baths || !propertyData.sqft) {
        return res.status(400).json({ 
          message: 'Missing required fields for house property',
          required: ['beds', 'baths', 'sqft']
        });
      }
    } else if (propertyData.propertyType === 'land') {
      if (!propertyData.landArea || !propertyData.zoning) {
        return res.status(400).json({
          message: 'Missing required fields for land property',
          required: ['landArea', 'zoning']
        });
      }
    } else if (propertyData.propertyType === 'apartment') {
      if (!propertyData.floorNumber || !propertyData.totalFloors) {
        return res.status(400).json({
          message: 'Missing required fields for apartment property',
          required: ['floorNumber', 'totalFloors']
        });
      }
    }

    
    if (propertyData.status && !['approved', 'pending', 'rejected'].includes(propertyData.status)) {
      return res.status(400).json({
        message: 'Invalid status value',
        allowed: ['approved', 'pending', 'rejected']
      });
    }

    
    Object.assign(property, propertyData);
    const updatedProperty = await property.save();

    res.json(updatedProperty);
  } catch (error) {
    console.error('Error updating property:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Error updating property' });
  }
});


router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const { currentPassword, newPassword } = req.body;

    
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    
    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ message: 'Server error while updating password' });
  }
});


router.post('/properties', verifyToken, async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      createdBy: req.user.id,
      createdByModel: 'Admin',
      status: 'approved' 
    };
    
    
    const requiredFields = ['title', 'propertyType', 'price', 'address'];
    const missingFields = requiredFields.filter(field => !propertyData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        fields: missingFields 
      });
    }

    
    if (propertyData.propertyType === 'house') {
      if (!propertyData.beds || !propertyData.baths || !propertyData.sqft) {
        return res.status(400).json({ 
          message: 'Missing required fields for house property',
          required: ['beds', 'baths', 'sqft']
        });
      }
    } else if (propertyData.propertyType === 'land') {
      if (!propertyData.landArea || !propertyData.zoning) {
        return res.status(400).json({
          message: 'Missing required fields for land property',
          required: ['landArea', 'zoning']
        });
      }
    } else if (propertyData.propertyType === 'apartment') {
      if (!propertyData.floorNumber || !propertyData.totalFloors) {
        return res.status(400).json({
          message: 'Missing required fields for apartment property',
          required: ['floorNumber', 'totalFloors']
        });
      }
    }

    const newProperty = new Property(propertyData);
    await newProperty.save();
    res.status(201).json(newProperty);
  } catch (error) {
    console.error('Error creating property:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Error creating property' });
  }
});


router.delete('/properties/:id', verifyToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    
    if (req.user.role !== 'admin' && property.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ message: 'Error deleting property' });
  }
});



router.get('/properties/:id', verifyToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ message: 'Error fetching property' });
  }
});



router.get('/buyers/all', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const buyers = await Buyer.find(query)
      .select('-password') 
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Buyer.countDocuments(query);

    res.json({
      data: buyers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    console.error('Error fetching buyers:', error);
    res.status(500).json({ message: 'Error fetching buyers' });
  }
});


router.get('/buyers/:id', verifyToken, async (req, res) => {
  try {
    

    const buyer = await Buyer.findById(req.params.id).select('-password');
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    res.json(buyer);
  } catch (error) {
    console.error('Error fetching buyer:', error);
    res.status(500).json({ message: 'Error fetching buyer' });
  }
});


router.post('/buyers/add', verifyToken, async (req, res) => {
  try {
    
    const requiredFields = ['name', 'email', 'username', 'password', 'phoneNumber'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: missingFields
      });
    }

    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(req.body.phoneNumber)) {
      return res.status(400).json({
        message: 'Validation error',
        errors: ['Please enter a valid 10-digit phone number']
      });
    }

    
    const { email, username } = req.body;
    const existingBuyer = await Buyer.findOne({ $or: [{ email }, { username }] });
    if (existingBuyer) {
      const field = existingBuyer.email === email ? 'email' : 'username';
      return res.status(409).json({ message: `Buyer with this ${field} already exists` });
    }

    
    const newBuyer = new Buyer({
      name: req.body.name,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
      role: 'buyer' 
    });

    const savedBuyer = await newBuyer.save();

    
    const buyerResponse = savedBuyer.toObject();
    delete buyerResponse.password;

    res.status(201).json(buyerResponse);
  } catch (error) {
    console.error('Error creating buyer:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Error creating buyer' });
  }
});


router.put('/buyers/update/:id', verifyToken, async (req, res) => {
  try {
    
  

    const buyer = await Buyer.findById(req.params.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    
    const { email, username } = req.body;
    if (email && email !== buyer.email) {
      if (await Buyer.findOne({ email })) {
        return res.status(409).json({ message: 'Email already in use by another buyer' });
      }
    }
    if (username && username !== buyer.username) {
      if (await Buyer.findOne({ username })) {
        return res.status(409).json({ message: 'Username already in use by another buyer' });
      }
    }

    
    if (req.body.role) {
      delete req.body.role;
    }

    
    Object.assign(buyer, req.body);
    const updatedBuyer = await buyer.save();

    
    const buyerResponse = updatedBuyer.toObject();
    delete buyerResponse.password;

    res.json(buyerResponse);
  } catch (error) {
    console.error('Error updating buyer:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message),
      });
    }
    res.status(500).json({ message: 'Error updating buyer' });
  }
});


router.delete('/buyers/delete/:id', verifyToken, async (req, res) => {
  try {
    
    
    const buyer = await Buyer.findById(req.params.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    await Buyer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Buyer deleted successfully' });
  } catch (error) {
    console.error('Error deleting buyer:', error);
    res.status(500).json({ message: 'Error deleting buyer' });
  }
});


router.get('/sellers', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const sellers = await Seller.find(query)
      .select('-password') 
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    
    const sellersWithProperties = await Promise.all(
      sellers.map(async (seller) => {
        const properties = await Property.find({ seller: seller._id });
        return {
          ...seller.toObject(),
          properties: properties
        };
      })
    );

    const total = await Seller.countDocuments(query);

    res.json({
      data: sellersWithProperties,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ message: 'Error fetching sellers' });
  }
});


router.get('/seller/properties/:sellerId', verifyToken, async (req, res) => {
  try {
    
  

    
    const seller = await Seller.findById(req.params.sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    
    const properties = await Property
      .find({ seller: req.params.sellerId })
      .sort({ createdAt: -1 });

    res.json({
      seller: {
        _id: seller._id,
        name: seller.name,
        email: seller.email
      },
      properties: properties
    });
  } catch (error) {
    console.error('Error fetching seller properties:', error);
    res.status(500).json({ message: 'Error fetching seller properties' });
  }
});



router.get('/sellers/:id', verifyToken, async (req, res) => {
  try {
    
   

    const seller = await Seller.findById(req.params.id).select('-password');
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    
    const properties = await Property.find({ seller: req.params.id });
    
    res.json({
      ...seller.toObject(),
      properties: properties
    });
  } catch (error) {
    console.error('Error fetching seller:', error);
    res.status(500).json({ message: 'Error fetching seller' });
  }
});


router.post('/sellers', verifyToken, async (req, res) => {
  try {
    
    const requiredFields = ['name', 'email', 'username', 'password', 'phoneNumber'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: missingFields
      });
    }

    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(req.body.phoneNumber)) {
      return res.status(400).json({
        message: 'Validation error',
        errors: ['Please enter a valid 10-digit phone number']
      });
    }

    
    const { email, username } = req.body;
    const existingSeller = await Seller.findOne({ $or: [{ email }, { username }] });
    if (existingSeller) {
      const field = existingSeller.email === email ? 'email' : 'username';
      return res.status(409).json({ message: `Seller with this ${field} already exists` });
    }

    
    const newSeller = new Seller({
      name: req.body.name,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
      role: 'seller' 
    });

    const savedSeller = await newSeller.save();

    
    const sellerResponse = savedSeller.toObject();
    delete sellerResponse.password;

    res.status(201).json(sellerResponse);
  } catch (error) {
    console.error('Error creating seller:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Error creating seller' });
  }
});


router.put('/sellers/:id', verifyToken, async (req, res) => {
  try {
    
    

    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    
    const { email, username } = req.body;
    if (email && email !== seller.email) {
      if (await Seller.findOne({ email })) {
        return res.status(409).json({ message: 'Email already in use by another seller' });
      }
    }
    if (username && username !== seller.username) {
      if (await Seller.findOne({ username })) {
        return res.status(409).json({ message: 'Username already in use by another seller' });
      }
    }

    
    if (req.body.role) {
      delete req.body.role;
    }

    
    Object.assign(seller, req.body);
    const updatedSeller = await seller.save();

    
    const sellerResponse = updatedSeller.toObject();
    delete sellerResponse.password;

    res.json(sellerResponse);
  } catch (error) {
    console.error('Error updating seller:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message),
      });
    }
    res.status(500).json({ message: 'Error updating seller' });
  }
});


router.delete('/sellers/:id', verifyToken, async (req, res) => {
  try {
    
   

    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    
    const hasAssociatedProperties = await Property.exists({ seller: req.params.id });
    if (hasAssociatedProperties) {
      return res.status(400).json({
        message: 'Cannot delete seller with associated properties. Please reassign or delete them first.',
      });
    }

    await Seller.findByIdAndDelete(req.params.id);
    res.json({ message: 'Seller deleted successfully' });
  } catch (error) {
    console.error('Error deleting seller:', error);
    res.status(500).json({ message: 'Error deleting seller' });
  }
});


module.exports = router;
