/*
  Warnings:

  - You are about to drop the column `admin_id` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `user_id` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Employee" DROP CONSTRAINT "Employee_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_placed_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_modified_by_fkey";

-- AlterTable
ALTER TABLE "public"."Employee" DROP COLUMN "admin_id",
ADD COLUMN     "user_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "org_id" BIGINT;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "org_id" BIGINT;

-- AlterTable
ALTER TABLE "public"."Warehouse" ADD COLUMN     "org_id" BIGINT;

-- DropTable
DROP TABLE "public"."Admin";

-- CreateTable
CREATE TABLE "public"."Organization" (
    "org_id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("org_id")
);

-- CreateTable
CREATE TABLE "public"."OrganizationInvite" (
    "invite_id" BIGSERIAL NOT NULL,
    "org_id" BIGINT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "OrganizationInvite_pkey" PRIMARY KEY ("invite_id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "user_id" BIGSERIAL NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."OrganizationMember" (
    "id" BIGSERIAL NOT NULL,
    "org_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvite_token_key" ON "public"."OrganizationInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerk_id_key" ON "public"."User"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "OrganizationMember_org_id_idx" ON "public"."OrganizationMember"("org_id");

-- CreateIndex
CREATE INDEX "OrganizationMember_user_id_idx" ON "public"."OrganizationMember"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_org_id_user_id_key" ON "public"."OrganizationMember"("org_id", "user_id");

-- CreateIndex
CREATE INDEX "Order_org_id_idx" ON "public"."Order"("org_id");

-- CreateIndex
CREATE INDEX "Product_org_id_idx" ON "public"."Product"("org_id");

-- CreateIndex
CREATE INDEX "Warehouse_org_id_idx" ON "public"."Warehouse"("org_id");

-- AddForeignKey
ALTER TABLE "public"."Organization" ADD CONSTRAINT "Organization_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationInvite" ADD CONSTRAINT "OrganizationInvite_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."Organization"("org_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Warehouse" ADD CONSTRAINT "Warehouse_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."Organization"("org_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_modified_by_fkey" FOREIGN KEY ("modified_by") REFERENCES "public"."User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."Organization"("org_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_placed_by_fkey" FOREIGN KEY ("placed_by") REFERENCES "public"."User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."Organization"("org_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."Organization"("org_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
