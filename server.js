const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
require('dotenv').config();

const { pool, initDB } = require('./db');

const app  = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/images', express.static('public/images'));

// ── constants ────────────────────────────────────────────────────────────────

const ROLES = {
    GUEST:  'guest',
    CLIENT: 'client',
    WAITER: 'waiter',
    CHEF:   'chef',
    ADMIN:  'admin',
};

const JWT_SECRET      = process.env.JWT_SECRET      || 'TableOne_access_secret_key';
const REFRESH_SECRET  = process.env.REFRESH_SECRET  || 'Table_refresh_secret_key';
const ACCESS_EXPIRES  = process.env.ACCESS_EXPIRES  || '45m';
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || '1d';

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Parses a time-slot string such as "10:00-12:00" or "с 10:00 до 12:00".
 * Returns { start, end, startStr, endStr } where start/end are minutes from midnight.
 */
function parseTimeSlot(slot) {
    if (!slot) return null;

    let clean = slot.replace('–', '-').replace('—', '-');
    if (clean.includes('с ') && clean.includes(' до')) {
        clean = clean.replace('с ', '').replace(' до', '-');
    }

    const [s, e] = clean.split('-');
    if (!s || !e) return null;

    const [sh, sm] = s.trim().split(':').map(Number);
    const [eh, em] = e.trim().split(':').map(Number);

    if (isNaN(sh) || isNaN(eh)) return null;

    return {
        start:    sh * 60 + (sm || 0),
        end:      eh * 60 + (em || 0),
        startStr: s.trim(),
        endStr:   e.trim(),
    };
}

function validateEmail(email) {
    if (!email) return 'Email обязателен';
    if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email)) return 'Некорректный email';
    return null;
}

function validatePassword(password) {
    if (!password) return 'Пароль обязателен';
    if (password.length < 6) return 'Пароль должен состоять минимум из 6 символов';
    return null;
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

async function generateTokens(user) {
    const accessToken = jwt.sign(
        { id: user.user_id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: ACCESS_EXPIRES }
    );
    const refreshToken = jwt.sign(
        { id: user.user_id },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES }
    );

    // Rotate: remove old refresh tokens for this user, store new one
    await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [user.user_id]);
    await pool.query(
        `INSERT INTO refresh_tokens (token, user_id) VALUES ($1, $2)`,
        [refreshToken, user.user_id]
    );

    return { accessToken, refreshToken };
}

// ── middleware ────────────────────────────────────────────────────────────────

function authenticateToken(req, res, next) {
    const token = (req.headers['authorization'] || '').split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Токен не предоставлен' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Недействительный или просроченный токен' });
        req.user = decoded;
        next();
    });
}

function authorize(...allowedRoles) {
    return async (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Требуется аутентификация' });

        const { rows } = await pool.query(
            `SELECT user_id, role, is_blocked FROM users WHERE user_id = $1`,
            [req.user.id]
        );
        const user = rows[0];

        if (!user)            return res.status(404).json({ error: 'Пользователь не найден' });
        if (user.is_blocked)  return res.status(403).json({ error: 'Пользователь заблокирован' });
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({
                error: 'Недостаточно прав для выполнения операции',
                requiredRoles: allowedRoles,
                userRole: user.role,
            });
        }
        next();
    };
}

// ── auth routes ───────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
        return res.status(400).json({ error: 'Имя, email и пароль обязательны' });

    const emailErr    = validateEmail(email);
    const passwordErr = validatePassword(password);
    if (emailErr)    return res.status(400).json({ error: emailErr });
    if (passwordErr) return res.status(400).json({ error: passwordErr });

    const normEmail = email.toLowerCase().trim();
    const exists    = await pool.query(`SELECT 1 FROM users WHERE email = $1`, [normEmail]);
    if (exists.rows.length) return res.status(409).json({ error: 'Пользователь с таким email уже существует' });

    const hash = await bcrypt.hash(password, 10);
    const uid  = require('crypto').randomUUID();

    const { rows } = await pool.query(
        `INSERT INTO users (user_id, name, email, password, role)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING user_id, name, email, role, is_blocked, created_at`,
        [uid, name, normEmail, hash, ROLES.CLIENT]
    );
    res.status(201).json(rows[0]);
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });

    const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    const user = rows[0];
    if (!user)           return res.status(404).json({ error: 'Пользователь не найден' });
    if (user.is_blocked) return res.status(401).json({ error: 'Пользователь заблокирован' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Неверный пароль' });

    const tokens = await generateTokens(user);
    const { password: _, ...userResponse } = user;
    res.json({ ...tokens, user: userResponse });
});

