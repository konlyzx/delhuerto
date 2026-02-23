import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("delhuerto.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('producer', 'consumer')) NOT NULL,
    location TEXT,
    description TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producer_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    unit TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    category TEXT,
    image_url TEXT,
    FOREIGN KEY (producer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consumer_id TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consumer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  -- Seed Data
  INSERT OR IGNORE INTO users (id, name, email, password, role, location, description) VALUES 
  (1, 'Granja El Olivo', 'olivo@farm.com', 'password', 'producer', 'Valle Central', 'Productores de aceite de oliva y hortalizas orgánicas.'),
  (2, 'Huerto Familiar', 'huerto@farm.com', 'password', 'producer', 'Zona Norte', 'Especialistas en frutas de temporada y miel pura.');

  INSERT OR IGNORE INTO products (id, producer_id, name, description, price, unit, stock, category, image_url) VALUES 
  (1, 1, 'Aceite de Oliva Extra Virgen', 'Prensado en frío, 100% orgánico.', 12.50, 'litro', 50, 'Aceites', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800'),
  (2, 1, 'Tomates Cherry', 'Dulces y jugosos, recién cosechados.', 3.00, 'kg', 20, 'Verduras', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800'),
  (3, 2, 'Miel de Abeja Multifloral', 'Miel pura de flores silvestres.', 8.00, 'frasco', 15, 'Despensa', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800'),
  (4, 2, 'Manzanas Rojas', 'Crujientes y dulces, sin pesticidas.', 2.50, 'kg', 100, 'Frutas', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?auto=format&fit=crop&q=80&w=800');
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Endpoints (Simplified for MVP)
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(name, email, password, role);
      const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(info.lastInsertRowid);
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT id, name, email, role, location, description, image_url FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Products Endpoints
  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, u.name as producer_name, u.location as producer_location 
      FROM products p 
      JOIN users u ON p.producer_id = u.id
    `).all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { producer_id, name, description, price, unit, stock, category, image_url } = req.body;
    const info = db.prepare(`
      INSERT INTO products (producer_id, name, description, price, unit, stock, category, image_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(producer_id, name, description, price, unit, stock, category, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, description, price, unit, stock, category, image_url } = req.body;
    db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, unit = ?, stock = ?, category = ?, image_url = ?
      WHERE id = ?
    `).run(name, description, price, unit, stock, category, image_url, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Producer Profile
  app.get("/api/producers/:id", (req, res) => {
    const producer = db.prepare("SELECT id, name, email, location, description, image_url FROM users WHERE id = ? AND role = 'producer'").get(req.params.id);
    const products = db.prepare("SELECT * FROM products WHERE producer_id = ?").all(req.params.id);
    res.json({ ...producer, products });
  });

  // Orders
  app.get("/api/orders/:consumer_id", (req, res) => {
    try {
      const orders = db.prepare("SELECT * FROM orders WHERE consumer_id = ? ORDER BY created_at DESC").all(req.params.consumer_id);

      const ordersWithItems = orders.map((order: any) => {
        const items = db.prepare(`
          SELECT oi.*, p.name 
          FROM order_items oi 
          JOIN products p ON oi.product_id = p.id 
          WHERE oi.order_id = ?
        `).all(order.id);
        return { ...order, items };
      });
      res.json(ordersWithItems);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", (req, res) => {
    const { consumer_id, items, total } = req.body;
    const transaction = db.transaction(() => {
      const info = db.prepare("INSERT INTO orders (consumer_id, total) VALUES (?, ?)").run(consumer_id, total);
      const orderId = info.lastInsertRowid;
      const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
      const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

      for (const item of items) {
        insertItem.run(orderId, item.id, item.quantity, item.price);
        updateStock.run(item.quantity, item.id);
      }
      return orderId;
    });

    try {
      const orderId = transaction();
      res.json({ id: orderId });
    } catch (e: any) {
      console.error("Failed to insert order:", e);
      res.status(400).json({ error: "Order failed", details: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
