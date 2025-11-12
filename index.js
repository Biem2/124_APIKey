import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import mysql from "mysql2/promise";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Jalankan semua di dalam fungsi async
async function startServer() {
  try {
    // 🔗 Koneksi ke MySQL (dengan port)
    const db = await mysql.createConnection({
      host: "127.0.0.1",     // Ganti sesuai server kamu
      user: "root",          // Username MySQL
      password: "MieAyam678",// Password MySQL
      database: "token",     // Nama database kamu
      port: 3309             // ✅ Tambahkan port di sini (default MySQL: 3306)
    });

    console.log("✅ Terhubung ke database MySQL!");

    // Buat tabel otomatis kalau belum ada
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(64) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ✅ Endpoint generate token
    app.get("/generate", async (req, res) => {
      try {
        const token = crypto.randomBytes(16).toString("hex");
        await db.execute("INSERT INTO tokens (token) VALUES (?)", [token]);
        res.json({ token, message: "Token berhasil dibuat di server" });
      } catch (error) {
        console.error("Error generate token:", error);
        res.status(500).json({ message: "Gagal membuat token" });
      }
    });

    // ✅ Endpoint verifikasi token
    app.post("/verify", async (req, res) => {
      try {
        const { token } = req.body;
        const [rows] = await db.execute("SELECT * FROM tokens WHERE token = ?", [token]);

        if (rows.length > 0) {
          res.json({ valid: true, message: "✅ Token valid" });
        } else {
          res.json({ valid: false, message: "❌ Token tidak valid" });
        }
      } catch (error) {
        console.error("Error verify token:", error);
        res.status(500).json({ message: "Terjadi kesalahan di server" });
      }
    });

    // Jalankan server setelah koneksi berhasil
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Gagal terhubung ke database MySQL:", err.message);
    process.exit(1); // hentikan aplikasi
  }
}

// Panggil fungsi utama
startServer();
