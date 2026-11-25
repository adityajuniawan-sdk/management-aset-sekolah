
const path = require("path");
const fs = require("fs");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const certificatePath = path.join(
  __dirname,
  "certs",
  "prod-ca-2021.crt"
);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: fs.readFileSync(certificatePath, "utf8"),
    rejectUnauthorized: true,
  },
});

const prisma = new PrismaClient({
  adapter,
});

module.exports = prisma;
