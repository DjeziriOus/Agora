import express from 'express';
import clientAddressController from '../controllers/clientAddressController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Create a new address
router.post('/', verifyToken, clientAddressController.createAddress);

// Get all addresses for current user
router.get('/', verifyToken, clientAddressController.getAddresses);

// Search addresses by city and/or label
router.get('/search/advanced', verifyToken, clientAddressController.searchAddresses);

// Batch delete addresses
router.post('/batch/delete', verifyToken, clientAddressController.batchDeleteAddresses);

// Batch update address label
router.post('/batch/update-label', verifyToken, clientAddressController.batchUpdateAddressLabel);

// Set default address
router.post('/:id/default', verifyToken, clientAddressController.setDefaultAddress);

// Get a single address by id
router.get('/:id', verifyToken, clientAddressController.getAddressById);

// Update an address
router.put('/:id', verifyToken, clientAddressController.updateAddress);

// Delete an address
router.delete('/:id', verifyToken, clientAddressController.deleteAddress);

export default router;