app.post('/api/auth/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh токен не предоставлен' });

    const { rows } = await pool.query(
        `SELECT * FROM refresh_tokens WHERE token = $1`, [refreshToken]
    );
    if (!rows.length) return res.status(401).json({ error: 'Недействительный refresh токен' });

    jwt.verify(refreshToken, REFRESH_SECRET, async (err, decoded) => {
        if (err) {
            await pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken]);
            return res.status(403).json({ error: 'Refresh токен истек' });
        }

        const userRes = await pool.query(
            `SELECT * FROM users WHERE user_id = $1`, [decoded.id]
        );
        const user = userRes.rows[0];
        if (!user || user.is_blocked) {
            await pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken]);
            return res.status(401).json({ error: 'Пользователь не найден или заблокирован' });
        }

        const tokens = await generateTokens(user);
        res.json(tokens);
    });
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    const { rows } = await pool.query(
        `SELECT user_id, name, email, role, is_blocked, created_at
         FROM users WHERE user_id = $1`,
        [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(rows[0]);
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken]);
    }
    res.json({ message: 'Выход выполнен успешно' });
});

// ── user routes ───────────────────────────────────────────────────────────────

app.get('/api/users', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
    const { rows } = await pool.query(
        `SELECT user_id, name, email, role, is_blocked, created_at
         FROM users ORDER BY created_at`
    );
    res.json(rows);
});

app.get('/api/users/:id', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
    const { rows } = await pool.query(
        `SELECT user_id, name, email, role, is_blocked, created_at
         FROM users WHERE user_id = $1`,
        [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(rows[0]);
});

app.put('/api/users/:id', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
    const { name, email, role, isBlocked } = req.body;

    const { rows: existing } = await pool.query(
        `SELECT * FROM users WHERE user_id = $1`, [req.params.id]
    );
    if (!existing.length) return res.status(404).json({ error: 'Пользователь не найден' });

    const current = existing[0];
    const newName       = name       ?? current.name;
    const newEmail      = email      ?? current.email;
    const newRole       = (role && Object.values(ROLES).includes(role)) ? role : current.role;
    const newIsBlocked  = isBlocked !== undefined ? isBlocked : current.is_blocked;

    const { rows } = await pool.query(
        `UPDATE users SET name=$1, email=$2, role=$3, is_blocked=$4
         WHERE user_id=$5
         RETURNING user_id, name, email, role, is_blocked, created_at`,
        [newName, newEmail, newRole, newIsBlocked, req.params.id]
    );
    res.json(rows[0]);
});

app.delete('/api/users/:id', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
    if (req.params.id === req.user.id)
        return res.status(400).json({ error: 'Нельзя заблокировать самого себя' });

    const { rows } = await pool.query(
        `UPDATE users SET is_blocked = TRUE WHERE user_id = $1
         RETURNING user_id`,
        [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Пользователь не найден' });

    await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [req.params.id]);
    res.json({ message: 'Пользователь заблокирован' });
});

