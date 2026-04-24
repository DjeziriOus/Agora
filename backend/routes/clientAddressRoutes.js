import express from 'express';
import clientAddressController from '../controllers/clientAddressController.js';
import { isBuyer, verifyToken } from '../middleware/auth.js';

const router = express.Router();

// All client address endpoints require an authenticated buyer.
router.use(verifyToken, isBuyer);

// Create a new address
router.post('/', clientAddressController.createAddress);

// Get all addresses for current user
router.get('/', clientAddressController.getAddresses);

// Search addresses by city and/or label
router.get('/search/advanced', clientAddressController.searchAddresses);

// Batch delete addresses
router.post('/batch/delete', clientAddressController.batchDeleteAddresses);

// Batch update address label
router.post('/batch/update-label', clientAddressController.batchUpdateAddressLabel);

// Set default address
router.post('/:id/default', clientAddressController.setDefaultAddress);

// Get a single address by id
router.get('/:id', clientAddressController.getAddressById);

// Update an address
router.put('/:id', clientAddressController.updateAddress);

// Delete an address
router.delete('/:id', clientAddressController.deleteAddress);

export default router;
