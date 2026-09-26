// api/index.ts
import express from "express";
import cors from "cors";
import { createClient } from "@libsql/client/web";
var DEFAULT_TURSO_URL = "libsql://quoteflow-db-saivyshnav1027-stack.aws-ap-south-1.turso.io";
var DEFAULT_TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0NDg3MjQsImlkIjoiMDFhMGRmMGMtYmQwMS03OWQ1LTkyYTUtMjE2MDdhN2U1N2M5Iiwia2lkIjoiR2swVEt2LUphQmVGMkxaVHFSV3RDYUltOFE4YnIweHBFVFlDUzJzMXFaayIsInJpZCI6IjUzYTAyNmI5LWQxNmEtNDc2Yi1hYzg3LWFiOTVhMWY1YzNmNCJ9.B44Vmgfr2EWmCJu-h3xorAv7wePo5Sq97Rdhmr0FdYYYSiy2Wrur1kEEW-ALINqb-f_7QnhfOgOTxUNBSY8bBA";
var tursoUrl = (process.env.TURSO_DATABASE_URL || DEFAULT_TURSO_URL)?.trim();
var tursoToken = (process.env.TURSO_AUTH_TOKEN || DEFAULT_TURSO_TOKEN)?.trim();
var db = createClient({
  url: tursoUrl,
  authToken: tursoToken
});
var isUsingTurso = true;
async function initSchema() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customer_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type_name TEXT NOT NULL UNIQUE,
        markup_percentage REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        customer_type_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_type_id) REFERENCES customer_types(id)
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_code TEXT NOT NULL UNIQUE,
        product_name TEXT NOT NULL,
        unit TEXT NOT NULL DEFAULT 'Pcs.',
        list_price REAL NOT NULL DEFAULT 0.0,
        discount_percentage REAL NOT NULL DEFAULT 0.0,
        cost_price REAL NOT NULL DEFAULT 0.0,
        stock_quantity REAL NOT NULL DEFAULT 0.0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS quotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_number TEXT NOT NULL UNIQUE,
        customer_id INTEGER,
        customer_type_id INTEGER,
        markup_percentage REAL NOT NULL DEFAULT 0.0,
        subtotal REAL NOT NULL DEFAULT 0.0,
        total_units REAL NOT NULL DEFAULT 0.0,
        total REAL NOT NULL DEFAULT 0.0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (customer_type_id) REFERENCES customer_types(id)
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS quotation_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_id INTEGER NOT NULL,
        product_id INTEGER,
        description TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1.0,
        unit TEXT NOT NULL DEFAULT 'Pcs.',
        list_price REAL NOT NULL DEFAULT 0.0,
        discount_percentage REAL NOT NULL DEFAULT 0.0,
        price REAL NOT NULL DEFAULT 0.0,
        line_total REAL NOT NULL DEFAULT 0.0,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
  } catch (err) {
    console.error("[Schema Init Error]", err);
  }
}
var app = express();
app.use(cors());
app.use(express.json());
initSchema().catch((err) => console.error("[DB Boot Init Error]", err));
app.get(["/api", "/"], (_req, res) => {
  res.json({
    success: true,
    message: "Sri Venkateshwara Trading QuoteFlow API online",
    isUsingTurso: true
  });
});
app.get(["/api/test-db", "/test-db"], async (_req, res) => {
  try {
    const result = await db.execute("SELECT 1 AS connected");
    res.json({
      success: true,
      message: isUsingTurso ? "QuoteFlow connected to Turso Cloud DB successfully!" : "QuoteFlow connected to Local SQLite (file:local.db) successfully!",
      isUsingTurso,
      result: result.rows
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: String(error)
    });
  }
});
app.get(["/api/customer-types", "/customer-types"], async (_req, res) => {
  try {
    const result = await db.execute(`
      SELECT id, type_name, markup_percentage
      FROM customer_types
      ORDER BY id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch customer types error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch customer types" });
  }
});
app.put(["/api/customer-types/:id", "/customer-types/:id"], async (req, res) => {
  try {
    const id = Number(req.params.id);
    const markup = Number(req.body.markup);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Invalid customer type ID" });
    }
    if (Number.isNaN(markup)) {
      return res.status(400).json({ success: false, message: "Invalid markup percentage" });
    }
    await db.execute({
      sql: `UPDATE customer_types SET markup_percentage = ? WHERE id = ?`,
      args: [markup, id]
    });
    const result = await db.execute({
      sql: `SELECT id, type_name, markup_percentage FROM customer_types WHERE id = ?`,
      args: [id]
    });
    res.json({ success: true, customerType: result.rows[0] });
  } catch (error) {
    console.error("Update customer type error:", error);
    res.status(500).json({ success: false, message: "Failed to update customer type" });
  }
});
app.get(["/api/customers", "/customers"], async (_req, res) => {
  try {
    const result = await db.execute(`
      SELECT
        c.id,
        c.customer_name,
        c.phone,
        c.customer_type_id,
        ct.type_name,
        ct.markup_percentage
      FROM customers c
      LEFT JOIN customer_types ct ON c.customer_type_id = ct.id
      ORDER BY c.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch customers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch customers" });
  }
});
app.post(["/api/customers", "/customers"], async (req, res) => {
  try {
    const customerName = String(req.body.customerName ?? "").trim();
    const phone = String(req.body.phone ?? "").trim();
    const customerTypeId = Number(req.body.customerTypeId || 1);
    if (!customerName) {
      return res.status(400).json({ success: false, message: "Customer name is required" });
    }
    const result = await db.execute({
      sql: `INSERT INTO customers (customer_name, phone, customer_type_id) VALUES (?, ?, ?)`,
      args: [customerName, phone, customerTypeId]
    });
    const createdId = Number(result.lastInsertRowid);
    const fetchResult = await db.execute({
      sql: `
        SELECT c.id, c.customer_name, c.phone, c.customer_type_id, ct.type_name, ct.markup_percentage
        FROM customers c
        LEFT JOIN customer_types ct ON c.customer_type_id = ct.id
        WHERE c.id = ?
      `,
      args: [createdId]
    });
    res.status(201).json({
      success: true,
      customer: fetchResult.rows[0]
    });
  } catch (error) {
    console.error("Create customer error:", error);
    res.status(500).json({ success: false, message: "Failed to create customer" });
  }
});
app.put(["/api/customers/:id", "/customers/:id"], async (req, res) => {
  try {
    const id = Number(req.params.id);
    const customerName = String(req.body.customerName ?? "").trim();
    const phone = String(req.body.phone ?? "").trim();
    const customerTypeId = Number(req.body.customerTypeId || 1);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }
    if (!customerName) {
      return res.status(400).json({ success: false, message: "Customer name is required" });
    }
    await db.execute({
      sql: `UPDATE customers SET customer_name = ?, phone = ?, customer_type_id = ? WHERE id = ?`,
      args: [customerName, phone, customerTypeId, id]
    });
    res.json({ success: true, message: "Customer updated successfully" });
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({ success: false, message: "Failed to update customer" });
  }
});
app.get(["/api/products", "/products"], async (_req, res) => {
  try {
    const result = await db.execute(`
      SELECT
        id,
        product_code,
        product_name,
        unit,
        list_price,
        discount_percentage,
        cost_price,
        stock_quantity,
        created_at
      FROM products
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});
app.post(["/api/products", "/products"], async (req, res) => {
  try {
    let productCode = String(req.body.productCode ?? "").trim();
    const productName = String(req.body.productName ?? "").trim();
    const unit = String(req.body.unit ?? "Pcs.").trim();
    const listPrice = Number(req.body.listPrice || 0);
    const discountPercentage = Number(req.body.discountPercentage || 0);
    let costPrice = Number(req.body.costPrice || 0);
    const stockQuantity = Number(req.body.stockQuantity || 100);
    if (!productName) {
      return res.status(400).json({ success: false, message: "Product name is required" });
    }
    if (!productCode) {
      const countRes = await db.execute("SELECT COUNT(*) as count FROM products");
      const nextNum = Number(countRes.rows[0].count) + 1;
      productCode = `SKU-${String(nextNum).padStart(4, "0")}`;
    }
    if (costPrice <= 0 && listPrice > 0) {
      costPrice = Number((listPrice * (1 - discountPercentage / 100)).toFixed(2));
    }
    const existing = await db.execute({
      sql: `SELECT id FROM products WHERE product_code = ?`,
      args: [productCode]
    });
    if (existing.rows.length > 0) {
      productCode = `${productCode}-${Math.floor(100 + Math.random() * 900)}`;
    }
    const result = await db.execute({
      sql: `
        INSERT INTO products 
        (product_code, product_name, unit, list_price, discount_percentage, cost_price, stock_quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [productCode, productName, unit, listPrice, discountPercentage, costPrice, stockQuantity]
    });
    const newId = Number(result.lastInsertRowid);
    const fetchRes = await db.execute({
      sql: `SELECT * FROM products WHERE id = ?`,
      args: [newId]
    });
    res.status(201).json({
      success: true,
      product: fetchRes.rows[0]
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ success: false, message: "Failed to create product" });
  }
});
app.put(["/api/products/:id", "/products/:id"], async (req, res) => {
  try {
    const id = Number(req.params.id);
    const productCode = String(req.body.productCode ?? "").trim();
    const productName = String(req.body.productName ?? "").trim();
    const unit = String(req.body.unit ?? "Pcs.").trim();
    const listPrice = Number(req.body.listPrice || 0);
    const discountPercentage = Number(req.body.discountPercentage || 0);
    const costPrice = Number(req.body.costPrice || 0);
    const stockQuantity = Number(req.body.stockQuantity || 0);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    if (!productName) {
      return res.status(400).json({ success: false, message: "Product name is required" });
    }
    await db.execute({
      sql: `
        UPDATE products
        SET product_code = ?, product_name = ?, unit = ?, list_price = ?, discount_percentage = ?, cost_price = ?, stock_quantity = ?
        WHERE id = ?
      `,
      args: [productCode, productName, unit, listPrice, discountPercentage, costPrice, stockQuantity, id]
    });
    res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ success: false, message: "Failed to update product" });
  }
});
app.delete(["/api/products/:id", "/products/:id"], async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    await db.execute({
      sql: `DELETE FROM products WHERE id = ?`,
      args: [id]
    });
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
});
app.post(["/api/quotations", "/quotations"], async (req, res) => {
  try {
    const customerId = req.body.customerId ? Number(req.body.customerId) : null;
    const customerName = String(req.body.customerName || "Guest Walk-In");
    const customerPhone = String(req.body.customerPhone || "");
    const customerTypeId = req.body.customerTypeId ? Number(req.body.customerTypeId) : 1;
    const markupPercentage = Number(req.body.markupPercentage || 0);
    const items = req.body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "At least one item is required" });
    }
    let subtotal = 0;
    let totalUnits = 0;
    const processedItems = items.map((item) => {
      const qty = Number(item.quantity || 1);
      const listPrice = Number(item.listPrice || 0);
      const dis = Number(item.discountPercentage || 0);
      let netPrice = Number(item.price);
      if (Number.isNaN(netPrice) || netPrice <= 0) {
        netPrice = listPrice > 0 ? Number((listPrice * (1 - dis / 100)).toFixed(2)) : 0;
      }
      if (markupPercentage > 0) {
        netPrice = Number((netPrice * (1 + markupPercentage / 100)).toFixed(2));
      }
      const lineTotal = Number((netPrice * qty).toFixed(2));
      subtotal += lineTotal;
      totalUnits += qty;
      return {
        productId: item.productId || null,
        description: item.description || "Custom Item",
        quantity: qty,
        unit: item.unit || "Pcs.",
        listPrice,
        discountPercentage: dis,
        price: netPrice,
        lineTotal
      };
    });
    const total = Number(subtotal.toFixed(2));
    totalUnits = Number(totalUnits.toFixed(2));
    const now = /* @__PURE__ */ new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const countRes = await db.execute("SELECT COUNT(*) as count FROM quotations");
    const nextCount = Number(countRes.rows[0].count) + 1;
    const quotationNumber = req.body.quotationNumber ? String(req.body.quotationNumber) : `EST-${2353 + nextCount}`;
    const quoteResult = await db.execute({
      sql: `
        INSERT INTO quotations 
        (quotation_number, customer_id, customer_type_id, markup_percentage, subtotal, total_units, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [quotationNumber, customerId, customerTypeId, markupPercentage, total, totalUnits, total]
    });
    const quotationId = Number(quoteResult.lastInsertRowid);
    for (const item of processedItems) {
      await db.execute({
        sql: `
          INSERT INTO quotation_items 
          (quotation_id, product_id, description, quantity, unit, list_price, discount_percentage, price, line_total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          quotationId,
          item.productId,
          item.description,
          item.quantity,
          item.unit,
          item.listPrice,
          item.discountPercentage,
          item.price,
          item.lineTotal
        ]
      });
    }
    res.status(201).json({
      success: true,
      message: "Quotation generated successfully",
      quotation: {
        id: quotationId,
        quotationNumber,
        customerId,
        customerName,
        customerPhone,
        customerTypeId,
        markupPercentage,
        subtotal: total,
        totalUnits,
        total,
        createdAt: now.toISOString(),
        items: processedItems
      }
    });
  } catch (error) {
    console.error("Create quotation error:", error);
    res.status(500).json({ success: false, message: "Failed to create quotation" });
  }
});
app.get(["/api/quotations", "/quotations"], async (_req, res) => {
  try {
    const result = await db.execute(`
      SELECT
        q.id,
        q.quotation_number,
        q.customer_id,
        COALESCE(c.customer_name, 'Guest Walk-In') AS customer_name,
        COALESCE(c.phone, '') AS phone,
        q.subtotal,
        q.total_units,
        q.total,
        q.created_at,
        COUNT(qi.id) AS item_count
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
      GROUP BY q.id
      ORDER BY q.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch quotations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch quotation history" });
  }
});
app.get(["/api/quotations/:id", "/quotations/:id"], async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Invalid quotation ID" });
    }
    const quoteRes = await db.execute({
      sql: `
        SELECT
          q.id,
          q.quotation_number,
          q.customer_id,
          COALESCE(c.customer_name, 'Guest Walk-In') AS customer_name,
          COALESCE(c.phone, '') AS phone,
          q.markup_percentage,
          q.subtotal,
          q.total_units,
          q.total,
          q.created_at
        FROM quotations q
        LEFT JOIN customers c ON q.customer_id = c.id
        WHERE q.id = ?
      `,
      args: [id]
    });
    if (quoteRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }
    const itemsRes = await db.execute({
      sql: `
        SELECT
          id,
          product_id,
          description,
          quantity,
          unit,
          list_price,
          discount_percentage,
          price,
          line_total
        FROM quotation_items
        WHERE quotation_id = ?
        ORDER BY id ASC
      `,
      args: [id]
    });
    res.json({
      success: true,
      quotation: {
        ...quoteRes.rows[0],
        items: itemsRes.rows
      }
    });
  } catch (error) {
    console.error("Fetch quotation details error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch quotation details" });
  }
});
export default function handler(req, res) {
  return app(req, res);
}

export {
  db,
  initSchema,
  isUsingTurso
};
