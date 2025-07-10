// src/lib/utils/numbering.ts - UTILIDADES PARA NUMERACIÓN DE DOCUMENTOS
import { prisma } from '@/lib/db/prisma';

export interface NumberingConfig {
  prefix: string;
  includeYear: boolean;
  paddingLength: number;
  separator: string;
}

export class DocumentNumbering {
  private static readonly configs: Record<string, NumberingConfig> = {
    presupuesto: {
      prefix: 'PRES',
      includeYear: true,
      paddingLength: 3,
      separator: '-'
    },
    pedido: {
      prefix: 'VEN',
      includeYear: true,
      paddingLength: 3,
      separator: '-'
    },
    transaccion: {
      prefix: 'TRX',
      includeYear: true,
      paddingLength: 4,
      separator: '-'
    },
    cliente: {
      prefix: 'CLI',
      includeYear: false,
      paddingLength: 3,
      separator: '-'
    },
    material: {
      prefix: 'MAT',
      includeYear: false,
      paddingLength: 3,
      separator: '-'
    }
  };

  /**
   * Genera un número único para presupuestos
   */
  static async generatePresupuestoNumber(): Promise<string> {
    return this.generateNumber('presupuesto', async (pattern: string) => {
      return await prisma.presupuesto.findFirst({
        where: { numero: { startsWith: pattern } },
        orderBy: { numero: 'desc' },
        select: { numero: true }
      });
    });
  }

  /**
   * Genera un número único para pedidos/ventas
   */
  static async generatePedidoNumber(): Promise<string> {
    return this.generateNumber('pedido', async (pattern: string) => {
      return await prisma.pedido.findFirst({
        where: { numero: { startsWith: pattern } },
        orderBy: { numero: 'desc' },
        select: { numero: true }
      });
    });
  }

  /**
   * Genera un número único para transacciones
   */
  static async generateTransaccionNumber(): Promise<string> {
    return this.generateNumber('transaccion', async (pattern: string) => {
      return await prisma.transaccion.findFirst({
        where: { numero: { startsWith: pattern } },
        orderBy: { numero: 'desc' },
        select: { numero: true }
      });
    });
  }

  /**
   * Método genérico para generar números únicos
   */
  private static async generateNumber(
    type: keyof typeof DocumentNumbering.configs,
    findLastRecord: (pattern: string) => Promise<{ numero: string } | null>
  ): Promise<string> {
    const config = this.configs[type];
    const maxRetries = 10;
    
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        const year = new Date().getFullYear();
        const pattern = config.includeYear 
          ? `${config.prefix}${config.separator}${year}${config.separator}`
          : `${config.prefix}${config.separator}`;

        // Buscar el último número con el patrón actual
        const lastRecord = await findLastRecord(pattern);
        
        let nextNumber = 1;
        
        if (lastRecord) {
          // Extraer el número del formato
          const regex = config.includeYear
            ? new RegExp(`${config.prefix}${config.separator}\\d{4}${config.separator}(\\d+)`)
            : new RegExp(`${config.prefix}${config.separator}(\\d+)`);
          
          const match = lastRecord.numero.match(regex);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }

        // Formatear el número con padding
        const paddedNumber = String(nextNumber).padStart(config.paddingLength, '0');
        const fullNumber = `${pattern}${paddedNumber}`;
        
        console.log(`📝 Generated ${type} number: ${fullNumber} (attempt ${retry + 1})`);
        return fullNumber;
        
      } catch (error) {
        console.error(`❌ Error generating ${type} number (retry ${retry + 1}):`, error);
        if (retry === maxRetries - 1) {
          throw new Error(`No se pudo generar número único para ${type}`);
        }
        
        // Esperar un poco antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    throw new Error(`No se pudo generar número para ${type} después de ${maxRetries} intentos`);
  }

  /**
   * Valida el formato de un número de documento
   */
  static validateNumberFormat(numero: string, type: keyof typeof DocumentNumbering.configs): boolean {
    const config = this.configs[type];
    
    if (config.includeYear) {
      const regex = new RegExp(
        `^${config.prefix}${config.separator}\\d{4}${config.separator}\\d{${config.paddingLength}}$`
      );
      return regex.test(numero);
    } else {
      const regex = new RegExp(
        `^${config.prefix}${config.separator}\\d{${config.paddingLength}}$`
      );
      return regex.test(numero);
    }
  }

