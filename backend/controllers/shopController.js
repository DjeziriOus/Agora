/**
 * @file Handlers HTTP des routes `/api/shops/*`.
 *
 * Voir aussi : docs/modules/backend/controllers-shopController.md
 */

import shopService from "../services/shopService.js";

/**
 * Crée une nouvelle boutique pour le vendeur connecté (avec logo + bannière optionnels).
 *
 * Route : `POST /api/shops`
 * Body (multipart) : `name, description?, contactEmail?, contactPhone?, contactAddress?, status?, logo (fichier), banner (fichier)`
 *
 * Erreurs :
 *   - 403 si email non vérifié et `REQUIRE_EMAIL_VERIFICATION` actif
 *   - 409 si le vendeur a déjà une boutique
 *   - 409 si le nom est déjà pris
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const createShop = async (req, res) => {
  try {
    console.log(req.body);
    const {
      name,
      description,
      contactEmail,
      contactPhone,
      contactAddress,
      status,
    } = req.body;

    const shop = await shopService.createShop({
      ownerId: req.user.id,
      emailVerified: req.user.emailVerified,
      name,
      description,
      contactEmail,
      contactPhone,
      contactAddress,
      status,
      files: req.files || {},
    });

    return res.status(201).json({
      message: "Shop created successfully.",
      shop,
    });
  } catch (error) {
    console.error("createShop error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error.",
    });
  }
};

/**
 * Met à jour la boutique du vendeur. Vérifie l'ownership avant tout (le vendeur ne
 * peut modifier que SA boutique).
 *
 * Route : `PUT /api/shops/:id`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const updateShop = async (req, res) => {
  try {
    const shop = await shopService.updateShop({
      shopId: req.params.id,
      ownerId: req.user.id,
      updateData: req.body,
      files: req.files || {},
    });

    return res.status(200).json({
      message: "Boutique mise à jour avec succès.",
      shop,
    });
  } catch (error) {
    console.error("updateShop error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error.",
    });
  }
};

/**
 * Détail public d'une boutique par son slug (URL lisible).
 *
 * Route : `GET /api/shops/:slug`
 *
 * @param {import('express').Request} req - `req.params.slug` malgré le nom de fonction trompeur
 * @param {import('express').Response} res
 */
export const getShopById = async (req, res) => {
  try {
    const shop = await shopService.getShopBySlug(req.params.slug);
    res.status(200).json(shop);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * Liste paginée des produits publics d'une boutique.
 *
 * Route : `GET /api/shops/:slug/products`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getShopProducts = async (req, res) => {
  try {
    const result = await shopService.getShopProductsBySlug(req.params.slug, req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * Renvoie la boutique du vendeur connecté (ou null s'il n'en a pas).
 *
 * Route : `GET /api/shops/my`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getMyShop = async (req, res) => {
  try {
    console.log("req.user.id", req.user.id);
    const shop = await shopService.getMyShop(req.user.id);
    res.status(200).json(shop);
  } catch (error) {
    console.error("getMyShop error:", error.message);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * Statistiques globales du vendeur (CA, commandes, produits actifs).
 *
 * Route : `GET /api/shops/my/stats`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getVendorStats = async (req, res) => {
  try {
    const stats = await shopService.getVendorStats(req.user.id);
    res.status(200).json(stats);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * Statistiques de stock (inStock / lowStock / outOfStock) par variante.
 *
 * Route : `GET /api/shops/my/stock-stats`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getStockStats = async (req, res) => {
  try {
    const stats = await shopService.getStockStats(req.user.id);
    res.status(200).json(stats);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};
