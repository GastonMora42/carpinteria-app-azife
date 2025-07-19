// src/lib/utils/venta-utils.ts - UTILIDADES ESPECÍFICAS PARA VENTAS
import { VentaFormData } from '@/lib/validations/venta';

export interface VentaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface VentaPreparationResult {
  data: any;
  type: 'presupuesto' | 'directa';
  estimatedTotal: number;
  issues: string[];
}

export class VentaUtils {
  /**
   * Valida los datos de una venta antes de enviarlos
   */
  static validateVentaData(data: VentaFormData): VentaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validaciones básicas
    if (!data.clienteId) {
      errors.push('Cliente es requerido');
    }

    if (!data.descripcionObra || data.descripcionObra.trim().length === 0) {
      errors.push('Descripción de la obra es requerida');
    }

    // Validaciones específicas por tipo de venta
    if (data.presupuestoId) {
      // Venta desde presupuesto
      if (data.items && data.items.length > 0) {
        warnings.push('Los items serán ignorados al convertir desde presupuesto');
      }
    } else {
      // Venta directa
      if (!data.items || data.items.length === 0) {
        errors.push('Las ventas directas requieren al menos un item');
      } else {
        // Validar items
        data.items.forEach((item, index) => {
          if (!item.descripcion) {
            errors.push(`Item ${index + 1}: Descripción requerida`);
          }
          if (item.cantidad <= 0) {
            errors.push(`Item ${index + 1}: Cantidad debe ser mayor a 0`);
          }
          if (item.precioUnitario < 0) {
            errors.push(`Item ${index + 1}: Precio unitario no puede ser negativo`);
          }
          if (!item.unidad) {
            errors.push(`Item ${index + 1}: Unidad de medida requerida`);
          }
        });
      }
    }

    // Validaciones de fechas
    if (data.fechaEntrega) {
      const fechaEntrega = new Date(data.fechaEntrega);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaEntrega < hoy) {
        warnings.push('La fecha de entrega es anterior a hoy');
      }