  /**
   * Extrae información de un número de documento
   */
  static parseNumber(numero: string, type: keyof typeof DocumentNumbering.configs): {
    prefix: string;
    year?: number;
    sequence: number;
    isValid: boolean;
  } {
    const config = this.configs[type];
    
    if (!this.validateNumberFormat(numero, type)) {
      return { prefix: '', sequence: 0, isValid: false };
    }

    const parts = numero.split(config.separator);
    
    if (config.includeYear) {
      return {
        prefix: parts[0],
        year: parseInt(parts[1]),
        sequence: parseInt(parts[2]),
        isValid: true
      };
    } else {
      return {
        prefix: parts[0],
        sequence: parseInt(parts[1]),
        isValid: true
      };
    }
  }

  /**
   * Obtiene estadísticas de numeración
   */
  static async getNumberingStats(type: keyof typeof DocumentNumbering.configs): Promise<{
    totalCount: number;
    currentYearCount: number;
    lastNumber: string | null;
    nextNumber: string;
  }> {
    const config = this.configs[type];
    let totalCount = 0;
    let currentYearCount = 0;
    let lastNumber: string | null = null;

    try {
      switch (type) {
        case 'presupuesto':
          totalCount = await prisma.presupuesto.count();
          if (config.includeYear) {
            const year = new Date().getFullYear();
            currentYearCount = await prisma.presupuesto.count({
              where: {
                numero: { startsWith: `${config.prefix}${config.separator}${year}${config.separator}` }
              }
            });
          }
          const lastPresupuesto = await prisma.presupuesto.findFirst({
            orderBy: { numero: 'desc' },
            select: { numero: true }
          });
          lastNumber = lastPresupuesto?.numero || null;
          break;

        case 'pedido':
          totalCount = await prisma.pedido.count();
          if (config.includeYear) {
            const year = new Date().getFullYear();
            currentYearCount = await prisma.pedido.count({
              where: {
                numero: { startsWith: `${config.prefix}${config.separator}${year}${config.separator}` }
              }
            });
          }
          const lastPedido = await prisma.pedido.findFirst({
            orderBy: { numero: 'desc' },
            select: { numero: true }
          });
          lastNumber = lastPedido?.numero || null;
          break;

        case 'transaccion':
          totalCount = await prisma.transaccion.count();
          if (config.includeYear) {
            const year = new Date().getFullYear();
            currentYearCount = await prisma.transaccion.count({
              where: {
                numero: { startsWith: `${config.prefix}${config.separator}${year}${config.separator}` }
              }
            });
          }
          const lastTransaccion = await prisma.transaccion.findFirst({
            orderBy: { numero: 'desc' },
            select: { numero: true }
          });
          lastNumber = lastTransaccion?.numero || null;
          break;
      }

      // Generar el próximo número
      const nextNumber = await this.generateNumber(type, async () => null);

      return {
        totalCount,
        currentYearCount,
        lastNumber,
        nextNumber
      };
    } catch (error) {
      console.error(`Error getting numbering stats for ${type}:`, error);
      throw error;
    }
  }

  /**
   * Busca documentos por número con coincidencias parciales
   */
  static async searchByNumber(
    numero: string,
    type: keyof typeof DocumentNumbering.configs,
    limit: number = 10
  ): Promise<any[]> {
    const searchTerm = numero.toUpperCase();
    
    try {
      switch (type) {
        case 'presupuesto':
          return await prisma.presupuesto.findMany({
            where: {
              numero: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            },
            include: {
              cliente: { select: { nombre: true } }
            },
            orderBy: { numero: 'desc' },
            take: limit
          });

        case 'pedido':
          return await prisma.pedido.findMany({
            where: {
              numero: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            },
            include: {
              cliente: { select: { nombre: true } }
            },
            orderBy: { numero: 'desc' },
            take: limit
          });

        case 'transaccion':
          return await prisma.transaccion.findMany({
            where: {
              numero: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            },
            include: {
              cliente: { select: { nombre: true } },
              proveedor: { select: { nombre: true } }
            },
            orderBy: { numero: 'desc' },
            take: limit
          });

        default:
          return [];
      }
    } catch (error) {
      console.error(`Error searching ${type} by number:`, error);
      return [];
    }
  }
}

// Utilidades de exportación
export const generatePresupuestoNumber = DocumentNumbering.generatePresupuestoNumber;
export const generatePedidoNumber = DocumentNumbering.generatePedidoNumber;
export const generateTransaccionNumber = DocumentNumbering.generateTransaccionNumber;
export const validateNumberFormat = DocumentNumbering.validateNumberFormat;
export const parseNumber = DocumentNumbering.parseNumber;
export const searchByNumber = DocumentNumbering.searchByNumber;