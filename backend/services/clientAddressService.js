
import ClientAddress from '../models/ClientAddress.js';

/**
 * Service for client address CRUD operations
 */
const clientAddressService = {
  // Set a default address for a user (only one default per user)
  async setDefaultAddress(userId, addressId) {
    // First, unset all addresses for this user
    await ClientAddress.updateMany({ user: userId }, { isDefault: false });
    // Then, set the chosen address as default
    return await ClientAddress.findOneAndUpdate(
      { _id: addressId, user: userId },
      { isDefault: true },
      { new: true }
    );
  },
  // Create a new address
  async createAddress(data) {
    // Uniqueness check: For the same user, if recipient, phone, address, city, province, postal code, and country are all the same, treat as duplicate
    const exists = await ClientAddress.findOne({
      user: data.user,
      recipientName: data.recipientName,
      phone: data.phone,
      addressLine: data.addressLine,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
      country: data.country,
    });
    if (exists) {
      const error = new Error('Address already exists and cannot be added again');
      error.status = 409;
      throw error;
    }
    const address = new ClientAddress(data);
    return await address.save();
  },

  // Get all addresses for a user
  async getAddressesByUser(userId) {
    return await ClientAddress.find({ user: userId });
  },

  // Get a single address by id (and user)
  async getAddressById(id, userId) {
    return await ClientAddress.findOne({ _id: id, user: userId });
  },

  // Update an address
  async updateAddress(id, userId, updateData) {
    return await ClientAddress.findOneAndUpdate(
      { _id: id, user: userId },
      updateData,
      { new: true }
    );
  },

  // Delete an address
  async deleteAddress(id, userId) {
    return await ClientAddress.findOneAndDelete({ _id: id, user: userId });
  },

  // Search addresses by city and/or address label for a user
  async searchAddresses(userId, { city, addressLabel }) {
    const query = { user: userId };
    if (city) query.city = city;
    if (addressLabel) query.addressLabel = addressLabel;
    return await ClientAddress.find(query);
  },
  // Batch delete addresses by IDs for a user
  async batchDeleteAddresses(userId, addressIds) {
    return await ClientAddress.deleteMany({ user: userId, _id: { $in: addressIds } });
  },

  // Batch update addressLabel for multiple addresses
  async batchUpdateAddressLabel(userId, addressIds, newLabel) {
    return await ClientAddress.updateMany(
      { user: userId, _id: { $in: addressIds } },
      { addressLabel: newLabel }
    );
  },
};

export default clientAddressService;
