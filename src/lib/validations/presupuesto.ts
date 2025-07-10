// src/lib/validations/presupuesto.ts - ACTUALIZADO CON NÚMERO MANUAL
import { z } from 'zod';

// Helper para transformar strings de fecha a Date objects
const dateTransform = z.string().or(z.date()).transform((value) => {
  if (value instanceof Date) return value;
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }
  return date;
});

export const itemPresupuestoSchema = z.object({
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

export const presupuestoSchema = z.object({
  // NUEVO: Campo opcional para número manual
  numero: z.string()
    .min(1, "El número no puede estar vacío")
    .max(50, "El número no puede exceder 50 caracteres")
    .regex(/^[A-Z0-9\-_]+$/i, "El número solo puede contener letras, números, guiones y guiones bajos")
    .optional(),
  
  clienteId: z.string()
    .uuid("ID de cliente inválido"),
  
  fechaValidez: dateTransform.refine((date) => {
    return date > new Date();
  }, "La fecha de validez debe ser futura"),
  
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
  
  tiempoEntrega: z.string()
    .max(100, "El tiempo de entrega no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  
  validezDias: z.number()
    .min(1, "La validez debe ser al menos 1 día")
    .max(365, "La validez no puede exceder 365 días")
    .default(30),
  
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
  
  items: z.array(itemPresupuestoSchema)
    .min(1, "Debe incluir al menos un item")
});

export const presupuestoUpdateSchema = presupuestoSchema.partial();

export type PresupuestoFormData = z.infer<typeof presupuestoSchema>;
export type ItemPresupuestoFormData = z.infer<typeof itemPresupuestoSchema>;