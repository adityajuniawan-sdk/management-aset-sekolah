
require("dotenv").config();

const prisma = require("./db");

const roles = [
  "SUPER_ADMIN",
  "ADMIN_SEKOLAH",
  "PETUGAS_ASET",
  "KEPALA_SEKOLAH",
  "GURU_STAFF",
];

async function seedRoles() {
  try {
    for (const name of roles) {
      await prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }

    console.log("BERHASIL! 5 ROLE SUDAH DITAMBAHKAN.");

    const data = await prisma.role.findMany({
      orderBy: { name: "asc" },
    });

    console.log(data);
  } catch (error) {
    console.error("GAGAL:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedRoles();
