require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Kết nối PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Middleware để parse JSON
app.use(express.json());

// Enable CORS for all origins
app.use(cors());

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// Middleware để hiển thị Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API lấy danh sách Collections
app.get('/api/v1/collections', async (req, res) => {
    try {
        const query = `SELECT * FROM collections ORDER BY created_date DESC`;
        const result = await pool.query(query);

        res.json({ Success: true, Data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Success: false, Message: 'Internal server error' });
    }
});

// API cập nhật status của offer
app.put('/api/v1/offer/status-update', async (req, res) => {
    const { AdsId, UserId, ActionType } = req.body;

    if (!AdsId || !UserId || !ActionType) {
        return res.status(400).json({ Success: false, Message: 'Missing required fields' });
    }

    try {
        const query = `
      UPDATE offers
      SET status = $1
      WHERE ads_id = $2 AND user_id = $3
    `;
        const values = [ActionType, AdsId, UserId];
        await pool.query(query, values);

        res.json({ Success: true, Data: {} });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Success: false, Message: 'Internal server error' });
    }
});

// API tạo Ads
app.post('/api/v1/ads', async (req, res) => {
    const { Name, ShortDescription, Description } = req.body;

    if (!Name || !ShortDescription || !Description) {
        return res.status(400).json({ Success: false, Message: 'Missing required fields' });
    }

    try {
        const query = `
      INSERT INTO ads (id, name, type, shortdescription, description, ImageUrl, SellerId, LocationDistance, Status, CreatedDate)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
        const values = [Name, ShortDescription, Description];
        const result = await pool.query(query, values);

        res.json({ Success: true, Data: { AdsId: result.rows[0].id } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Success: false, Message: 'Internal server error' });
    }
});

// API lấy danh sách Ads
app.get('/api/v1/ads/get-all', async (req, res) => {
    try {
        const query = `SELECT * FROM ads a INNER JOIN collections c ON a.collection_id = c.id INNER JOIN users u ON a.sellerid = u.id ORDER BY created_at DESC`;
        const result = await pool.query(query);

        res.json({ Success: true, Data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Success: false, Message: 'Internal server error' });
    }
});

// API lấy thông tin chi tiết của một Ads
app.get('/api/v1/ads/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = `SELECT * FROM ads WHERE id = $1`;
        const values = [id];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ Success: false, Message: 'Ads not found' });
        }

        res.json({ Success: true, Data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Success: false, Message: 'Internal server error' });
    }
});
// API lấy Ads đầu tiên trong Collection
app.get('/api/v1/collections/:collectionId/ads/first', async (req, res) => {
    const { collectionId } = req.params;

    try {
        const query = `SELECT * FROM ads WHERE collection_id = $1 ORDER BY created_date ASC LIMIT 1`;
        const values = [collectionId];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ Success: false, Message: 'No Ads found in this collection' });
        }

        res.json({ Success: true, Data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Success: false, Message: 'Internal server error' });
    }
});

// API lấy Ads tiếp theo trong Collection
app.get('/api/v1/collections/:collectionId/ads/next/:currentAdsId', async (req, res) => {
    const { collectionId, currentAdsId } = req.params;

    try {
        const query = `
            SELECT * FROM ads 
            WHERE collection_id = $1 AND id > $2 
            ORDER BY id ASC LIMIT 1
        `;
        const values = [collectionId, currentAdsId];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ Success: false, Message: 'No next Ads found in this collection' });
        }

        res.json({ Success: true, Data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Success: false, Message: 'Internal server error' });
    }
});
// Lắng nghe trên cổng
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});