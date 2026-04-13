/**
 * seed.js — populates the database with the initial data that used to live in
 * data/users.js, data/menu.js, data/tables.js, and data/orders.js.
 *
 * Run once after first setup:  node seed.js
 * Safe to re-run: it skips rows that already exist.
 */

require('dotenv').config();
const bcrypt   = require('bcrypt');
const { pool, initDB } = require('./db');

// ── helpers ──────────────────────────────────────────────────────────────────

function parseSlot(slot) {
    const clean = slot.replace('–', '-').replace('—', '-');
    const [start, end] = clean.split('-');
    return { start: start.trim(), end: end.trim() };
}

// ── seed data (mirrors the original JS data files) ───────────────────────────

const ROLES = ['guest', 'client', 'waiter', 'chef', 'admin'];

const USERS = [
    { name: 'Администратор',  email: 'admin@restaurant.com',  password: 'admin123',  role: 'admin'  },
    { name: 'Иван Официант',  email: 'waiter@restaurant.com', password: 'waiter123', role: 'waiter' },
    { name: 'Петр Повар',     email: 'chef@restaurant.com',   password: 'chef123',   role: 'chef'   },
    { name: 'Алексей Клиент', email: 'client@example.com',    password: 'client123', role: 'client' },
];

const TABLES = [
    { id: 1,  status: 'free',    slots: [] },
    { id: 2,  status: 'partial', slots: ['10:00-11:00', '11:00-14:00'] },
    { id: 3,  status: 'free',    slots: [] },
    { id: 4,  status: 'booked',  slots: ['09:00-23:00'] },
    { id: 5,  status: 'free',    slots: [] },
    { id: 6,  status: 'free',    slots: [] },
    { id: 7,  status: 'partial', slots: ['18:00-20:00'] },
    { id: 8,  status: 'free',    slots: [] },
    { id: 9,  status: 'booked',  slots: ['12:00-22:00'] },
    { id: 10, status: 'free',    slots: [] },
    { id: 11, status: 'free',    slots: [] },
    { id: 12, status: 'partial', slots: ['19:00-21:00'] },
    { id: 13, status: 'free',    slots: [] },
    { id: 14, status: 'free',    slots: [] },
    { id: 15, status: 'booked',  slots: ['10:00-14:00', '15:00-18:00'] },
    { id: 16, status: 'free',    slots: [] },
    { id: 17, status: 'free',    slots: [] },
];

const CATEGORIES = ['Закуски', 'Пицца', 'Паста', 'Ризотто', 'Десерты', 'Напитки'];

