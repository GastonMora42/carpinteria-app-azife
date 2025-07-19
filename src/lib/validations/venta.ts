// src/lib/validations/venta.ts - CORREGIDO PARA MANEJAR FECHAS
import { z } from 'zod';

// Helper para transformar strings de fecha a Date objects (igual que en presupuestos)
const dateTransform = z.string().or(z.date()).transform((value) => {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Fecha inválida');
    }
    return date;
  }
  throw new Error('Formato de fecha inválido');
});

export const itemVentaSchema = z.object({
  descripcion: z.string()
    .min(1, "La descripción es requerida")
    .max(200, "La descripción no puede exceder 200 caracteres"),
  
  detalle: z.string()
    .max(500, "El detalle no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  
  cantidad: z.number()
    .min(0.001, "La cantidad debe ser mayor a 0")
    .max(999999, "La cantidad es demasiado grande"),
  
  unidad: z.string()
    .min(1, "La unidad es requerida")
    .max(20, "La unidad no puede exceder 20 caracteres"),
  
  precioUnitario: z.number()
    .min(0.01, "El precio debe ser mayor a 0")
    .max(9999999.99, "El precio es demasiado alto"),
  
  descuento: z.number()
    .min(0, "El descuento no puede ser negativo")
    .max(100, "El descuento no puede ser mayor a 100%")
    .optional()
    .default(0)
});

// Schema base SIN refine para poder usar .partial()
const ventaBaseSchema = z.object({
  clienteId: z.string()
    .uuid("ID de cliente inválido"),
  
  presupuestoId: z.string()
    .uuid("ID de presupuesto inválido")
    .optional(),
  
  // CORREGIDO: Usar dateTransform para manejar strings y Date objects
  fechaEntrega: dateTransform.optional(),
  
  prioridad: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE'])
    .default('NORMAL'),
  
  descripcionObra: z.string()
    .min(1, "La descripción de la obra es requerida")
    .max(500, "La descripción no puede exceder 500 caracteres"),
  
  observaciones: z.string()
    .max(1000, "Las observaciones no pueden exceder 1000 caracteres")
    .optional()
    .or(z.literal("")),
  
  condicionesPago: z.string()
    .max(500, "Las condiciones de pago no pueden exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  
  lugarEntrega: z.string()
    .max(200, "El lugar de entrega no puede exceder 200 caracteres")
    .optional()
    .or(z.literal("")),
  
  descuento: z.number()
    .min(0, "El descuento no puede ser negativo")
    .max(100, "El descuento no puede ser mayor a 100%")
    .optional()
    .default(0),
  
  impuestos: z.number()
    .min(0, "Los impuestos no pueden ser negativos")
    .max(100, "Los impuestos no pueden ser mayor a 100%")
    .optional()
    .default(0),
  
  moneda: z.enum(['PESOS', 'DOLARES'])
    .default('PESOS'),

  items: z.array(itemVentaSchema)
    .optional()
    .default([])
});

// Schema principal CON validación
export const ventaSchema = ventaBaseSchema.refine((data) => {
  // Si no hay presupuesto, debe tener al menos un item
  if (!data.presupuestoId && (!data.items || data.items.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Las ventas directas deben incluir al menos un item",
  path: ["items"]
});

// Schema para actualización SIN refine (permite .partial())
export const ventaUpdateSchema = ventaBaseSchema.partial();

export type VentaFormData = z.infer<typeof ventaSchema>;
export type ItemVentaFormData = z.infer<typeof itemVentaSchema>;
export type VentaUpdateData = z.infer<typeof ventaUpdateSchema>;