import clientAddressService from '../services/clientAddressService.js';

/**
 * Controller for client address endpoints
 */
const clientAddressController = {
  // Create a new address
  async createAddress(req, res) {
    try {
      console.log('req.user:', req.user);
      const data = { ...req.body, user: req.user.id };
      const address = await clientAddressService.createAddress(data);
      res.status(201).json(address);
    } catch (err) {
      if (err.status === 409) {
        res.status(409).json({ error: err.message });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  },

  // Get all addresses for the current user
  async getAddresses(req, res) {
    try {
      console.log('req.user.id:', req.user.id);
      const addresses = await clientAddressService.getAddressesByUser(req.user.id);
      res.status(200).json(addresses);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Get a single address by id
  async getAddressById(req, res) {
    try {
      const address = await clientAddressService.getAddressById(req.params.id, req.user.id);
      if (!address) return res.status(404).json({ error: 'Address not found' });
      res.status(200).json(address);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Update an address
  async updateAddress(req, res) {
    try {
      const address = await clientAddressService.updateAddress(req.params.id, req.user.id, req.body);
      if (!address) return res.status(404).json({ error: 'Address not found' });
      res.status(200).json(address);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Delete an address
  async deleteAddress(req, res) {
    try {
      const result = await clientAddressService.deleteAddress(req.params.id, req.user.id);
      if (!result) return res.status(404).json({ error: 'Address not found' });
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Set default address
  async setDefaultAddress(req, res) {
    try {
      const address = await clientAddressService.setDefaultAddress(req.user.id, req.params.id);
      if (!address) return res.status(404).json({ error: 'Address not found' });
      res.status(200).json(address);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Search addresses by city and/or label
  async searchAddresses(req, res) {
    try {
      const { city, addressLabel } = req.query;
      const addresses = await clientAddressService.searchAddresses(req.user.id, { city, addressLabel });
      res.status(200).json(addresses);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Batch delete addresses
  async batchDeleteAddresses(req, res) {
    try {
      const { addressIds } = req.body; // expects array of ids
      await clientAddressService.batchDeleteAddresses(req.user.id, addressIds);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Batch update address label
  async batchUpdateAddressLabel(req, res) {
    try {
      const { addressIds, newLabel } = req.body;
      await clientAddressService.batchUpdateAddressLabel(req.user.id, addressIds, newLabel);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};

export default clientAddressController;