app.post('/api/users/employee', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
    const { name, email, password, role } = req.body;

    const emailErr    = validateEmail(email);
    const passwordErr = validatePassword(password);
    if (emailErr)    return res.status(400).json({ error: emailErr });
    if (passwordErr) return res.status(400).json({ error: passwordErr });

    if (!name || !email || !password || !role)
        return res.status(400).json({ error: 'Все поля обязательны' });

    if (!Object.values(ROLES).includes(role) || role === ROLES.GUEST)
        return res.status(400).json({ error: 'Некорректная роль' });

    const normEmail = email.toLowerCase().trim();
    const exists    = await pool.query(`SELECT 1 FROM users WHERE email = $1`, [normEmail]);
    if (exists.rows.length) return res.status(409).json({ error: 'Пользователь с таким email уже существует' });

    const hash = await bcrypt.hash(password, 10);
    const uid  = require('crypto').randomUUID();

    const { rows } = await pool.query(
        `INSERT INTO users (user_id, name, email, password, role)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING user_id, name, email, role, is_blocked, created_at`,
        [uid, name, normEmail, hash, role]
    );
    res.status(201).json(rows[0]);
});

// ── menu routes ───────────────────────────────────────────────────────────────

app.get('/api/menu', async (req, res) => {
    const { rows } = await pool.query(
        `SELECT d.dish_id AS id, d.name, d.price, c.name AS category,
                d.weight, d.description, d.image, d.recipe,
                d.cooking_time AS "cookingTime", d.ingredients
         FROM dishes d
         LEFT JOIN categories c ON c.category_id = d.category_id
         ORDER BY d.dish_id`
    );
    res.json(rows);
});

app.get('/api/menu/:id', async (req, res) => {
    const { rows } = await pool.query(
        `SELECT d.dish_id AS id, d.name, d.price, c.name AS category,
                d.weight, d.description, d.image, d.recipe,
                d.cooking_time AS "cookingTime", d.ingredients
         FROM dishes d
         LEFT JOIN categories c ON c.category_id = d.category_id
         WHERE d.dish_id = $1`,
        [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Блюдо не найдено' });

    const dish = rows[0];

    // Only chefs and admins see the recipe
    let userRole = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        try {
            const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
            const ur = await pool.query(`SELECT role FROM users WHERE user_id=$1`, [decoded.id]);
            userRole = ur.rows[0]?.role;
        } catch (_) {}
    }
    if (userRole !== ROLES.CHEF && userRole !== ROLES.ADMIN) delete dish.recipe;

    res.json(dish);
});

app.post('/api/menu', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
    const { name, price, category, weight, description, image, recipe, cookingTime, ingredients } = req.body;

    if (!name || !price || !category || !weight)
        return res.status(400).json({ error: 'Название, цена, категория и вес блюда обязательны' });

    // Upsert category
    const catRes = await pool.query(
        `INSERT INTO categories (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING category_id`,
        [category]
    );
    const categoryId = catRes.rows[0].category_id;

    const { rows } = await pool.query(
        `INSERT INTO dishes (name, price, category_id, weight, description, image, recipe, cooking_time, ingredients)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING dish_id AS id, name, price, weight, description, image, recipe,
                   cooking_time AS "cookingTime", ingredients`,
        [
            name, Number(price), categoryId,
            weight, description || '',
            image || '/images/default.jpg',
            recipe || '',
            cookingTime || '15 минут',
            ingredients || 'Ингредиенты не указаны',
        ]
    );
    res.status(201).json({ ...rows[0], category });
});

app.put('/api/menu/:id', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
    const { rows: existing } = await pool.query(
        `SELECT * FROM dishes WHERE dish_id = $1`, [req.params.id]
    );
    if (!existing.length) return res.status(404).json({ error: 'Блюдо не найдено' });

    const d = existing[0];
    const b = req.body;

    let categoryId = d.category_id;
    if (b.category) {
        const catRes = await pool.query(
            `INSERT INTO categories (name) VALUES ($1)
             ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
             RETURNING category_id`,
            [b.category]
        );
        categoryId = catRes.rows[0].category_id;
    }

    const { rows } = await pool.query(
        `UPDATE dishes
         SET name=$1, price=$2, category_id=$3, weight=$4, description=$5,
             image=$6, recipe=$7, cooking_time=$8, ingredients=$9
         WHERE dish_id=$10
         RETURNING dish_id AS id, name, price, weight, description, image, recipe,
                   cooking_time AS "cookingTime", ingredients`,
        [
            b.name         ?? d.name,
            b.price !== undefined ? Number(b.price) : d.price,
            categoryId,
            b.weight       ?? d.weight,
            b.description  ?? d.description,
            b.image        ?? d.image,
            b.recipe       ?? d.recipe,
            b.cookingTime  ?? d.cooking_time,
            b.ingredients  ?? d.ingredients,
            req.params.id,
        ]
    );

    // Fetch category name for response
    const catName = await pool.query(
        `SELECT name FROM categories WHERE category_id=$1`, [categoryId]
    );
    res.json({ ...rows[0], category: catName.rows[0]?.name });
});

