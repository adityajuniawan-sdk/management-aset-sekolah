-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "schoolUnitId" TEXT;

-- CreateTable
CREATE TABLE "SchoolUnit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolUnit_code_key" ON "SchoolUnit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolUnit_name_key" ON "SchoolUnit"("name");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_schoolUnitId_fkey" FOREIGN KEY ("schoolUnitId") REFERENCES "SchoolUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
