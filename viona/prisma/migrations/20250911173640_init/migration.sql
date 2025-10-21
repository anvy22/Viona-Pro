-- CreateTable
CREATE TABLE "public"."Warehouse" (
    "warehouse_id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("warehouse_id")
);

-- CreateTable
CREATE TABLE "public"."Admin" (
    "admin_id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "public"."Employee" (
    "employee_id" BIGSERIAL NOT NULL,
    "admin_id" BIGINT NOT NULL,
    "name" TEXT,
    "category" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "hire_date" TIMESTAMP(3),
    "salary" DECIMAL(65,30),
    "permission" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "product_id" BIGSERIAL NOT NULL,
    "sku" TEXT,
    "name" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "status" TEXT,
    "created_by" BIGINT,
    "modified_by" BIGINT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "public"."ProductStock" (
    "stock_id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "warehouse_id" BIGINT NOT NULL,
    "quantity" INTEGER,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("stock_id")
);

-- CreateTable
CREATE TABLE "public"."ProductPrice" (
    "price_id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "actual_price" DECIMAL(65,30),
    "retail_price" DECIMAL(65,30),
    "market_price" DECIMAL(65,30),
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),

    CONSTRAINT "ProductPrice_pkey" PRIMARY KEY ("price_id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "order_id" BIGSERIAL NOT NULL,
    "placed_by" BIGINT,
    "updated_by" BIGINT,
    "order_date" TIMESTAMP(3),
    "status" TEXT,
    "total_amount" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "order_item_id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "quantity" INTEGER,
    "price_at_order" DECIMAL(65,30),

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "public"."Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product"("sku");

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."Admin"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."Admin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_modified_by_fkey" FOREIGN KEY ("modified_by") REFERENCES "public"."Admin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductStock" ADD CONSTRAINT "ProductStock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductStock" ADD CONSTRAINT "ProductStock_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."Warehouse"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPrice" ADD CONSTRAINT "ProductPrice_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_placed_by_fkey" FOREIGN KEY ("placed_by") REFERENCES "public"."Admin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."Admin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