const MENU = [
    { id: 1,  name: 'Брускетта с томатами',    price: 320, category: 'Закуски',  weight: '180г',  description: 'Хрустящий хлеб с томатами, чесноком и базиликом',            image: '/images/bruschetta.webp',          recipe: 'Поджарьте хлеб, натрите чесноком, выложите нарезанные томаты с базиликом и оливковым маслом.',                                                                                                                               cookingTime: '10 минут', ingredients: 'Хлеб багет, помидоры черри, чеснок, базилик свежий, оливковое масло экстра вирджин, соль морская, перец чёрный' },
    { id: 2,  name: 'Капрезе',                 price: 450, category: 'Закуски',  weight: '250г',  description: 'Моцарелла, томаты, базилик, оливковое масло',                 image: '/images/caprese.webp',             recipe: 'Нарежьте моцареллу и томаты кружочками, выложите слоями, чередуя, посыпьте свежим базиликом и полейте оливковым маслом.',                                                                                                         cookingTime: '7 минут',  ingredients: 'Моцарелла ди буфала, помидоры, базилик свежий, оливковое масло, соль, перец, бальзамический крем (опционально)' },
    { id: 3,  name: 'Карпаччо из говядины',    price: 580, category: 'Закуски',  weight: '200г',  description: 'Тонко нарезанная говядина с пармезаном и рукколой',           image: '/images/carpaccio.webp',           recipe: 'Нарежьте замороженную говядину тонкими ломтиками, выложите на тарелку, добавьте пармезан, рукколу, полейте соусом из оливкового масла, лимонного сока и каперсов.',                                                               cookingTime: '12 минут', ingredients: 'Говяжья вырезка, пармезан, руккола, оливковое масло, лимон, каперсы, соль, перец' },
    { id: 4,  name: 'Прошутто с дыней',        price: 520, category: 'Закуски',  weight: '220г',  description: 'Вяленая ветчина с сочной дыней',                              image: '/images/prosciutto-melon.webp',    recipe: 'Нарежьте дыню тонкими ломтиками, оберните каждый ломтик прошутто, выложите на тарелку, украсьте рукколой и полейте бальзамическим кремом.',                                                                                      cookingTime: '5 минут',  ingredients: 'Прошутто крудо, дыня канталупа, руккола, бальзамический крем, перец чёрный' },
    { id: 5,  name: 'Пицца Маргарита',         price: 550, category: 'Пицца',    weight: '350г',  description: 'Томатный соус, моцарелла, базилик',                           image: '/images/pizza-margherita.webp',    recipe: 'Раскатайте тесто, выложите томатный соус, моцареллу, листья базилика. Выпекайте в разогретой до 250°C печи 10-12 минут.',                                                                                                          cookingTime: '15 минут', ingredients: 'Мука 00, дрожжи, вода, оливковое масло, томатный соус, моцарелла, базилик, соль' },
    { id: 6,  name: 'Пицца Пепперони',         price: 650, category: 'Пицца',    weight: '380г',  description: 'Томатный соус, моцарелла, пепперони',                         image: '/images/pizza-pepperoni.webp',     recipe: 'Раскатайте тесто, выложите томатный соус, моцареллу и пепперони. Выпекайте до золотистой корочки 12-14 минут.',                                                                                                                   cookingTime: '15 минут', ingredients: 'Мука 00, дрожжи, вода, оливковое масло, томатный соус, моцарелла, пепперони, орегано' },
    { id: 7,  name: 'Пицца Четыре сыра',       price: 720, category: 'Пицца',    weight: '360г',  description: 'Моцарелла, горгонзола, пармезан, фонтана',                    image: '/images/pizza-quattro-formaggi.webp', recipe: 'Смешайте четыре вида сыра, выложите на тесто, предварительно смазанное оливковым маслом, выпекайте 10-12 минут.',                                                                                                              cookingTime: '12 минут', ingredients: 'Мука 00, дрожжи, вода, моцарелла, горгонзола, пармезан, сыр фонтана, оливковое масло' },
    { id: 8,  name: 'Пицца с грибами',         price: 590, category: 'Пицца',    weight: '370г',  description: 'Томатный соус, моцарелла, шампиньоны, трюфельное масло',      image: '/images/pizza-mushrooms.webp',     recipe: 'Обжарьте грибы до золотистого цвета, выложите на пиццу с соусом и сыром, запеките, перед подачей добавьте трюфельное масло.',                                                                                                    cookingTime: '18 минут', ingredients: 'Мука 00, дрожжи, вода, томатный соус, моцарелла, шампиньоны свежие, трюфельное масло, петрушка' },
    { id: 9,  name: 'Спагетти Карбонара',      price: 520, category: 'Паста',    weight: '320г',  description: 'Спагетти, гуанчале, яичный желток, пармезан, перец',          image: '/images/spaghetti-carbonara.webp', recipe: 'Обжарьте гуанчале, смешайте желтки с сыром, соедините с горячими спагетти вне огня, добавьте гуанчале и перец.',                                                                                                                cookingTime: '20 минут', ingredients: 'Спагетти, гуанчале, яичные желтки, пармезан, перец чёрный крупного помола, соль' },
    { id: 10, name: 'Лазанья Болоньезе',       price: 580, category: 'Паста',    weight: '400г',  description: 'Листы пасты с мясным соусом болоньезе и бешамель',            image: '/images/lasagna.webp',             recipe: 'Приготовьте соус болоньезе и бешамель, выкладывайте слоями листы пасты, соусы и сыр, запекайте 40 минут при 180°C.',                                                                                                            cookingTime: '45 минут', ingredients: 'Листы лазаньи, говяжий фарш, томаты, лук, морковь, сельдерей, молоко, мука, сливочное масло, пармезан' },
    { id: 11, name: 'Феттучини Альфредо',      price: 490, category: 'Паста',    weight: '310г',  description: 'Паста феттучини в сливочном соусе с пармезаном',              image: '/images/fettuccine-alfredo.webp',  recipe: 'Отварите феттучини, смешайте горячую пасту с маслом и пармезаном, добавьте немного воды от варки для консистенции.',                                                                                                           cookingTime: '15 минут', ingredients: 'Феттучини, сливочное масло, пармезан, соль, перец, вода от варки пасты' },
    { id: 12, name: 'Тортиллини с грибами',    price: 540, category: 'Паста',    weight: '320г',  description: 'Тортиллини с грибной начинкой в сливочном соусе',             image: '/images/tortellini-mushrooms.webp',recipe: 'Отварите тортиллини, обжарьте грибы со сливками и чесноком, смешайте с пастой, посыпьте пармезаном.',                                                                                                                       cookingTime: '20 минут', ingredients: 'Тортиллини с грибами, шампиньоны, сливки 33%, чеснок, пармезан, петрушка, оливковое масло' },
    { id: 13, name: 'Ризотто с морепродуктами',price: 780, category: 'Ризотто',  weight: '350г',  description: 'Рис арборио с мидиями, креветками, кальмарами',               image: '/images/risotto-seafood.webp',     recipe: 'Обжарьте рис на оливковом масле, добавляйте рыбный бульон постепенно, помешивая, за 2 минуты до готовности добавьте морепродукты.',                                                                                             cookingTime: '25 минут', ingredients: 'Рис арборио, креветки, мидии, кальмары, рыбный бульон, белое вино, чеснок, петрушка, оливковое масло' },
    { id: 14, name: 'Ризотто с грибами',       price: 620, category: 'Ризотто',  weight: '340г',  description: 'Рис арборио с белыми грибами и трюфельным маслом',            image: '/images/risotto-mushrooms.webp',   recipe: 'Обжарьте белые грибы, добавьте рис, готовьте с грибным бульоном, в конце добавьте трюфельное масло и пармезан.',                                                                                                              cookingTime: '25 минут', ingredients: 'Рис арборио, белые грибы, грибной бульон, лук-шалот, пармезан, трюфельное масло, сливочное масло' },
    { id: 15, name: 'Тирамису',                price: 380, category: 'Десерты',  weight: '150г',  description: 'Классический итальянский десерт с маскарпоне',                image: '/images/tiramisu.webp',            recipe: 'Смешайте маскарпоне с желтками и сахаром, взбейте белки, смешайте, выкладывайте слоями с печеньем савоярди, пропитанным эспрессо.',                                                                                              cookingTime: '30 минут', ingredients: 'Маскарпоне, яйца, сахар, печенье савоярди, эспрессо, какао-порошок, ликёр (опционально)' },
    { id: 16, name: 'Панна котта',             price: 350, category: 'Десерты',  weight: '140г',  description: 'Нежный сливочный десерт с ягодным соусом',                   image: '/images/panna-cotta.webp',         recipe: 'Смешайте сливки, сахар, ваниль, нагрейте, добавьте желатин, разлейте по формам, охладите 4 часа. Подавайте с ягодным соусом.',                                                                                                 cookingTime: '20 минут', ingredients: 'Сливки 33%, сахар, ваниль, желатин, ягоды для соуса' },
    { id: 17, name: 'Сабайон',                 price: 390, category: 'Десерты',  weight: '140г',  description: 'Нежный десерт из яичных желтков, сахара и марсалы',           image: '/images/zabaglione.webp',          recipe: 'Взбейте желтки с сахаром на водяной бане, добавьте марсалу, взбивайте до загустения и увеличения объёма. Подавайте тёплым с ягодами.',                                                                                         cookingTime: '15 минут', ingredients: 'Яичные желтки, сахар, вино марсала, ягоды свежие' },
    { id: 18, name: 'Крем-брюле',              price: 390, category: 'Десерты',  weight: '150г',  description: 'Нежный заварной крем с карамельной корочкой',                 image: '/images/creme-brulee.webp',        recipe: 'Запеките заварной крем на водяной бане, остудите, посыпьте сахаром и карамелизуйте горелкой до золотистой корочки.',                                                                                                            cookingTime: '40 минут', ingredients: 'Сливки 33%, желтки, сахар, ваниль, тростниковый сахар для карамели' },
    { id: 19, name: 'Апероль Шприц',           price: 480, category: 'Напитки',  weight: '250мл', description: 'Апероль, просекко, содовая, апельсин',                        image: '/images/aperol-spritz.webp',       recipe: 'Наполните бокал льдом, добавьте 3 части просекко, 2 части Апероля, 1 часть содовой, украсьте долькой апельсина.',                                                                                                               cookingTime: '3 минуты',  ingredients: 'Апероль, просекко, содовая, апельсин, лёд' },
    { id: 20, name: 'Просекко',                price: 450, category: 'Напитки',  weight: '150мл', description: 'Итальянское игристое вино',                                   image: '/images/prosecco.webp',            recipe: 'Подавайте охлаждённым до 6-8°C в бокалах для игристого вина.',                                                                                                                                                                  cookingTime: '2 минуты',  ingredients: 'Просекко DOCG, лёд (опционально)' },
];

