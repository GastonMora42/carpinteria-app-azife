// src/lib/utils/calculations.ts - ACTUALIZADO CON FUNCIÓN DE FECHA DE ENTREGA
export class CalculationUtils {
  /**
   * Calcula el total de items aplicando descuentos
   */
  static calculateItemTotal(
    cantidad: number, 
    precioUnitario: number, 
    descuento: number = 0
  ): number {
    const subtotal = cantidad * precioUnitario;
    const montoDescuento = (subtotal * descuento) / 100;
    return Number((subtotal - montoDescuento).toFixed(2));
  }

  /**
   * Calcula totales de presupuesto/pedido
   */
  static calculateOrderTotals(items: Array<{
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
  }>, globalDiscount: number = 0, taxRate: number = 0): {
    subtotal: number;
    descuentoTotal: number;
    impuestos: number;
    total: number;
  } {
    const subtotal = items.reduce((acc, item) => {
      return acc + this.calculateItemTotal(item.cantidad, item.precioUnitario, item.descuento || 0);
    }, 0);

    const descuentoTotal = (subtotal * globalDiscount) / 100;
    const baseImponible = subtotal - descuentoTotal;
    const impuestos = (baseImponible * taxRate) / 100;
    const total = baseImponible + impuestos;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      descuentoTotal: Number(descuentoTotal.toFixed(2)),
      impuestos: Number(impuestos.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  }

  /**
   * Calcula saldo pendiente de un pedido
   */
  static calculatePendingBalance(total: number, pagado: number): number {
    return Number((total - pagado).toFixed(2));
  }

  /**
   * Calcula porcentaje de avance
   */
  static calculateProgressPercentage(pagado: number, total: number): number {
    if (total === 0) return 0;
    return Number(((pagado / total) * 100).toFixed(2));
  }

  /**
   * Calcula margen de ganancia
   */
  static calculateProfitMargin(precioVenta: number, costoMateriales: number): {
    margen: number;
    porcentaje: number;
  } {
    const margen = precioVenta - costoMateriales;
    const porcentaje = precioVenta > 0 ? (margen / precioVenta) * 100 : 0;
    
    return {
      margen: Number(margen.toFixed(2)),
      porcentaje: Number(porcentaje.toFixed(2))
    };
  }

  /**
   * Calcula ROI de un proyecto
   */
  static calculateROI(inversion: number, ganancia: number): number {
    if (inversion === 0) return 0;
    return Number(((ganancia / inversion) * 100).toFixed(2));
  }

  /**
   * NUEVA: Calcula fecha de entrega basada en una cadena de tiempo
   */
  static calcularFechaEntregaFromString(fechaInicio: Date, tiempoEntrega: string): Date {
    try {
      // Normalizar el string de tiempo de entrega
      const tiempo = tiempoEntrega.toLowerCase().trim();
      
      // Patrones comunes para extraer días
      let dias = 0;

      // Buscar números seguidos de "día", "días", "d"
      const diasMatch = tiempo.match(/(\d+)\s*(día|días|d\b)/);
      if (diasMatch) {
        dias += parseInt(diasMatch[1]);
      }

      // Buscar números seguidos de "semana", "semanas", "s"
      const semanasMatch = tiempo.match(/(\d+)\s*(semana|semanas|s\b)/);
      if (semanasMatch) {
        dias += parseInt(semanasMatch[1]) * 7;
      }

      // Buscar números seguidos de "mes", "meses", "m"
      const mesesMatch = tiempo.match(/(\d+)\s*(mes|meses|m\b)/);
      if (mesesMatch) {
        dias += parseInt(mesesMatch[1]) * 30; // Aproximado
      }

      // Si no encontró ningún patrón, intentar extraer solo números
      if (dias === 0) {
        const numeroMatch = tiempo.match(/(\d+)/);
        if (numeroMatch) {
          dias = parseInt(numeroMatch[1]);
          // Si es un número solo, asumir que son días
        } else {
          // Si no se puede parsear, asumir 7 días por defecto
          dias = 7;
        }
      }

      // Calcular fecha de entrega
      const fechaEntrega = new Date(fechaInicio);
      fechaEntrega.setDate(fechaEntrega.getDate() + dias);
      
      return fechaEntrega;
    } catch (error) {
      console.error('Error calculando fecha de entrega:', error);
      // En caso de error, retornar fecha + 7 días
      const fechaDefault = new Date(fechaInicio);
      fechaDefault.setDate(fechaDefault.getDate() + 7);
      return fechaDefault;
    }
  }

  /**
   * NUEVA: Formatea tiempo de entrega para mostrar
   */
  static formatTiempoEntrega(tiempoEntrega: string): string {
    const tiempo = tiempoEntrega.toLowerCase().trim();
    
    // Si ya está en formato legible, devolverlo
    if (tiempo.includes('día') || tiempo.includes('semana') || tiempo.includes('mes')) {
      return tiempoEntrega;
    }

    // Si es solo un número, asumir días
    const numero = parseInt(tiempo);
    if (!isNaN(numero)) {
      return `${numero} día${numero !== 1 ? 's' : ''}`;
    }

    return tiempoEntrega;
  }
}

// ===================================

// src/lib/utils/currency.ts
export type Currency = 'PESOS' | 'DOLARES';

export class CurrencyUtils {
  private static readonly DEFAULT_USD_RATE = 1250; // Cotización por defecto

