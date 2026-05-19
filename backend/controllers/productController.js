/**
 * @file Handlers HTTP des routes `/api/products/*`.
 *
 * Voir aussi : docs/modules/backend/controllers-productController.md
 */

import productService from "../services/productService.js";

/**
 * Crée un nouveau produit avec ses variantes et au moins 1 image.
 *
 * Route : `POST /api/products`
 * Body (multipart) : `name, description, category, stockThreshold?, variants (JSON string), images (fichiers)`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct({
      ownerId: req.user.id,
      body: req.body,
      files: req.files || [],
    });

    return res.status(201).json({
      message: "Produit créé avec succès.",
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error." });
  }
};

/**
 * Met à jour un produit existant : champs texte, variantes (upsert + delete-by-diff),
 * gestion des images (`keepImages` + nouveaux fichiers).
 *
 * Route : `PUT /api/products/:id`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct({
      ownerId: req.user.id,
      productId: req.params.id,
      body: req.body,
      files: req.files || [],
    });

    return res.status(200).json({
      message: "Produit mis à jour avec succès.",
      product,
    });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error." });
  }
};

/**
 * Soft-delete un produit (`isDeleted: true`) + désactive ses variantes
 * + supprime ses images Cloudinary.
 *
 * Route : `DELETE /api/products/:id`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct({
      ownerId: req.user.id,
      productId: req.params.id,
    });

    return res.status(200).json({
      message: "Produit supprimé avec succès.",
    });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error." });
  }
};

/**
 * Listing public du catalogue, paginé et filtré.
 *
 * Route : `GET /api/products`
 * Query : `q?, search?, category?, minPrice?, maxPrice?, sort?, page?, limit?`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getProducts = async (req, res) => {
  try {
    const result = await productService.getProducts(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error." });
  }
};

/**
 * Détail public d'un produit (404 s'il est inactif ou supprimé).
 *
 * Route : `GET /api/products/:id`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return res.status(200).json(product);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error." });
  }
};

/**
 * Détail produit côté vendeur — inclut les produits inactifs (mais pas supprimés).
 *
 * Route : `GET /api/products/mine/:id`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getMyProductById = async (req, res) => {
  try {
    const product = await productService.getMyProductById({
      ownerId: req.user.id,
      productId: req.params.id,
    });
    return res.status(200).json(product);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error." });
  }
};

/**
 * Inventaire vendeur paginé avec filtres (recherche, isActive, lowStock).
 *
 * Route : `GET /api/products/mine`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getMyProducts = async (req, res) => {
  try {
    const result = await productService.getMyProducts({
      ownerId: req.user.id,
      query: req.query,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error." });
  }
};
