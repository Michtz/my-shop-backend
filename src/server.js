const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/test', (req, res) => {
    res.json({ message: 'backend is working' });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to myShop',
        endpoints: {
            test: '/test',
            products: '/api/products'
        }
    });
});

const productRoutes = require('./routes/product.routes');
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`server is running on port: ${PORT}`);
            console.log('MongoDB is connected');
        });
    })
    .catch(err => console.error('MongoDB error:', err));

const cartRoutes = require('./routes/cart.routes');
app.use('/api/cart', cartRoutes);

const orderRoutes = require('./routes/order.routes');
app.use('/api/orders', orderRoutes);