      const diasHastaEntrega = Math.ceil((fechaEntrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      if (diasHastaEntrega < 3) {
        warnings.push(`Fecha de entrega muy próxima (${diasHastaEntrega} días)`);
      }
    }

    // Validaciones de montos
    if (data.descuento && (data.descuento < 0 || data.descuento > 100)) {
      errors.push('El descuento debe estar entre 0% y 100%');
    }

    if (data.impuestos && (data.impuestos < 0 || data.impuestos > 100)) {
      errors.push('Los impuestos deben estar entre 0% y 100%');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Prepara los datos de venta para envío al servidor
   */
  static prepareVentaData(data: VentaFormData): VentaPreparationResult {
    const issues: string[] = [];
    let estimatedTotal = 0;

    // Preparar datos base
    const preparedData = {
      ...data,
      // Convertir fecha a string ISO si existe
      fechaEntrega: data.fechaEntrega ? data.fechaEntrega.toISOString() : undefined,
      // Limpiar strings opcionales
      observaciones: data.observaciones?.trim() || '',
      condicionesPago: data.condicionesPago?.trim() || '',
      lugarEntrega: data.lugarEntrega?.trim() || ''
    };

    // Determinar tipo de venta y calcular total estimado
    const type: 'presupuesto' | 'directa' = data.presupuestoId ? 'presupuesto' : 'directa';

    if (type === 'directa' && data.items) {
      // Calcular total estimado para venta directa
      const subtotal = data.items.reduce((acc, item) => {
        const itemTotal = item.cantidad * item.precioUnitario * (1 - (item.descuento || 0) / 100);
        return acc + itemTotal;
      }, 0);

      const descuentoGlobal = (subtotal * (data.descuento || 0)) / 100;
      const baseImponible = subtotal - descuentoGlobal;
      const impuestos = (baseImponible * (data.impuestos || 0)) / 100;
      estimatedTotal = baseImponible + impuestos;

      if (estimatedTotal <= 0) {
        issues.push('El total calculado es cero o negativo');
      }
    }

    // Validaciones específicas
    if (type === 'presupuesto' && !data.presupuestoId) {
      issues.push('ID de presupuesto requerido para conversión');
    }

    if (type === 'directa' && (!data.items || data.items.length === 0)) {
      issues.push('Items requeridos para venta directa');
    }

    return {
      data: preparedData,
      type,
      estimatedTotal,
      issues
    };
  }

  /**
   * Genera un resumen de la venta para confirmación
   */
  static generateVentaSummary(data: VentaFormData): {
    tipo: string;
    cliente: string;
    descripcion: string;
    entrega: string;
    items: number;
    observaciones: string;
  } {
    return {
      tipo: data.presupuestoId ? 'Conversión de Presupuesto' : 'Venta Directa',
      cliente: data.clienteId, // En la práctica deberías resolver el nombre del cliente
      descripcion: data.descripcionObra || 'Sin descripción',
      entrega: data.fechaEntrega ? 
        new Intl.DateTimeFormat('es-AR').format(data.fechaEntrega) : 
        'Sin fecha definida',
      items: data.items?.length || 0,
      observaciones: data.observaciones || 'Ninguna'
    };
  }

  /**
   * Valida que un presupuesto pueda convertirse a venta
   */
  static validatePresupuestoForConversion(presupuesto: any): {
    canConvert: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (!presupuesto) {
      reasons.push('Presupuesto no encontrado');
      return { canConvert: false, reasons };
    }

    // Verificar estado
    const estadosValidos = ['PENDIENTE', 'ENVIADO', 'APROBADO'];
    if (!estadosValidos.includes(presupuesto.estado)) {
      reasons.push(`El presupuesto está en estado "${presupuesto.estado}". Solo se pueden convertir presupuestos en estado: ${estadosValidos.join(', ')}`);
    }

    // Verificar si ya fue convertido
    if (presupuesto.pedido) {
      reasons.push(`Este presupuesto ya fue convertido a la venta "${presupuesto.pedido.numero}"`);
    }

    // Verificar vencimiento
    const fechaVencimiento = new Date(presupuesto.fechaValidez);
    const hoy = new Date();
    if (fechaVencimiento < hoy) {
      const diasVencido = Math.ceil((hoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));
      if (diasVencido > 7) {
        reasons.push(`El presupuesto está vencido hace ${diasVencido} días. Solo se permiten presupuestos vencidos hace menos de 7 días.`);
      } else {
        reasons.push(`Advertencia: El presupuesto está vencido hace ${diasVencido} días.`);
      }
    }

    // Verificar que tenga items
    if (!presupuesto.items || presupuesto.items.length === 0) {
      reasons.push('El presupuesto no tiene items definidos');
    }

    // Verificar que tenga total válido
    if (!presupuesto.total || presupuesto.total <= 0) {
      reasons.push('El presupuesto no tiene un total válido');
    }

    return {
      canConvert: reasons.length === 0 || reasons.every(r => r.startsWith('Advertencia:')),
      reasons
    };
  }

  /**
   * Formatea errores de API para mostrar al usuario
   */
  static formatApiError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error.message) {
      // Errores específicos conocidos
      if (error.message.includes('Datos inválidos')) {
        return 'Los datos proporcionados no son válidos. Revisa los campos requeridos.';
      }

      if (error.message.includes('presupuesto')) {
        return `Error con el presupuesto: ${error.message}`;
      }

      if (error.message.includes('cliente')) {
        return 'Error: Cliente no válido o no encontrado.';
      }

      if (error.message.includes('Token') || error.message.includes('401')) {
        return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      }

      return error.message;
    }

    return 'Error inesperado al procesar la venta.';
  }

  /**
   * Determina el siguiente estado recomendado para una venta
   */
  static getNextRecommendedState(currentState: string): string | null {
    const stateFlow: Record<string, string> = {
      'BORRADOR': 'PENDIENTE',
      'PENDIENTE': 'CONFIRMADO',
      'CONFIRMADO': 'EN_PROCESO',
      'EN_PROCESO': 'EN_PRODUCCION',
      'EN_PRODUCCION': 'LISTO_ENTREGA',
      'LISTO_ENTREGA': 'ENTREGADO',
      'ENTREGADO': 'FACTURADO',
      'FACTURADO': 'COBRADO'
    };

    return stateFlow[currentState] || null;
  }
}

// Exportar funciones utilitarias comunes
export const validateVentaData = VentaUtils.validateVentaData;
export const prepareVentaData = VentaUtils.prepareVentaData;
export const validatePresupuestoForConversion = VentaUtils.validatePresupuestoForConversion;
export const formatApiError = VentaUtils.formatApiError;