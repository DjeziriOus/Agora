/**
 * @file Routes adresses de livraison (carnet client acheteur).
 * Voir aussi : docs/modules/backend/routes-clientAddressRoutes.md
 *
 * @swagger
 * tags:
 *   - name: Addresses
 *     description: Carnet d'adresses de livraison de l'acheteur
 *
 * @swagger
 * /api/addresses:
 *   get:
 *     tags: [Addresses]
 *     summary: Liste les adresses de l'utilisateur
 *     responses: { 200: { description: Liste } }
 *   post:
 *     tags: [Addresses]
 *     summary: Crée une nouvelle adresse
 *     responses: { 201: { description: Créée }, 409: { description: Doublon } }
 *
 * /api/addresses/{id}:
 *   get:
 *     tags: [Addresses]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Adresse } }
 *   put:
 *     tags: [Addresses]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Mise à jour }, 409: { description: Doublon } }
 *   delete:
 *     tags: [Addresses]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Supprimée } }
 *
 * /api/addresses/{id}/default:
 *   post:
 *     tags: [Addresses]
 *     summary: Marque cette adresse comme adresse par défaut
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: OK } }
 *
 * /api/addresses/search/advanced:
 *   get:
 *     tags: [Addresses]
 *     summary: Recherche par ville et/ou label
 *     responses: { 200: { description: Résultats } }
 *
 * /api/addresses/batch/delete:
 *   post:
 *     tags: [Addresses]
 *     summary: Supprime plusieurs adresses
 *     responses: { 200: { description: OK } }
 *
 * /api/addresses/batch/update-label:
 *   post:
 *     tags: [Addresses]
 *     summary: Met à jour le label de plusieurs adresses
 *     responses: { 200: { description: OK } }
 */

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