app.delete('/api/menu/:id', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
    const { rows } = await pool.query(
        `DELETE FROM dishes WHERE dish_id = $1
         RETURNING dish_id AS id, name`,
        [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Блюдо не найдено' });

    const remaining = await pool.query(`SELECT COUNT(*) FROM dishes`);
    res.json({
        message: 'Блюдо удалено',
        deletedItem: rows[0],
        remainingCount: parseInt(remaining.rows[0].count),
    });
});

// ── table routes ──────────────────────────────────────────────────────────────

// Helper: recalculate and persist a table's status based on its reservations
async function recalcTableStatus(client, tableId) {
    const { rows } = await client.query(
        `SELECT time_start, time_end FROM reservations WHERE table_id = $1`,
        [tableId]
    );

    let status = 'free';
    if (rows.length > 0) {
        // "booked" if a single slot covers the whole working day
        const fullDay = rows.some(r => {
            const s = r.time_start.split(':').map(Number);
            const e = r.time_end.split(':').map(Number);
            return (s[0] * 60 + s[1]) <= 9 * 60 && (e[0] * 60 + e[1]) >= 23 * 60;
        });
        status = fullDay ? 'booked' : (rows.length >= 3 ? 'booked' : 'partial');
    }

    await client.query(
        `UPDATE restaurant_tables SET status=$1 WHERE table_id=$2`,
        [status, tableId]
    );
    return status;
}

app.get('/api/tables', authenticateToken, async (req, res) => {
    const { rows: tables } = await pool.query(
        `SELECT table_id AS id, status FROM restaurant_tables ORDER BY table_id`
    );

    // Attach slots array (as HH:MM-HH:MM strings) to match original API shape
    const { rows: reservations } = await pool.query(
        `SELECT table_id, time_start, time_end FROM reservations`
    );

    const slotsByTable = {};
    for (const r of reservations) {
        if (!slotsByTable[r.table_id]) slotsByTable[r.table_id] = [];
        // time values from pg come as "HH:MM:SS", trim to HH:MM
        const start = r.time_start.substring(0, 5);
        const end   = r.time_end.substring(0, 5);
        slotsByTable[r.table_id].push(`${start}-${end}`);
    }

    res.json(tables.map(t => ({ ...t, slots: slotsByTable[t.id] || [] })));
});

app.post('/api/tables/:id/book', authenticateToken,
    authorize(ROLES.CLIENT, ROLES.WAITER, ROLES.CHEF, ROLES.ADMIN),
    async (req, res) => {
        const tableId  = parseInt(req.params.id);
        const { timeSlot } = req.body;

        if (!timeSlot) return res.status(400).json({ error: 'Время бронирования обязательно' });

        const { rows: tableRows } = await pool.query(
            `SELECT * FROM restaurant_tables WHERE table_id = $1`, [tableId]
        );
        if (!tableRows.length) return res.status(404).json({ error: 'Стол не найден' });

        const table = tableRows[0];
        if (table.status === 'booked')
            return res.status(400).json({ error: 'Стол полностью занят на сегодня' });

        const newSlot = parseTimeSlot(timeSlot);
        if (!newSlot) return res.status(400).json({ error: 'Неверный формат времени. Используйте HH:MM-HH:MM' });
        if (newSlot.end - newSlot.start < 30)
            return res.status(400).json({ error: 'Минимальное время бронирования 30 минут' });
        if (newSlot.start < 9 * 60 || newSlot.end > 23 * 60)
            return res.status(400).json({ error: 'Ресторан работает с 9:00 до 23:00' });

        // Check overlaps
        const { rows: existing } = await pool.query(
            `SELECT time_start, time_end FROM reservations WHERE table_id = $1`, [tableId]
        );
        const overlap = existing.some(r => {
            const s = r.time_start.split(':').map(Number);
            const e = r.time_end.split(':').map(Number);
            const existStart = s[0] * 60 + s[1];
            const existEnd   = e[0] * 60 + e[1];
            return newSlot.start < existEnd && newSlot.end > existStart;
        });

        if (overlap) {
            const slots = existing.map(r =>
                `${r.time_start.substring(0,5)}-${r.time_end.substring(0,5)}`
            );
            return res.status(400).json({ error: 'Это время уже забронировано', existingSlots: slots });
        }

        const dbClient = await pool.connect();
        try {
            await dbClient.query('BEGIN');
            await dbClient.query(
                `INSERT INTO reservations (table_id, user_id, time_start, time_end)
                 VALUES ($1, $2, $3, $4)`,
                [tableId, req.user.id, newSlot.startStr, newSlot.endStr]
            );
            const newStatus = await recalcTableStatus(dbClient, tableId);
            await dbClient.query('COMMIT');

            // Build full updated table for response
            const { rows: slots } = await pool.query(
                `SELECT time_start, time_end FROM reservations WHERE table_id=$1`, [tableId]
            );
            res.json({
                message: 'Стол успешно забронирован',
                table: {
                    id: tableId,
                    status: newStatus,
                    slots: slots.map(r =>
                        `${r.time_start.substring(0,5)}-${r.time_end.substring(0,5)}`
                    ),
                },
                bookedSlot: `${newSlot.startStr}-${newSlot.endStr}`,
            });
        } catch (err) {
            await dbClient.query('ROLLBACK');
            throw err;
        } finally {
            dbClient.release();
        }
    }
);

// ── order routes ──────────────────────────────────────────────────────────────

// Helper: build the full order response object the frontend expects
async function buildOrderResponse(orderId) {
    const { rows: orderRows } = await pool.query(
        `SELECT order_id AS id, table_id AS "tableId", user_id AS "clientId",
                client_name AS "clientName",
                TO_CHAR(time_start, 'HH24:MI') || '-' || TO_CHAR(time_end, 'HH24:MI') AS "timeSlot",
                sort_minutes AS "sortMinutes",
                status, completed, created_at AS "createdAt"
         FROM orders WHERE order_id = $1`,
        [orderId]
    );
    if (!orderRows.length) return null;
    const order = orderRows[0];

    const { rows: items } = await pool.query(
        `SELECT item_id, dish_id AS "dishId", dish_name AS name,
                quantity AS total, remaining, comment, status
         FROM order_items WHERE order_id = $1 ORDER BY item_id`,
        [orderId]
    );
    order.dishes = items;
    return order;
}

app.post('/api/orders', authenticateToken,
    authorize(ROLES.CLIENT, ROLES.CHEF, ROLES.WAITER, ROLES.ADMIN),
    async (req, res) => {
        const { tableId, timeSlot, dishes, clientName } = req.body;

        if (!tableId || !timeSlot || !dishes || !dishes.length)
            return res.status(400).json({ error: 'Необходимо указать стол, время и блюда' });

        const { rows: tableRows } = await pool.query(
            `SELECT * FROM restaurant_tables WHERE table_id = $1`, [tableId]
        );
        if (!tableRows.length) return res.status(404).json({ error: 'Стол не найден' });

        const orderSlot = parseTimeSlot(timeSlot);
        if (!orderSlot) return res.status(400).json({ error: 'Неверный формат времени' });

        // Verify a matching reservation exists
        const { rows: reservations } = await pool.query(
            `SELECT time_start, time_end FROM reservations WHERE table_id = $1`, [tableId]
        );
        const isBooked = reservations.some(r => {
            const s = r.time_start.split(':').map(Number);
            const e = r.time_end.split(':').map(Number);
            const rs = s[0] * 60 + s[1];
            const re = e[0] * 60 + e[1];
            return orderSlot.start < re && orderSlot.end > rs;
        });
        if (!isBooked)
            return res.status(400).json({ error: 'Стол не забронирован на это время. Сначала забронируйте стол!' });

        const { rows: userRows } = await pool.query(
            `SELECT name FROM users WHERE user_id = $1`, [req.user.id]
        );
        const name = clientName || userRows[0]?.name || 'Гость';

        const orderId = `ord-${Date.now()}`;

        const dbClient = await pool.connect();
        try {
            await dbClient.query('BEGIN');
            await dbClient.query(
                `INSERT INTO orders
                    (order_id, table_id, user_id, client_name,
                     time_start, time_end, sort_minutes, status, completed)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,'active',false)`,
                [orderId, tableId, req.user.id, name,
                 orderSlot.startStr, orderSlot.endStr, orderSlot.start]
            );
            for (const d of dishes) {
                await dbClient.query(
                    `INSERT INTO order_items
                        (order_id, dish_id, dish_name, quantity, remaining, comment, status)
                     VALUES ($1,$2,$3,$4,$4,$5,'pending')`,
                    [orderId, d.dishId, d.name, d.quantity, d.comment || '']
                );
            }
            await dbClient.query('COMMIT');
        } catch (err) {
            await dbClient.query('ROLLBACK');
            throw err;
        } finally {
            dbClient.release();
        }

        const order = await buildOrderResponse(orderId);
        res.status(201).json(order);
    }
);

app.get('/api/orders', authenticateToken,
    authorize(ROLES.CLIENT, ROLES.ADMIN, ROLES.WAITER, ROLES.CHEF),
    async (req, res) => {
        const { rows: orderRows } = await pool.query(
            `SELECT order_id AS id, table_id AS "tableId", user_id AS "clientId",
                    client_name AS "clientName",
                    TO_CHAR(time_start, 'HH24:MI') || '-' || TO_CHAR(time_end, 'HH24:MI') AS "timeSlot",
                    sort_minutes AS "sortMinutes",
                    status, completed, created_at AS "createdAt"
             FROM orders ORDER BY sort_minutes`
        );
        const { rows: allItems } = await pool.query(
            `SELECT order_id, item_id, dish_id AS "dishId", dish_name AS name,
                    quantity AS total, remaining, comment, status
             FROM order_items ORDER BY item_id`
        );

        const itemsByOrder = {};
        for (const item of allItems) {
            if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
            itemsByOrder[item.order_id].push(item);
        }
        res.json(orderRows.map(o => ({ ...o, dishes: itemsByOrder[o.id] || [] })));
    }
);

app.get('/api/orders/my', authenticateToken, authorize(ROLES.CLIENT), async (req, res) => {
    const { rows: orderRows } = await pool.query(
        `SELECT order_id AS id, table_id AS "tableId", user_id AS "clientId",
                client_name AS "clientName",
                TO_CHAR(time_start, 'HH24:MI') || '-' || TO_CHAR(time_end, 'HH24:MI') AS "timeSlot",
                sort_minutes AS "sortMinutes",
                status, completed, created_at AS "createdAt"
         FROM orders WHERE user_id = $1 ORDER BY sort_minutes`,
        [req.user.id]
    );
    const ids = orderRows.map(o => o.id);
    if (!ids.length) return res.json([]);

    const { rows: allItems } = await pool.query(
        `SELECT order_id, item_id, dish_id AS "dishId", dish_name AS name,
                quantity AS total, remaining, comment, status
         FROM order_items WHERE order_id = ANY($1) ORDER BY item_id`,
        [ids]
    );
    const itemsByOrder = {};
    for (const item of allItems) {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item);
    }
    res.json(orderRows.map(o => ({ ...o, dishes: itemsByOrder[o.id] || [] })));
});

