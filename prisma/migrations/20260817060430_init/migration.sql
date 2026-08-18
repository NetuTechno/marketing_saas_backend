-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "warehouseCode" TEXT NOT NULL,
    "shipToName" TEXT NOT NULL,
    "shipToState" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "orderPlaceDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_orderId_idx" ON "Order"("orderId");

-- CreateIndex
CREATE INDEX "Order_warehouseCode_idx" ON "Order"("warehouseCode");

-- CreateIndex
CREATE INDEX "Order_shipToState_idx" ON "Order"("shipToState");

-- CreateIndex
CREATE INDEX "Order_sku_idx" ON "Order"("sku");

-- CreateIndex
CREATE INDEX "Order_orderPlaceDate_idx" ON "Order"("orderPlaceDate");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_sku_key" ON "Order"("orderId", "sku");
