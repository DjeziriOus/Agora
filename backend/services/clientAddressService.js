
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
    // Helper to normalize string: lower case, remove spaces and dashes
    function normalize(str) {
      return (str || "").toLowerCase().replace(/[-\s]/g, "");
    }
    // Prepare normalized fields
    const normalized = {
      recipientNameNormalized: normalize(data.recipientName),
      phoneNormalized: normalize(data.phone),
      addressLineNormalized: normalize(data.addressLine),
      cityNormalized: normalize(data.city),
      provinceNormalized: normalize(data.province),
      postalCodeNormalized: normalize(data.postalCode),
      countryNormalized: normalize(data.country),
    };
    // Uniqueness check: For the same user, if all normalized fields are the same, treat as duplicate
    const exists = await ClientAddress.findOne({
      user: data.user,
      ...normalized
    });
    if (exists) {
      const error = new Error('Address already exists and cannot be added again');
      error.status = 409;
      throw error;
    }
    const address = new ClientAddress({
      ...data,
      ...normalized
    });
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
    // Helper to normalize string: lower case, remove spaces and dashes
    function normalize(str) {
      return (str || "").toLowerCase().replace(/[-\s]/g, "");
    }
    // Prepare normalized fields
    const normalized = {
      recipientNameNormalized: normalize(updateData.recipientName),
      phoneNormalized: normalize(updateData.phone),
      addressLineNormalized: normalize(updateData.addressLine),
      cityNormalized: normalize(updateData.city),
      provinceNormalized: normalize(updateData.province),
      postalCodeNormalized: normalize(updateData.postalCode),
      countryNormalized: normalize(updateData.country),
    };
    
    const exists = await ClientAddress.findOne({
      user: userId,
      ...normalized,
      _id: { $ne: id }
    });
    if (exists) {
      const error = new Error('Address already exists and cannot be updated to duplicate');
      error.status = 409;
      throw error;
    }
    return await ClientAddress.findOneAndUpdate(
      { _id: id, user: userId },
      { ...updateData, ...normalized },
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