  /**
   * Formatea un monto en la moneda especificada
   */
  static formatAmount(amount: number, currency: Currency = 'PESOS'): string {
    const formatter = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'PESOS' ? 'ARS' : 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return formatter.format(amount);
  }

  /**
   * Formatea un monto sin símbolo de moneda
   */
  static formatNumber(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Convierte entre monedas
   */
  static convertCurrency(
    amount: number, 
    fromCurrency: Currency, 
    toCurrency: Currency, 
    exchangeRate: number = this.DEFAULT_USD_RATE
  ): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    if (fromCurrency === 'DOLARES' && toCurrency === 'PESOS') {
      return Number((amount * exchangeRate).toFixed(2));
    }

    if (fromCurrency === 'PESOS' && toCurrency === 'DOLARES') {
      return Number((amount / exchangeRate).toFixed(2));
    }

    return amount;
  }

  /**
   * Obtiene el símbolo de la moneda
   */
  static getCurrencySymbol(currency: Currency): string {
    return currency === 'PESOS' ? '$' : 'US$';
  }

  /**
   * Valida formato de monto
   */
  static isValidAmount(value: string): boolean {
    const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return !isNaN(numericValue) && numericValue >= 0;
  }

  /**
   * Parsea string a número
   */
  static parseAmount(value: string): number {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
}

// ===================================

// src/lib/utils/dates.ts
import { format, addDays, differenceInDays, isAfter, isBefore, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export class DateUtils {
  /**
   * Formatea una fecha en formato legible
   */
  static formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: es });
  }

  /**
   * Formatea fecha con hora
   */
  static formatDateTime(date: Date | string): string {
    return this.formatDate(date, 'dd/MM/yyyy HH:mm');
  }

  /**
   * Calcula fecha de vencimiento
   */
  static calculateDueDate(startDate: Date, daysToAdd: number): Date {
    return addDays(startDate, daysToAdd);
  }

  /**
   * Verifica si una fecha está vencida
   */
  static isOverdue(dueDate: Date | string): boolean {
    const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    return isBefore(dateObj, new Date());
  }

  /**
   * Calcula días restantes hasta vencimiento
   */
  static getDaysUntilDue(dueDate: Date | string): number {
    const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    return differenceInDays(dateObj, new Date());
  }

  /**
   * Obtiene el estado de vencimiento con colores
   */
  static getDueStatus(dueDate: Date | string): {
    status: 'overdue' | 'due-soon' | 'ok';
    color: string;
    message: string;
  } {
    const daysUntilDue = this.getDaysUntilDue(dueDate);
    
    if (daysUntilDue < 0) {
      return {
        status: 'overdue',
        color: 'text-red-600',
        message: `Vencido hace ${Math.abs(daysUntilDue)} día(s)`
      };
    }
    
    if (daysUntilDue <= 3) {
      return {
        status: 'due-soon',
        color: 'text-yellow-600',
        message: `Vence en ${daysUntilDue} día(s)`
      };
    }
    
    return {
      status: 'ok',
      color: 'text-green-600',
      message: `${daysUntilDue} días restantes`
    };
  }

  /**
   * Obtiene rango de fechas para filtros
   */
  static getDateRanges() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const last30Days = addDays(today, -30);
    const last7Days = addDays(today, -7);

    return {
      today: { start: today, end: today },
      last7Days: { start: last7Days, end: today },
      last30Days: { start: last30Days, end: today },
      thisMonth: { start: startOfMonth, end: today },
      thisYear: { start: startOfYear, end: today }
    };
  }

  /**
   * Formatea período para reportes
   */
  static formatPeriod(startDate: Date, endDate: Date): string {
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);
    return `${start} - ${end}`;
  }
}