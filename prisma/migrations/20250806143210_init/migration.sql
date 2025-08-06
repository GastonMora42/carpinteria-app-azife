/*
  Warnings:

  - Added the required column `medioPagoId` to the `gastos_generales` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoLiquidacion" AS ENUM ('PORCENTAJE', 'MONTO_FIJO');

-- AlterTable
ALTER TABLE "gastos_generales" ADD COLUMN     "medioPagoId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "gastos_presupuesto" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "presupuestoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'PESOS',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comprobante" TEXT,
    "proveedor" TEXT,
    "notas" TEXT,
    "medioPagoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "detalle" TEXT,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "unidad" TEXT NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(5,2) DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gastos_presupuesto_numero_key" ON "gastos_presupuesto"("numero");

-- AddForeignKey
ALTER TABLE "gastos_presupuesto" ADD CONSTRAINT "gastos_presupuesto_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "presupuestos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos_presupuesto" ADD CONSTRAINT "gastos_presupuesto_medioPagoId_fkey" FOREIGN KEY ("medioPagoId") REFERENCES "medios_pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos_presupuesto" ADD CONSTRAINT "gastos_presupuesto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos_generales" ADD CONSTRAINT "gastos_generales_medioPagoId_fkey" FOREIGN KEY ("medioPagoId") REFERENCES "medios_pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
