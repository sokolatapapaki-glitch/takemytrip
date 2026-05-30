/*
  Warnings:

  - You are about to drop the `ManyOne` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ManyTwo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductChild` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestTable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ManyOneToManyTwo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductChild" DROP CONSTRAINT "ProductChild_productId_fkey";

-- DropForeignKey
ALTER TABLE "_ManyOneToManyTwo" DROP CONSTRAINT "_ManyOneToManyTwo_A_fkey";

-- DropForeignKey
ALTER TABLE "_ManyOneToManyTwo" DROP CONSTRAINT "_ManyOneToManyTwo_B_fkey";

-- DropTable
DROP TABLE "ManyOne";

-- DropTable
DROP TABLE "ManyTwo";

-- DropTable
DROP TABLE "ProductChild";

-- DropTable
DROP TABLE "TestTable";

-- DropTable
DROP TABLE "_ManyOneToManyTwo";
