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
    ssl: {
        rejectUnauthorized: false, // Bypass certificate validation (use cautiously in production)
    },
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
    const { OfferId, Status } = req.body;

    if (!OfferId || !Status) {
        return res.status(400).json({ Success: false, Message: 'Missing required fields' });
    }

    try {
        const query = `
            UPDATE offers
            SET status = $1
            WHERE id = $2;
            `;
        const values = [Status, OfferId];
        await pool.query(query, values);

        res.json({ Success: true, Data: {} });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Success: false, Message: 'Internal server error' });
    }
});

// API tạo Ads
app.post('/api/v1/ads', async (req, res) => {
    const { name, type, short_description, description, image_url, seller_id, location_distance, status, collection_id } = req.body;

    if (!name || !type || !short_description || !description || !image_url || !seller_id || !location_distance || !status || !collection_id) {
        return res.status(400).json({ Success: false, Message: 'Missing required fields' });
    }

    try {
        const query = `
        INSERT INTO ads (name, type, short_description, description, image_url, seller_id, location_distance, status, collection_id, created_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        RETURNING *
        `;
        const values = [name, type, short_description, description, image_url, seller_id, location_distance, status, collection_id];
        const result = await pool.query(query, values);

        res.json({ Success: true, Data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Success: false, Message: 'Internal server error' });
    }
});

// API update Ads
app.post('/api/v1/ads/:ads_id/update', async (req, res) => {
    const { ads_id } = req.params;
    const { name, type, short_description, description, image_url, seller_id, location_distance, status, collection_id } = req.body;

    if (!name || !type || !short_description || !description || !image_url || !seller_id || !location_distance || !status || !collection_id) {
        return res.status(400).json({ Success: false, Message: 'Missing required fields' });
    }

    try {
        const query = `
            UPDATE ads 
            SET name = $1,
                type = $2,
                short_description = $3, 
                description = $4, 
                image_url = $5, 
                seller_id = $6, 
                location_distance = $7, 
                status = $8, 
                collection_id = $9
            WHERE id = $10 
            RETURNING *
            `;
        const values = [name, type, short_description, description, image_url, seller_id, location_distance, status, collection_id, ads_id];
        const result = await pool.query(query, values);

        res.json({ Success: true, Data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Success: false, Message: 'Internal server error' });
    }
});

// API lấy danh sách Ads
app.get('/api/v1/ads/get-by-owner/:ownerId', async (req, res) => {
    try {
        const { ownerId } = req.params;
        const query = `SELECT a.id,
            a.name,
            a.type,
            a.short_description,
            a.description,
            a.image_url,
            a.seller_id,
            u.name AS seller_name,
            a.location_distance,
            a.status,
            a.created_date,
            a.collection_id,
            c.name AS collection_name
        FROM ads a 
        INNER JOIN collections c ON a.collection_id = c.id 
        INNER JOIN users u ON a.seller_id = u.id 
        WHERE a.seller_id = $1
            AND a.status = 'Active'
        ORDER BY created_date DESC`;

        const values = [ownerId];
        const result = await pool.query(query, values);

        res.json({ Success: true, Data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Success: false, Message: 'Internal server error' });
    }
});

// API lấy danh sách Ads
app.get('/api/v1/ads/get-by-collection/:collection_id', async (req, res) => {
    try {
        const { collection_id } = req.params;
        const query = `SELECT a.id,
            a.name,
            a.type,
            a.short_description,
            a.description,
            a.image_url,
            a.seller_id,
            u.name AS seller_name,
            a.location_distance,
            a.status,
            a.created_date,
            a.collection_id,
            c.name AS collection_name
        FROM ads a 
        INNER JOIN collections c ON a.collection_id = c.id 
        INNER JOIN users u ON a.seller_id = u.id 
        WHERE a.collection_id = $1
            AND a.status = 'Active'
        ORDER BY created_date DESC`;

        const values = [collection_id];
        const result = await pool.query(query, values);

        res.json({ Success: true, Data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Success: false, Message: 'Internal server error' });
    }
});