app.put('/api/orders/:orderId/dish/:dishIndex/serve', authenticateToken,
    authorize(ROLES.WAITER, ROLES.ADMIN),
    async (req, res) => {
        const { orderId, dishIndex } = req.params;

        const { rows: orderRows } = await pool.query(
            `SELECT * FROM orders WHERE order_id = $1`, [orderId]
        );
        if (!orderRows.length) return res.status(404).json({ error: 'Заказ не найден' });

        // dishIndex is positional — fetch all items ordered by item_id
        const { rows: items } = await pool.query(
            `SELECT * FROM order_items WHERE order_id=$1 ORDER BY item_id`, [orderId]
        );
        const dish = items[parseInt(dishIndex)];
        if (!dish) return res.status(404).json({ error: 'Блюдо не найдено' });
        if (dish.status !== 'ready')
            return res.status(400).json({ error: 'Блюдо еще не готово к подаче' });

        const newRemaining = dish.remaining > 0 ? dish.remaining - 1 : 0;
        const newStatus    = newRemaining === 0 ? 'served' : 'ready';

        await pool.query(
            `UPDATE order_items SET remaining=$1, status=$2 WHERE item_id=$3`,
            [newRemaining, newStatus, dish.item_id]
        );

        // Check if entire order is complete
        const { rows: remaining } = await pool.query(
            `SELECT COUNT(*) FROM order_items WHERE order_id=$1 AND remaining > 0`, [orderId]
        );
        if (parseInt(remaining.rows[0].count) === 0) {
            await pool.query(
                `UPDATE orders SET completed=true, status='completed' WHERE order_id=$1`, [orderId]
            );
        }

        const order = await buildOrderResponse(orderId);
        res.json(order);
    }
);

