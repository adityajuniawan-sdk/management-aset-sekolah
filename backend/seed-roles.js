require("dotenv").config();

const prisma = require("./db");

const roles = [
  "ADMIN_SEKOLAH",
  "PETUGAS_ASET",
  "KEPALA_SEKOLAH",
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

    console.log("BERHASIL! 3 ROLE SUDAH DIPASTIKAN TERSEDIA.");

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