const express = require('express');
const app = express();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
    console.log(`Test-URL: http://localhost:${PORT}/test`);
});