// ── kitchen routes ────────────────────────────────────────────────────────────

app.get('/api/kitchen/queue', authenticateToken,
    authorize(ROLES.CHEF, ROLES.ADMIN),
    async (req, res) => {
        const { rows } = await pool.query(
            `SELECT
                oi.item_id,
                oi.order_id AS "orderId",
                o.table_id  AS "tableId",
                oi.dish_name AS "dishName",
                oi.dish_id   AS "dishId",
                oi.remaining AS quantity,
                oi.comment,
                oi.status,
                TO_CHAR(o.time_start,'HH24:MI') || '-' || TO_CHAR(o.time_end,'HH24:MI') AS "timeSlot"
             FROM order_items oi
             JOIN orders o ON o.order_id = oi.order_id
             WHERE o.completed = false AND oi.remaining > 0
             ORDER BY o.sort_minutes, oi.item_id`
        );
        // Build queue IDs that match the old format orderId-dishIndex
        const byOrder = {};
        for (const row of rows) {
            if (!byOrder[row.orderId]) byOrder[row.orderId] = [];
            byOrder[row.orderId].push(row);
        }
        const queue = [];
        for (const [orderId, items] of Object.entries(byOrder)) {
            items.forEach((item, idx) => {
                queue.push({ ...item, id: `${orderId}-${idx}` });
            });
        }
        res.json(queue);
    }
);

