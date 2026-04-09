// Run with: node scripts/createAdmin.js
// Reads admin credentials from your backend .env file

import bcrypt from "bcrypt";
import db     from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const ADMIN_NAME     = process.env.ADMIN_NAME     || "Admin";
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Admin email and password missing in the .env file.");
  process.exit(1);
}

async function createAdmin() {
  try {
    const [existing] = await db.execute(
      "SELECT user_id, role FROM users WHERE email = ? LIMIT 1",
      [ADMIN_EMAIL]
    );

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    if (existing.length > 0) {
      await db.execute(
        "UPDATE users SET password = ?, role = 'admin', name = ? WHERE email = ?",
        [hash, ADMIN_NAME, ADMIN_EMAIL]
      );
      console.log(" Existing user updated to admin with new password.");
    } else {
      await db.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
        [ADMIN_NAME, ADMIN_EMAIL, hash]
      );
      console.log("Admin user created!");
    }

    console.log(`\n   Login at:  http://localhost:5173/admin/login`);
    console.log(`   Email:     ${ADMIN_EMAIL}`);
    console.log(`   Password:  (as set in the .env)\n`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

createAdmin();