/**
 * @file Service métier des adresses de livraison (carnet client).
 *
 * Particularité : chaque champ d'adresse a une version `*Normalized` (minuscules,
 * sans espaces ni tirets) qui sert à détecter les doublons. La création / mise
 * à jour calcule ces normalisations à la volée.
 *
 * NOTE : ce service utilise `error.status` (et pas `error.statusCode` comme
 * les autres). Le contrôleur le gère explicitement.
 *
 * Voir aussi : docs/modules/backend/services-clientAddressService.md
 */

import ClientAddress from '../models/ClientAddress.js';

/**
 * Objet exposant les opérations CRUD + batch sur les adresses client.
 *
 * @type {Object}
 */
const clientAddressService = {
  /**
   * Marque une adresse comme défaut pour un user, et désactive le défaut
   * sur toutes les autres adresses du même user.
   * @param {string} userId
   * @param {string} addressId
   * @returns {Promise<import('mongoose').Document|null>}
   */
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
  /**
   * Crée une adresse. Lance une erreur 409 si une adresse strictement
   * identique (champs normalisés) existe déjà chez ce user.
   * @param {Object} data - champs d'adresse + `user`
   * @returns {Promise<import('mongoose').Document>}
   */
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

  /**
   * Liste toutes les adresses d'un utilisateur.
   * @param {string} userId
   * @returns {Promise<import('mongoose').Document[]>}
   */
  async getAddressesByUser(userId) {
    return await ClientAddress.find({ user: userId });
  },

  /**
   * Détail d'une adresse, scopée à l'utilisateur (sécurité).
   * @param {string} id
   * @param {string} userId
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async getAddressById(id, userId) {
    return await ClientAddress.findOne({ _id: id, user: userId });
  },

  /**
   * Met à jour une adresse + recalcule les champs normalisés.
   * Lance une erreur 409 si l'update créerait un doublon avec une autre adresse.
   * @param {string} id
   * @param {string} userId
   * @param {Object} updateData
   * @returns {Promise<import('mongoose').Document|null>}
   */
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

  /**
   * Supprime une adresse (delete réel, pas soft delete).
   * @param {string} id
   * @param {string} userId
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async deleteAddress(id, userId) {
    return await ClientAddress.findOneAndDelete({ _id: id, user: userId });
  },

  /**
   * Recherche d'adresses filtrée par ville et/ou label.
   * @param {string} userId
   * @param {{ city?: string, addressLabel?: string }} filters
   * @returns {Promise<import('mongoose').Document[]>}
   */
  async searchAddresses(userId, { city, addressLabel }) {
    const query = { user: userId };
    if (city) query.city = city;
    if (addressLabel) query.addressLabel = addressLabel;
    return await ClientAddress.find(query);
  },
  /**
   * Supprime plusieurs adresses en une seule requête.
   * @param {string} userId
   * @param {string[]} addressIds
   */
  async batchDeleteAddresses(userId, addressIds) {
    return await ClientAddress.deleteMany({ user: userId, _id: { $in: addressIds } });
  },

  /**
   * Met à jour le label de plusieurs adresses en une seule requête.
   * @param {string} userId
   * @param {string[]} addressIds
   * @param {string} newLabel
   */
  async batchUpdateAddressLabel(userId, addressIds, newLabel) {
    return await ClientAddress.updateMany(
      { user: userId, _id: { $in: addressIds } },
      { addressLabel: newLabel }
    );
  },
};

export default clientAddressService;
