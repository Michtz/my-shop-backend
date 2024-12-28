const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // Verknüpfung mit dem Benutzer, der die Bestellung aufgegeben hat
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Array der bestellten Produkte mit ihren Details
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1']
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative']
        }
    }],

    // Gesamtbetrag der Bestellung
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative']
    },

    // Lieferadresse für die Bestellung
    shippingAddress: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        }
    },

    // Status der Bestellung im System
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },

    // Status der Zahlung
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },

    // Optionale Notizen zur Bestellung
    notes: {
        type: String,
        trim: true
    },

    // Tracking-Nummer für den Versand
    trackingNumber: {
        type: String,
        trim: true
    },

    // Geschätztes Lieferdatum
    estimatedDelivery: {
        type: Date
    }
}, {
    // Automatisch Zeitstempel für Erstellung und Aktualisierung hinzufügen
    timestamps: true
});

// Methode zum Berechnen des Gesamtbetrags
orderSchema.methods.calculateTotal = function() {
    this.totalAmount = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
};

// Methode zum Aktualisieren des Bestellstatus
orderSchema.methods.updateStatus = async function(newStatus) {
    if (this.status !== newStatus) {
        this.status = newStatus;
        this.lastUpdated = Date.now();
        await this.save();
    }
};

// Index für schnelle Suche nach Bestellungen eines Benutzers
orderSchema.index({ userId: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;