app.put('/api/kitchen/dish/:queueId/start', authenticateToken,
    authorize(ROLES.CHEF, ROLES.ADMIN),
    async (req, res) => {
        const { queueId } = req.params;
        const lastDash  = queueId.lastIndexOf('-');
        const orderId   = queueId.substring(0, lastDash);
        const dishIndex = parseInt(queueId.substring(lastDash + 1));

        const { rows: items } = await pool.query(
            `SELECT * FROM order_items WHERE order_id=$1 ORDER BY item_id`, [orderId]
        );
        const dish = items[dishIndex];
        if (!dish) return res.status(404).json({ error: 'Блюдо не найдено' });
        if (dish.status !== 'pending')
            return res.status(400).json({
                error: `Блюдо уже ${dish.status === 'cooking' ? 'готовится' : 'готово'}`
            });

        await pool.query(
            `UPDATE order_items SET status='cooking' WHERE item_id=$1`, [dish.item_id]
        );
        res.json({ message: 'Блюдо начали готовить', dish: { ...dish, status: 'cooking' } });
    }
);

app.put('/api/kitchen/dish/:queueId/complete', authenticateToken,
    authorize(ROLES.CHEF, ROLES.ADMIN),
    async (req, res) => {
        const { queueId } = req.params;
        const lastDash  = queueId.lastIndexOf('-');
        const orderId   = queueId.substring(0, lastDash);
        const dishIndex = parseInt(queueId.substring(lastDash + 1));

        const { rows: items } = await pool.query(
            `SELECT * FROM order_items WHERE order_id=$1 ORDER BY item_id`, [orderId]
        );
        const dish = items[dishIndex];
        if (!dish) return res.status(404).json({ error: 'Блюдо не найдено' });
        if (dish.status !== 'cooking')
            return res.status(400).json({ error: 'Блюдо не начали готовить' });

        await pool.query(
            `UPDATE order_items SET status='ready' WHERE item_id=$1`, [dish.item_id]
        );
        res.json({
            message:   'Блюдо готово к подаче',
            dish:      { ...dish, status: 'ready' },
            remaining: dish.remaining,
            status:    'ready',
        });
    }
);