const ORDERS = [
    { id: 'ord-0',   tableId: 6,  timeSlot: '08:00-09:00', sortMinutes: 480,  completed: true,  status: 'completed', clientName: 'Гость', dishes: [{ dishId: 1,  name: 'Брускетта с томатами',    total: 2, remaining: 0, comment: '', status: 'served'  }, { dishId: 9,  name: 'Спагетти Карбонара',       total: 1, remaining: 0, comment: '', status: 'served'  }, { dishId: 15, name: 'Тирамису',                price: 380, total: 2, remaining: 0, comment: '', status: 'served'  }] },
    { id: 'ord-2a',  tableId: 2,  timeSlot: '10:00-11:00', sortMinutes: 600,  completed: false, status: 'active',    clientName: 'Гость', dishes: [{ dishId: 2,  name: 'Капрезе',                 total: 2, remaining: 2, comment: '', status: 'pending' }, { dishId: 5,  name: 'Пицца Маргарита',          total: 1, remaining: 1, comment: '', status: 'pending' }, { dishId: 17, name: 'Сабайон',                 total: 2, remaining: 2, comment: '', status: 'pending' }] },
    { id: 'ord-2b',  tableId: 2,  timeSlot: '11:00-14:00', sortMinutes: 660,  completed: false, status: 'active',    clientName: 'Гость', dishes: [{ dishId: 3,  name: 'Карпаччо из говядины',    total: 1, remaining: 1, comment: '', status: 'pending' }, { dishId: 10, name: 'Лазанья Болоньезе',        total: 1, remaining: 1, comment: '', status: 'pending' }, { dishId: 16, name: 'Панна котта',             total: 2, remaining: 2, comment: '', status: 'pending' }] },
    { id: 'ord-15a', tableId: 15, timeSlot: '10:00-14:00', sortMinutes: 600,  completed: false, status: 'active',    clientName: 'Гость', dishes: [{ dishId: 4,  name: 'Прошутто с дыней',        total: 2, remaining: 2, comment: '', status: 'pending' }, { dishId: 6,  name: 'Пицца Пепперони',         total: 2, remaining: 2, comment: '', status: 'pending' }, { dishId: 13, name: 'Ризотто с морепродуктами', total: 1, remaining: 1, comment: '', status: 'pending' }, { dishId: 18, name: 'Крем-брюле', total: 2, remaining: 2, comment: '', status: 'pending' }] },
    { id: 'ord-15b', tableId: 15, timeSlot: '15:00-18:00', sortMinutes: 900,  completed: false, status: 'active',    clientName: 'Гость', dishes: [{ dishId: 7,  name: 'Пицца Четыре сыра',       total: 2, remaining: 2, comment: '', status: 'pending' }, { dishId: 11, name: 'Феттучини Альфредо',      total: 2, remaining: 2, comment: '', status: 'pending' }, { dishId: 19, name: 'Апероль Шприц',           total: 3, remaining: 3, comment: '', status: 'pending' }] },
    { id: 'ord-9',   tableId: 9,  timeSlot: '12:00-22:00', sortMinutes: 720,  completed: false, status: 'active',    clientName: 'Гость', dishes: [{ dishId: 1,  name: 'Брускетта с томатами',    total: 4, remaining: 4, comment: '', status: 'pending' }, { dishId: 5,  name: 'Пицца Маргарита',          total: 3, remaining: 3, comment: '', status: 'pending' }, { dishId: 6,  name: 'Пицца Пепперони',         total: 2, remaining: 2, comment: '', status: 'pending' }, { dishId: 9,  name: 'Спагетти Карбонара', total: 2, remaining: 2, comment: '', status: 'pending' }, { dishId: 15, name: 'Тирамису', total: 3, remaining: 3, comment: '', status: 'pending' }, { dishId: 16, name: 'Панна котта', total: 2, remaining: 2, comment: '', status: 'pending' }] },
    { id: 'ord-7',   tableId: 7,  timeSlot: '18:00-20:00', sortMinutes: 1080, completed: false, status: 'active',    clientName: 'Гость', dishes: [{ dishId: 14, name: 'Ризотто с грибами',       total: 2, remaining: 2, comment: '', status: 'pending' }, { dishId: 12, name: 'Тортиллини с грибами',    total: 1, remaining: 1, comment: '', status: 'pending' }, { dishId: 17, name: 'Сабайон',                 total: 2, remaining: 2, comment: '', status: 'pending' }] },
    { id: 'ord-4',   tableId: 4,  timeSlot: '09:00-23:00', sortMinutes: 540,  completed: false, status: 'active',    clientName: 'Гость', dishes: [{ dishId: 2,  name: 'Капрезе',                 total: 2, remaining: 2, comment: '', status: 'pending' }, { dishId: 8,  name: 'Пицца с грибами',         total: 2, remaining: 2, comment: '', status: 'pending' }, { dishId: 10, name: 'Лазанья Болоньезе',        total: 1, remaining: 1, comment: '', status: 'pending' }, { dishId: 18, name: 'Крем-брюле',              total: 2, remaining: 2, comment: '', status: 'pending' }] },
    { id: 'ord-12',  tableId: 12, timeSlot: '19:00-21:00', sortMinutes: 1140, completed: false, status: 'active',    clientName: 'Гость', dishes: [{ dishId: 3,  name: 'Карпаччо из говядины',    total: 1, remaining: 1, comment: '', status: 'pending' }, { dishId: 13, name: 'Ризотто с морепродуктами', total: 2, remaining: 2, comment: '', status: 'pending' }, { dishId: 20, name: 'Просекко',                total: 2, remaining: 2, comment: '', status: 'pending' }] },
];

