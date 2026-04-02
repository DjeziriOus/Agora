import productService from "../services/productService.js";

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

// PATCH /api/products/:id/stock
// Update one seller-owned product stock (non-negative integer only).
export const updateProductStock = async (req, res) => {
	try {
		if (req.body?.stock === undefined) {
			return res.status(400).json({ message: "stock is required." });
		}

		const product = await productService.updateProductStock({
			ownerId: req.user.id,
			productId: req.params.id,
			stock: req.body.stock,
		});

		return res.status(200).json({
			message: "Stock updated successfully.",
			product,
		});
	} catch (error) {
		return res
			.status(error.statusCode || 500)
			.json({ message: error.message || "Internal server error." });
	}
};
