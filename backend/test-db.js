require("dotenv").config();

const prisma = require("./db");

async function testConnection() {
  try {
    const totalRole = await prisma.role.count();

    console.log("KONEKSI BERHASIL!");
    console.log("Total data role:", totalRole);
  } catch (error) {
    console.error("ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();