// API lấy thông tin chi tiết của một Ads
app.get('/api/v1/ads/get-detail/:id/:current_user_id', async (req, res) => {
    const { id, current_user_id } = req.params;

    try {
        const query = `
            SELECT
                ads.id,
                ads.name,
                ads.short_description,
                ads.description,
                ads.image_url,
                ads.name AS seller_name,
                ads.location_distance,
                (SELECT CASE WHEN COUNT(1) > 0 THEN true ELSE false END FROM user_activities WHERE ads_id = ads.id AND user_id = $2) AS is_like,   
                (SELECT COUNT(1) FROM offers WHERE target_ads_id = ads.id) AS total_offer,
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', offers.id,
                            'ads_id', a2.id,
                            'ads_name', a2.name,
                            'image_url', a2.image_url,
                            'owner_name', users.name,
                            'created_date', offers.created_date,
                            'status', offers.status
                        )
                    )
                    FROM offers
                    LEFT JOIN ads a2 ON offers.source_ads_id = a2.id
                    LEFT JOIN users ON offers.owner_id = users.id
                    WHERE target_ads_id = ads.id
                ) AS offers
                FROM ads
            WHERE ads.id = $1;`;
        const values = [id, current_user_id];
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
        const query = 
            `SELECT * 
            FROM 
            (
                SELECT ROW_NUMBER() OVER (ORDER BY ads.created_date DESC) AS row_num,
                    ads.id,
                    ads.name,
                    ads.short_description,
                    ads.description,
                    ads.image_url,
                    ads.name AS seller_name,
                    ads.location_distance,
                    (SELECT COUNT(1) FROM offers WHERE target_ads_id = ads.id) AS total_offer,
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', offers.id,
                                'ads_id', a2.id,
                                'ads_name', a2.name,
                                'image_url', a2.image_url,
                                'owner_name', users.name,
                                'created_date', offers.created_date,
                                'status', offers.status
                            )
                        )
                        FROM offers
                        LEFT JOIN ads a2 ON offers.source_ads_id = a2.id
                        LEFT JOIN users ON offers.owner_id = users.id
                        WHERE target_ads_id = ads.id
                    ) AS offers
                FROM ads
                WHERE ads.collection_id = $1
                ORDER BY ads.created_date ASC
            )
            ORDER BY row_num ASC
            LIMIT 1;`;
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
        const query = `SELECT *
        FROM
        (
            SELECT ROW_NUMBER() OVER (ORDER BY ads.created_date DESC) AS row_num,
                ads.id,
                ads.name,
                ads.short_description,
                ads.description,
                ads.image_url,
                ads.name AS seller_name,
                ads.location_distance,
                (SELECT COUNT(1) FROM offers WHERE target_ads_id = ads.id) AS total_offer,
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', offers.id,
                            'ads_id', a2.id,
                            'ads_name', a2.name,
                            'image_url', a2.image_url,
                            'owner_name', users.name,
                            'created_date', offers.created_date,
                            'status', offers.status
                        )
                    )
                    FROM offers
                    LEFT JOIN ads a2 ON offers.source_ads_id = a2.id
                    LEFT JOIN users ON offers.owner_id = users.id
                    WHERE target_ads_id = ads.id
                ) AS offers
                FROM ads
            WHERE ads.collection_id = $1
            ORDER BY ads.created_date ASC
        )
        WHERE row_num > $2
        LIMIT 1;`;
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


// POST endpoint to create an offer
app.post('/api/v1/offer', async (req, res) => {
    const { source_ads_id, target_ads_id, owner_id, status } = req.body;

    // Validate request body
    if (!source_ads_id || !target_ads_id || !owner_id || !status) {
        return res.status(400).json({
            Success: false,
            Message: "Missing required fields: AdsId, OwnerId, Status."
        });
    }

    try {
        // Insert offer into the database
        const query = `
            INSERT INTO offers (source_ads_id, target_ads_id, owner_id, status)
            VALUES ($1, $2, $3, $4)
            RETURNING id, source_ads_id, target_ads_id, owner_id, created_date, status;
        `;
        const values = [source_ads_id, target_ads_id, owner_id, status];
        const result = await pool.query(query, values);

        res.status(201).json({
            Success: true,
            Data: result.rows[0]
        });
    } catch (error) {
        console.error('Error inserting offer:', error);
        res.status(500).json({
            Success: false,
            Message: "Internal server error."
        });
    }
});

// API endpoint
app.post('/api/v1/ads/user-interaction', async (req, res) => {
    const { UserId, AdsId, ActionType } = req.body;

    if (!UserId || !AdsId || !ActionType) {
        return res.status(400).json({ Success: false, Message: 'UserId and AdsId and ActionType are required' });
    }

    try {
        const query = `
            INSERT INTO user_activities (user_id, ads_id, action_type, created_date)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            RETURNING *;
        `;
        const result = await pool.query(query, [UserId, AdsId, ActionType]);
        res.json({ Success: true, Data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Success: false, Message: 'Internal Server Error' });
    }
});

// Lắng nghe trên cổng
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});