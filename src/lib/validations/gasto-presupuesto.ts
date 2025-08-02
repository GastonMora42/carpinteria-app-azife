// src/lib/validations/gasto-presupuesto.ts - ACTUALIZADO
import { z } from 'zod';

// Helper para transformar strings de fecha a Date objects
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

export const gastoPresupuestoSchema = z.object({
  presupuestoId: z.string()
    .uuid("ID de presupuesto inválido"),
  
  descripcion: z.string()
    .min(1, "La descripción es requerida")
    .max(200, "La descripción no puede exceder 200 caracteres"),
  
  categoria: z.enum([
    'MATERIALES',
    'MANO_OBRA', 
    'TRANSPORTE',
    'HERRAMIENTAS',
    'SERVICIOS',
    'OTROS'
  ]),
  
  subcategoria: z.string()
    .max(100, "La subcategoría no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  
  monto: z.number()
    .min(0.01, "El monto debe ser mayor a 0")
    .max(99999999.99, "El monto es demasiado alto"),
  
  moneda: z.enum(['PESOS', 'DOLARES'])
    .default('PESOS'),
  
  fecha: dateTransform,
  
  comprobante: z.string()
    .max(50, "El número de comprobante no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),
  
  proveedor: z.string()
    .max(100, "El nombre del proveedor no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  
  notas: z.string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional()
    .or(z.literal("")),

  // NUEVO: Medio de pago requerido
  medioPagoId: z.string()
    .min(1, "El medio de pago es requerido")
});

export const gastoGeneralSchema = z.object({
  descripcion: z.string()
    .min(1, "La descripción es requerida")
    .max(200, "La descripción no puede exceder 200 caracteres"),
  
  categoria: z.string()
    .min(1, "La categoría es requerida")
    .max(100, "La categoría no puede exceder 100 caracteres"),
  
  subcategoria: z.string()
    .max(100, "La subcategoría no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  
  monto: z.number()
    .min(0.01, "El monto debe ser mayor a 0")
    .max(99999999.99, "El monto es demasiado alto"),
  
  moneda: z.enum(['PESOS', 'DOLARES'])
    .default('PESOS'),
  
  fecha: dateTransform,
  
  periodo: z.string()
    .max(20, "El período no puede exceder 20 caracteres")
    .optional()
    .or(z.literal("")),
  
  numeroFactura: z.string()
    .max(50, "El número de factura no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),
  
  proveedor: z.string()
    .max(100, "El nombre del proveedor no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),

  // NUEVO: Medio de pago requerido
  medioPagoId: z.string()
    .min(1, "El medio de pago es requerido")
});

export const gastoPresupuestoUpdateSchema = gastoPresupuestoSchema.partial();
export const gastoGeneralUpdateSchema = gastoGeneralSchema.partial();

export type GastoPresupuestoFormData = z.infer<typeof gastoPresupuestoSchema>;
export type GastoGeneralFormData = z.infer<typeof gastoGeneralSchema>;
export type GastoPresupuestoUpdateData = z.infer<typeof gastoPresupuestoUpdateSchema>;
export type GastoGeneralUpdateData = z.infer<typeof gastoGeneralUpdateSchema>;

// Constantes para categorías de gastos
export const CATEGORIAS_GASTO_PRESUPUESTO = {
  MATERIALES: { 
    label: 'Materiales', 
    color: 'bg-blue-100 text-blue-800',
    icon: '🔧'
  },
  MANO_OBRA: { 
    label: 'Mano de Obra', 
    color: 'bg-green-100 text-green-800',
    icon: '👷'
  },
  TRANSPORTE: { 
    label: 'Transporte', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: '🚚'
  },
  HERRAMIENTAS: { 
    label: 'Herramientas', 
    color: 'bg-purple-100 text-purple-800',
    icon: '🛠️'
  },
  SERVICIOS: { 
    label: 'Servicios', 
    color: 'bg-orange-100 text-orange-800',
    icon: '⚙️'
  },
  OTROS: { 
    label: 'Otros', 
    color: 'bg-gray-100 text-gray-800',
    icon: '📋'
  }
} as const;

// Constantes para categorías de gastos generales
export const CATEGORIAS_GASTO_GENERAL = [
  'Alquiler',
  'Servicios',
  'Sueldos',
  'Impuestos',
  'Seguros',
  'Mantenimiento',
  'Combustible',
  'Viáticos',
  'Publicidad',
  'Equipamiento',
  'Otros'
] as const;