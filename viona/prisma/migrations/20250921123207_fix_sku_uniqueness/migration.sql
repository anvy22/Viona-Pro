/*
  Warnings:

  - A unique constraint covering the columns `[org_id,sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Made the column `org_id` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_org_id_fkey";

-- DropIndex
DROP INDEX "public"."Product_sku_key";

-- AlterTable
ALTER TABLE "public"."Product" ALTER COLUMN "org_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_org_id_sku_key" ON "public"."Product"("org_id", "sku");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."Organization"("org_id") ON DELETE RESTRICT ON UPDATE CASCADE;