app.get('/api/kitchen/recipe/:dishId', authenticateToken,
    authorize(ROLES.CHEF, ROLES.ADMIN),
    async (req, res) => {
        const { rows: dishes } = await pool.query(
            `SELECT dish_id, name, recipe, description, cooking_time, ingredients
             FROM dishes WHERE dish_id = $1`,
            [req.params.dishId]
        );
        if (!dishes.length) return res.status(404).json({ error: 'Блюдо не найдено' });
        const dish = dishes[0];

        // Gather comments from active orders for this dish
        const { rows: comments } = await pool.query(
            `SELECT oi.comment, oi.order_id AS "orderId",
                    o.table_id AS "tableId",
                    TO_CHAR(o.time_start,'HH24:MI') || '-' || TO_CHAR(o.time_end,'HH24:MI') AS "timeSlot"
             FROM order_items oi
             JOIN orders o ON o.order_id = oi.order_id
             WHERE oi.dish_id = $1 AND o.completed = false AND oi.comment <> ''`,
            [req.params.dishId]
        );

        res.json({
            id:          dish.dish_id,
            name:        dish.name,
            recipe:      dish.recipe || 'Рецепт не добавлен',
            description: dish.description,
            cookingTime: dish.cooking_time || '15-20 минут',
            ingredients: dish.ingredients || 'Ингредиенты не указаны',
            comments,
        });
    }
);

// ── admin stats ───────────────────────────────────────────────────────────────

app.get('/api/admin/stats', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
    const [orders, tables, menu, users] = await Promise.all([
        pool.query(`SELECT status FROM orders`),
        pool.query(`SELECT status FROM restaurant_tables`),
        pool.query(`SELECT COUNT(*) FROM dishes`),
        pool.query(`SELECT COUNT(*) FROM users`),
    ]);

    const activeOrders    = orders.rows.filter(o => o.status === 'active').length;
    const completedOrders = orders.rows.filter(o => o.status === 'completed').length;

    // Revenue: sum of (price * quantity) for all completed orders
    const revenueRes = await pool.query(
        `SELECT COALESCE(SUM(d.price * oi.quantity), 0) AS revenue
         FROM order_items oi
         JOIN dishes d ON d.dish_id = oi.dish_id
         JOIN orders  o ON o.order_id = oi.order_id
         WHERE o.status = 'completed'`
    );

    res.json({
        totalOrders:      orders.rows.length,
        activeOrders,
        completedOrders,
        totalRevenue:     parseFloat(revenueRes.rows[0].revenue),
        tablesCount:      tables.rows.length,
        bookedTables:     tables.rows.filter(t => t.status === 'booked').length,
        partialTables:    tables.rows.filter(t => t.status === 'partial').length,
        freeTables:       tables.rows.filter(t => t.status === 'free').length,
        menuItemsCount:   parseInt(menu.rows[0].count),
        usersCount:       parseInt(users.rows[0].count),
    });
});

// ── request logger ────────────────────────────────────────────────────────────

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    });
    next();
});

// ── global error handler ──────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// ── start ─────────────────────────────────────────────────────────────────────

initDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Could not connect to database:', err.message);
        process.exit(1);
    });
