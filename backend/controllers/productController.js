import productService from "../services/productService.js";

// POST /api/products
// Create a new product (seller only, at least 1 image required).
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

// PUT /api/products/:id
// Update product text fields and manage images (keep/add/remove).
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

// DELETE /api/products/:id
// Soft-delete a product and clean up its images from Cloudinary.
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

// GET /api/products
// Public catalogue search/listing.
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

// GET /api/products/:id
// Return one active, non-deleted product for the public product page.
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

// GET /api/products/mine/:id
// Return one seller-owned product for the edit page, even if it is inactive.
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

// GET /api/products/mine
// Return seller-owned products with optional search/filter/pagination query params.
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
