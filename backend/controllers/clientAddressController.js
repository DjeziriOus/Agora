/**
 * @file Handlers HTTP des routes `/api/addresses/*` (adresses de livraison).
 *
 * Voir aussi : docs/modules/backend/controllers-clientAddressController.md
 *
 * NOTE : ce fichier utilise une convention différente du reste du projet —
 * export default d'un objet avec toutes les méthodes, plutôt que des exports
 * nommés. Idem pour `clientAddressService`.
 */

import clientAddressService from '../services/clientAddressService.js';

/**
 * Objet regroupant tous les handlers HTTP pour les adresses client.
 *
 * @type {Record<string, (req: import('express').Request, res: import('express').Response) => Promise<void>>}
 */
const clientAddressController = {
  /**
   * Crée une nouvelle adresse pour l'utilisateur connecté.
   * Route : `POST /api/addresses`
   * 409 si une adresse identique (champs normalisés) existe déjà.
   */
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

  /**
   * Liste toutes les adresses de l'utilisateur connecté.
   * Route : `GET /api/addresses`
   */
  async getAddresses(req, res) {
    try {
      console.log('req.user.id:', req.user.id);
      const addresses = await clientAddressService.getAddressesByUser(req.user.id);
      res.status(200).json(addresses);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  /**
   * Détail d'une adresse (scopée à l'utilisateur connecté).
   * Route : `GET /api/addresses/:id`
   */
  async getAddressById(req, res) {
    try {
      const address = await clientAddressService.getAddressById(req.params.id, req.user.id);
      if (!address) return res.status(404).json({ error: 'Address not found' });
      res.status(200).json(address);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  /**
   * Met à jour une adresse. 409 si l'update créerait un doublon avec une autre adresse.
   * Route : `PUT /api/addresses/:id`
   */
  async updateAddress(req, res) {
    try {
      const address = await clientAddressService.updateAddress(req.params.id, req.user.id, req.body);
      if (!address) return res.status(404).json({ error: 'Address not found' });
      res.status(200).json(address);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  /**
   * Supprime une adresse.
   * Route : `DELETE /api/addresses/:id`
   */
  async deleteAddress(req, res) {
    try {
      const result = await clientAddressService.deleteAddress(req.params.id, req.user.id);
      if (!result) return res.status(404).json({ error: 'Address not found' });
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  /**
   * Marque une adresse comme défaut (et désactive le défaut des autres).
   * Route : `POST /api/addresses/:id/default`
   */
  async setDefaultAddress(req, res) {
    try {
      const address = await clientAddressService.setDefaultAddress(req.user.id, req.params.id);
      if (!address) return res.status(404).json({ error: 'Address not found' });
      res.status(200).json(address);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  /**
   * Recherche d'adresses par ville et/ou label.
   * Route : `GET /api/addresses/search/advanced?city=&addressLabel=`
   */
  async searchAddresses(req, res) {
    try {
      const { city, addressLabel } = req.query;
      const addresses = await clientAddressService.searchAddresses(req.user.id, { city, addressLabel });
      res.status(200).json(addresses);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  /**
   * Supprime plusieurs adresses en une seule requête.
   * Route : `POST /api/addresses/batch/delete`
   * Body : `{ addressIds: string[] }`
   */
  async batchDeleteAddresses(req, res) {
    try {
      const { addressIds } = req.body; // tableau d'IDs
      await clientAddressService.batchDeleteAddresses(req.user.id, addressIds);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  /**
   * Met à jour le label de plusieurs adresses en une seule requête.
   * Route : `POST /api/addresses/batch/update-label`
   * Body : `{ addressIds: string[], newLabel: string }`
   */
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
