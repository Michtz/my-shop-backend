const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    updateStock,
    deleteProduct
} = require('../controllers/product.controller');

// basis route: /api/products
router.route('/')
    .get(getAllProducts)
    .post(createProduct);

router.route('/:id')
    .get(getProductById)
    .put(updateProduct)
    .delete(deleteProduct);

router.route('/:id/stock')
    .patch(updateStock);

module.exports = router;