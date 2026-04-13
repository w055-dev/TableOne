const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 5432,
    database: process.env.DB_NAME     || 'tableone',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function initDB() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // ── ROLES ────────────────────────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS roles (
                role_id   SERIAL PRIMARY KEY,
                name      VARCHAR(50) UNIQUE NOT NULL
            );
        `);

        // ── USERS ────────────────────────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id      VARCHAR(36)  PRIMARY KEY,
                name         VARCHAR(100) NOT NULL,
                email        VARCHAR(255) UNIQUE NOT NULL,
                password     TEXT         NOT NULL,
                role         VARCHAR(50)  NOT NULL DEFAULT 'client',
                is_blocked   BOOLEAN      NOT NULL DEFAULT FALSE,
                created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );
        `);

        // ── RESTAURANT TABLES ────────────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS restaurant_tables (
                table_id  SERIAL PRIMARY KEY,
                status    VARCHAR(20) NOT NULL DEFAULT 'free'
                          CHECK (status IN ('free', 'partial', 'booked'))
            );
        `);

        // ── RESERVATIONS ─────────────────────────────────────────────────────
        // Replaces the old "slots" string array on each table object.
        await client.query(`
            CREATE TABLE IF NOT EXISTS reservations (
                reservation_id SERIAL       PRIMARY KEY,
                table_id       INTEGER      NOT NULL REFERENCES restaurant_tables(table_id) ON DELETE CASCADE,
                user_id        VARCHAR(36)  REFERENCES users(user_id) ON DELETE SET NULL,
                time_start     TIME         NOT NULL,
                time_end       TIME         NOT NULL,
                created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );
        `);

        // ── CATEGORIES ───────────────────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS categories (
                category_id SERIAL PRIMARY KEY,
                name        VARCHAR(100) UNIQUE NOT NULL
            );
        `);

        // ── DISHES (menu items) ───────────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS dishes (
                dish_id      SERIAL       PRIMARY KEY,
                name         VARCHAR(200) NOT NULL,
                price        NUMERIC(10,2) NOT NULL,
                category_id  INTEGER      REFERENCES categories(category_id) ON DELETE SET NULL,
                weight       VARCHAR(50),
                description  TEXT,
                image        VARCHAR(500),
                recipe       TEXT,
                cooking_time VARCHAR(50),
                ingredients  TEXT
            );
        `);

        // ── ORDERS ───────────────────────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                order_id     VARCHAR(50)  PRIMARY KEY,
                table_id     INTEGER      NOT NULL REFERENCES restaurant_tables(table_id),
                user_id      VARCHAR(36)  REFERENCES users(user_id) ON DELETE SET NULL,
                client_name  VARCHAR(100) NOT NULL DEFAULT 'Гость',
                time_start   TIME         NOT NULL,
                time_end     TIME         NOT NULL,
                sort_minutes INTEGER      NOT NULL,
                status       VARCHAR(20)  NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active', 'completed')),
                completed    BOOLEAN      NOT NULL DEFAULT FALSE,
                created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );
        `);

        // ── ORDER ITEMS ───────────────────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                item_id      SERIAL       PRIMARY KEY,
                order_id     VARCHAR(50)  NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
                dish_id      INTEGER      NOT NULL REFERENCES dishes(dish_id),
                dish_name    VARCHAR(200) NOT NULL,
                quantity     INTEGER      NOT NULL DEFAULT 1,
                remaining    INTEGER      NOT NULL DEFAULT 1,
                comment      TEXT         NOT NULL DEFAULT '',
                status       VARCHAR(20)  NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'cooking', 'ready', 'served'))
            );
        `);

        // ── REFRESH TOKENS ────────────────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                token_id   SERIAL      PRIMARY KEY,
                token      TEXT        UNIQUE NOT NULL,
                user_id    VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        await client.query('COMMIT');
        console.log('✅ Database schema ready');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to initialise database schema:', err.message);
        throw err;
    } finally {
        client.release();
    }
}

module.exports = { pool, initDB };
