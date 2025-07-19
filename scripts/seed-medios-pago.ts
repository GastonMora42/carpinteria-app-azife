// prisma/seed-medios-pago.ts - Script para poblar medios de pago
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMediosPago() {
  console.log('🏦 Poblando medios de pago...');

  const mediosPago = [
    {
      nombre: 'Efectivo',
      descripcion: 'Pago en efectivo'
    },
    {
      nombre: 'Transferencia Bancaria',
      descripcion: 'Transferencia bancaria'
    },
    {
      nombre: 'Cheque',
      descripcion: 'Pago con cheque'
    },
    {
      nombre: 'Tarjeta de Débito',
      descripcion: 'Pago con tarjeta de débito'
    },
    {
      nombre: 'Tarjeta de Crédito',
      descripcion: 'Pago con tarjeta de crédito'
    },
    {
      nombre: 'Mercado Pago',
      descripcion: 'Pago con Mercado Pago'
    },
    {
      nombre: 'Depósito Bancario',
      descripcion: 'Depósito en cuenta bancaria'
    }
  ];

  for (const medio of mediosPago) {
    const existing = await prisma.medioPago.findFirst({
      where: { nombre: medio.nombre }
    });

    if (!existing) {
      await prisma.medioPago.create({
        data: medio
      });
      console.log(`✅ Creado medio de pago: ${medio.nombre}`);
    } else {
      console.log(`⚠️ Ya existe medio de pago: ${medio.nombre}`);
    }
  }

  console.log('🎉 Medios de pago poblados exitosamente');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedMediosPago()
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedMediosPago };