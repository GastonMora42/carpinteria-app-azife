// src/lib/types/prisma-overrides.ts - NUEVO ARCHIVO
import { Prisma } from '@prisma/client';

// Tipos personalizados que convierten Decimal a number
export type PresupuestoWithNumbers = Omit<
  Prisma.PresupuestoGetPayload<{
    include: {
      cliente: { select: { id: true; nombre: true; email: true; telefono: true } };
      user: { select: { id: true; name: true } };
      items: true;
      _count: { select: { items: true } };
    }
  }>,
  'subtotal' | 'descuento' | 'impuestos' | 'total'
> & {
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
};

export type VentaWithNumbers = Omit<
  Prisma.PedidoGetPayload<{
    include: {
      cliente: { select: { id: true; nombre: true; email: true; telefono: true } };
      presupuesto: { select: { id: true; numero: true } };
      user: { select: { id: true; name: true } };
      items: true;
      _count: { select: { transacciones: true; materiales: true; items: true } };
    }
  }>,
  'subtotal' | 'descuento' | 'impuestos' | 'total' | 'totalCobrado' | 'saldoPendiente' | 'porcentajeAvance'
> & {
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  totalCobrado: number;
  saldoPendiente: number;
  porcentajeAvance: number;
};

// Función helper para convertir Decimal a number
export function convertDecimalFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const converted = { ...obj };
  fields.forEach(field => {
    if (converted[field] && typeof converted[field] === 'object' && 'toNumber' in converted[field]) {
      (converted as any)[field] = converted[field].toNumber();
    } else if (converted[field] !== null && converted[field] !== undefined) {
      (converted as any)[field] = Number(converted[field]);
    }
  });
  return converted;
}

// Función específica para presupuestos
export function convertPresupuestoDecimalFields(presupuesto: any): PresupuestoWithNumbers {
  return {
    ...presupuesto,
    subtotal: Number(presupuesto.subtotal),
    descuento: Number(presupuesto.descuento || 0),
    impuestos: Number(presupuesto.impuestos || 0),
    total: Number(presupuesto.total)
  };
}

// Función específica para ventas
export function convertVentaDecimalFields(venta: any): VentaWithNumbers {
  return {
    ...venta,
    subtotal: Number(venta.subtotal),
    descuento: Number(venta.descuento || 0),
    impuestos: Number(venta.impuestos || 0),
    total: Number(venta.total),
    totalCobrado: Number(venta.totalCobrado || 0),
    saldoPendiente: Number(venta.saldoPendiente || 0),
    porcentajeAvance: Number(venta.porcentajeAvance || 0)
  };
}