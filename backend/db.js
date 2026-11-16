const fs = require("fs");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: fs.readFileSync("./certs/prod-ca-2021.crt", "utf8"),
    rejectUnauthorized: true,
  },
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;