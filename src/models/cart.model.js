const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity cannot be less than 1']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    }
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    items: [cartItemSchema],
    total: {
        type: Number,
        required: true,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 7 * 24 * 60 * 60
    }
});

cartSchema.methods.calculateTotal = function() {
    this.total = this.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    return this.total;
};

cartSchema.pre('save', function(next) {
    this.calculateTotal();
    next();
});

module.exports = mongoose.model('Cart', cartSchema);