// ── main ─────────────────────────────────────────────────────────────────────

async function seed() {
    await initDB();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Roles
        console.log('Seeding roles...');
        for (const role of ROLES) {
            await client.query(
                `INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
                [role]
            );
        }

        // 2. Users
        console.log('Seeding users...');
        const userIdMap = {}; // email → user_id
        for (const u of USERS) {
            const existing = await client.query(
                `SELECT user_id FROM users WHERE email = $1`, [u.email]
            );
            if (existing.rows.length > 0) {
                userIdMap[u.email] = existing.rows[0].user_id;
                continue;
            }
            const hash = await bcrypt.hash(u.password, 10);
            const uid  = require('crypto').randomUUID();
            await client.query(
                `INSERT INTO users (user_id, name, email, password, role)
                 VALUES ($1, $2, $3, $4, $5)`,
                [uid, u.name, u.email, hash, u.role]
            );
            userIdMap[u.email] = uid;
        }

        // 3. Restaurant tables
        console.log('Seeding tables...');
        for (const t of TABLES) {
            await client.query(
                `INSERT INTO restaurant_tables (table_id, status)
                 VALUES ($1, $2)
                 ON CONFLICT (table_id) DO UPDATE SET status = EXCLUDED.status`,
                [t.id, t.status]
            );
            // Seed reservations (slots)
            for (const slot of t.slots) {
                const { start, end } = parseSlot(slot);
                // avoid duplicates
                const exists = await client.query(
                    `SELECT 1 FROM reservations
                     WHERE table_id=$1 AND time_start=$2 AND time_end=$3`,
                    [t.id, start, end]
                );
                if (exists.rows.length === 0) {
                    await client.query(
                        `INSERT INTO reservations (table_id, time_start, time_end)
                         VALUES ($1, $2, $3)`,
                        [t.id, start, end]
                    );
                }
            }
        }
        // Make sure the sequence starts above our manual IDs
        await client.query(
            `SELECT setval('restaurant_tables_table_id_seq',
                (SELECT MAX(table_id) FROM restaurant_tables))`
        );

        // 4. Categories
        console.log('Seeding categories...');
        const catIdMap = {}; // name → category_id
        for (const cat of CATEGORIES) {
            const res = await client.query(
                `INSERT INTO categories (name) VALUES ($1)
                 ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                 RETURNING category_id`,
                [cat]
            );
            catIdMap[cat] = res.rows[0].category_id;
        }

        // 5. Dishes
        console.log('Seeding dishes...');
        for (const d of MENU) {
            await client.query(
                `INSERT INTO dishes
                    (dish_id, name, price, category_id, weight, description,
                     image, recipe, cooking_time, ingredients)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                 ON CONFLICT (dish_id) DO NOTHING`,
                [
                    d.id, d.name, d.price, catIdMap[d.category],
                    d.weight, d.description, d.image,
                    d.recipe, d.cookingTime, d.ingredients
                ]
            );
        }
        await client.query(
            `SELECT setval('dishes_dish_id_seq', (SELECT MAX(dish_id) FROM dishes))`
        );

        // 6. Orders + order items
        console.log('Seeding orders...');
        for (const o of ORDERS) {
            const existing = await client.query(
                `SELECT 1 FROM orders WHERE order_id = $1`, [o.id]
            );
            if (existing.rows.length > 0) continue;

            const { start, end } = parseSlot(o.timeSlot);
            await client.query(
                `INSERT INTO orders
                    (order_id, table_id, user_id, client_name,
                     time_start, time_end, sort_minutes, status, completed)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                [
                    o.id, o.tableId, null, o.clientName,
                    start, end, o.sortMinutes, o.status, o.completed
                ]
            );
            for (const dish of o.dishes) {
                await client.query(
                    `INSERT INTO order_items
                        (order_id, dish_id, dish_name, quantity, remaining, comment, status)
                     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                    [o.id, dish.dishId, dish.name, dish.total, dish.remaining, dish.comment, dish.status]
                );
            }
        }

        await client.query('COMMIT');
        console.log('✅ Seed complete');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', err.message);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch(() => process.exit(1));
