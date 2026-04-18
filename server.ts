import express from "express";
import pkg from 'pg';
const { Pool } = pkg;
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import Stripe from "stripe";
import os from "os";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email Config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

let stripe: Stripe | null = null;
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!stripe && key && key.startsWith('sk_')) {
    stripe = new Stripe(key);
  }
  return stripe;
};

// Ensure uploads directory exists in the writable /tmp directory
const uploadDir = path.join(os.tmpdir(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('neon') ? { rejectUnauthorized: false } : false
});

async function initDb() {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL connected.");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        type TEXT,
        price INTEGER,
        capacity INTEGER,
        available INTEGER,
        description TEXT,
        image TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        room_id INTEGER,
        user_name TEXT,
        user_email TEXT,
        user_phone TEXT,
        check_in TEXT,
        check_out TEXT,
        services TEXT,
        total_price INTEGER,
        status TEXT DEFAULT 'pending'
      );

      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        otp TEXT,
        expires_at TIMESTAMP
      );
    `);
    console.log("Tables initialized.");

    // Seed data if empty
    const res = await client.query("SELECT COUNT(*) as count FROM rooms");
    const count = parseInt(res.rows[0].count);
    console.log(`Current room count: ${count}`);
    
    if (count === 0) {
      console.log("Seeding database with initial rooms...");
      await client.query(
        "INSERT INTO rooms (type, price, capacity, available, description, image) VALUES ($1, $2, $3, $4, $5, $6)",
        ["Single Deluxe", 12000, 1, 5, "Private room with AC and attached balcony.", "https://picsum.photos/seed/room1/800/600"]
      );
      await client.query(
        "INSERT INTO rooms (type, price, capacity, available, description, image) VALUES ($1, $2, $3, $4, $5, $6)",
        ["Double Sharing", 8000, 2, 8, "Spacious room for two with individual cupboards.", "https://picsum.photos/seed/room2/800/600"]
      );
      await client.query(
        "INSERT INTO rooms (type, price, capacity, available, description, image) VALUES ($1, $2, $3, $4, $5, $6)",
        ["Triple Sharing", 6000, 3, 12, "Economical sharing room with all basic amenities.", "https://picsum.photos/seed/room3/800/600"]
      );
      console.log("Seeding complete.");
    }
    client.release();
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}

async function startServer() {
  await initDb();
  
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use("/uploads", express.static(uploadDir));

  // OTP Endpoints
  app.post("/api/otp/send", async (req, res) => {
    const { email } = req.body;
    
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "DATABASE_URL is not set. Please add it to your Secrets or .env file." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    try {
      await pool.query(
        "INSERT INTO otps (email, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp = $2, expires_at = $3",
        [email, otp, expiresAt]
      );

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: `"StayEase" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Your OTP for StayEase Account",
          text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
          html: `<b>Your OTP is ${otp}</b>. It will expire in 10 minutes.`,
        });
        console.log(`OTP sent to ${email}`);
        res.json({ success: true, message: "OTP sent to your email." });
      } else {
        console.log(`DEMO MODE: OTP for ${email} is ${otp}`);
        // Return OTP in response for testing if email is not configured
        res.json({ 
          success: true, 
          message: "OTP generated in Demo Mode.", 
          demoOtp: otp 
        });
      }
    } catch (err) {
      console.error("OTP send error:", err);
      res.status(500).json({ error: "Failed to send OTP. Check if DATABASE_URL is correct." });
    }
  });

  app.post("/api/password/reset-request", async (req, res) => {
    const { email } = req.body;
    try {
      const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (userRes.rowCount === 0) {
        return res.status(404).json({ error: "User not found with this email." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await pool.query(
        "INSERT INTO otps (email, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp = $2, expires_at = $3",
        [email, otp, expiresAt]
      );

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: `"StayEase" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Password Reset OTP",
          text: `Your OTP for password reset is ${otp}.`,
          html: `<b>Your OTP for password reset is ${otp}</b>.`
        });
        res.json({ success: true, message: "Reset OTP sent." });
      } else {
        res.json({ success: true, demoOtp: otp, message: "Demo reset OTP generated." });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to process reset request." });
    }
  });

  app.post("/api/password/reset-confirm", async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
      const otpRes = await pool.query("SELECT * FROM otps WHERE email = $1 AND otp = $2", [email, otp]);
      if (otpRes.rowCount === 0 || new Date() > new Date(otpRes.rows[0].expires_at)) {
        return res.status(400).json({ error: "Invalid or expired OTP." });
      }

      await pool.query("UPDATE users SET password = $1 WHERE email = $2", [newPassword, email]);
      await pool.query("DELETE FROM otps WHERE email = $1", [email]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to reset password." });
    }
  });

  // API Routes
  app.post("/api/signup", async (req, res) => {
    const { name, email, password, otp } = req.body;
    try {
      // First verify OTP
      const otpRes = await pool.query(
        "SELECT * FROM otps WHERE email = $1 AND otp = $2",
        [email, otp]
      );
      
      const otpRow = otpRes.rows[0];
      if (!otpRow) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      if (new Date() > new Date(otpRow.expires_at)) {
        return res.status(400).json({ error: "OTP expired" });
      }

      // If OTP valid, create user
      const result = await pool.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
        [name, email, password]
      );

      // Delete OTP after used
      await pool.query("DELETE FROM otps WHERE email = $1", [email]);

      res.json({ success: true, userId: result.rows[0].id });
    } catch (error: any) {
      if (error.message.includes("unique constraint")) {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Signup failed" });
      }
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND password = $2",
        [email, password]
      );
      const user = result.rows[0];
      if (user) {
        res.json({ 
          success: true, 
          user: { id: user.id, name: user.name, email: user.email, role: user.role } 
        });
      } else {
        res.status(401).json({ error: "Invalid email or password" });
      }
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/health", async (req, res) => {
    try {
      const result = await pool.query("SELECT COUNT(*) as count FROM rooms");
      res.json({ status: "ok", roomCount: parseInt(result.rows[0].count) });
    } catch (error) {
      res.json({ status: "error", error: (error as Error).message });
    }
  });

  app.get("/api/rooms", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM rooms ORDER BY id ASC");
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Internal server error", details: (error as Error).message });
    }
  });

  // Admin: Upload Image
  app.post("/api/admin/upload", (req, res) => {
    upload.single("image")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: "File upload error: " + err.message });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      try {
        const isCloudinaryConfigured = 
          process.env.CLOUDINARY_CLOUD_NAME && 
          process.env.CLOUDINARY_CLOUD_NAME !== "Root" && 
          process.env.CLOUDINARY_API_KEY && 
          process.env.CLOUDINARY_API_SECRET;

        if (isCloudinaryConfigured) {
          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
          });
          const b64 = Buffer.from(req.file.buffer).toString("base64");
          const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
          const result = await cloudinary.uploader.upload(dataURI, { folder: "stayease-rooms" });
          return res.json({ imageUrl: result.secure_url });
        } else {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
          const filename = uniqueSuffix + path.extname(req.file.originalname);
          const filePath = path.join(uploadDir, filename);
          fs.writeFileSync(filePath, req.file.buffer);
          return res.json({ imageUrl: `/uploads/${filename}` });
        }
      } catch (uploadError: any) {
        return res.status(500).json({ error: "Upload failed: " + uploadError.message });
      }
    });
  });

  // Admin: Add Room
  app.post("/api/admin/rooms", async (req, res) => {
    const { type, price, capacity, available, description, image } = req.body;
    if (!type || !price || !capacity || isNaN(price) || isNaN(capacity)) {
      return res.status(400).json({ error: "Invalid room data." });
    }
    try {
      const result = await pool.query(
        "INSERT INTO rooms (type, price, capacity, available, description, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [type, Number(price), Number(capacity), Number(available || 0), description, image || ""]
      );
      res.json({ success: true, id: result.rows[0].id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Update Room
  app.put("/api/admin/rooms/:id", async (req, res) => {
    const { id } = req.params;
    const { type, price, capacity, available, description, image } = req.body;
    try {
      await pool.query(
        "UPDATE rooms SET type = $1, price = $2, capacity = $3, available = $4, description = $5, image = $6 WHERE id = $7",
        [type, Number(price), Number(capacity), Number(available || 0), description, image || "", id]
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Delete Room
  app.delete("/api/admin/rooms/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const resCount = await pool.query("SELECT COUNT(*) as count FROM bookings WHERE room_id = $1", [id]);
      if (parseInt(resCount.rows[0].count) > 0) {
        return res.status(400).json({ error: "Cannot delete room with existing bookings." });
      }
      const result = await pool.query("DELETE FROM rooms WHERE id = $1", [id]);
      if (result.rowCount === 0) return res.status(404).json({ error: "Room not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User: Get Bookings
  app.get("/api/user/bookings", async (req, res) => {
    const { email } = req.query;
    try {
      const result = await pool.query(`
        SELECT b.*, r.type as room_type 
        FROM bookings b 
        LEFT JOIN rooms r ON b.room_id = r.id 
        WHERE b.user_email = $1
      `, [email]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User: Update Booking Services
  app.put("/api/user/bookings/:id/services", async (req, res) => {
    const { id } = req.params;
    const { services, totalPrice } = req.body;
    try {
      await pool.query(
        "UPDATE bookings SET services = $1, total_price = $2 WHERE id = $3",
        [JSON.stringify(services), totalPrice, id]
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User: Delete/Cancel Booking
  app.delete("/api/bookings/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM bookings WHERE id = $1 AND status = 'pending'", [id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/book", async (req, res) => {
    const { roomId, name, email, phone, checkIn, checkOut, services, totalPrice } = req.body;
    try {
      const result = await pool.query(`
        INSERT INTO bookings (room_id, user_name, user_email, user_phone, check_in, check_out, services, total_price, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING id
      `, [roomId, name, email, phone, checkIn, checkOut || '', JSON.stringify(services), totalPrice]);
      res.json({ success: true, bookingId: result.rows[0].id });
    } catch (error) {
      res.status(500).json({ error: "Booking failed" });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    const { bookingId, roomType, totalPrice, roomId } = req.body;
    const stripeClient = getStripe();
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    if (!stripeClient) return res.json({ url: `${baseUrl}/success.html?bookingId=${bookingId}` });

    try {
      const amount = Math.max(1, Math.round(Number(totalPrice)));
      const session = await stripeClient.checkout.sessions.create({
        automatic_payment_methods: {
          enabled: true,
        },
        line_items: [{
          price_data: {
            currency: "inr",
            product_data: { name: `StayEase: ${roomType || 'Room'}`, description: `ID: ${bookingId}` },
            unit_amount: amount * 100,
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `${baseUrl}/success.html?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/book.html?id=${roomId}`,
        metadata: { bookingId: bookingId.toString() },
      } as any);
      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/confirm-booking", async (req, res) => {
    const { bookingId } = req.body;
    try {
      await pool.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [bookingId]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Confirmation failed" });
    }
  });

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.includes('.') && !req.path.startsWith('/api')) {
      const htmlPath = path.join(__dirname, "public", `${req.path}.html`);
      if (fs.existsSync(htmlPath)) return res.sendFile(htmlPath);
    }
    next();
  });
  app.use(express.static(path.join(__dirname, "public")));
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
