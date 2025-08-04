// src/hooks/use-balance-finanzas.ts - HOOK PARA BALANCE GENERAL DE FINANZAS
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/utils/http';

export interface BalanceMedioFinanzas {
  medioPago: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
  ingresos: {
    total: number;
    cantidad: number;
    transacciones: Array<{
      id: string;
      fecha: string;
      concepto: string;
      monto: number;
      origen: string;
      referencia?: string;
    }>;
  };
  gastos: {
    total: number;
    cantidad: number;
    transacciones: Array<{
      id: string;
      fecha: string;
      concepto: string;
      monto: number;
      origen: string;
      categoria?: string;
    }>;
  };
  balance: number;
  estado: 'positivo' | 'negativo' | 'neutro';
  ratioIngresoGasto: number | null;
  ultimaTransaccion: string | null;
}

export interface TotalesFinanzas {
  ingresosTotales: number;
  gastosTotales: number;
  balanceTotal: number;
  cantidadMedios: number;
  cantidadTransacciones: number;
}

export interface AnalisisFinanzas {
  medioMayorBalance: BalanceMedioFinanzas | null;
  medioMenorBalance: BalanceMedioFinanzas | null;
  medioMasActivo: BalanceMedioFinanzas | null;
  distribucionPorcentual: Array<{
    medio: string;
    porcentajeIngresos: number;
    porcentajeGastos: number;
    balance: number;
  }>;
  alertas: {
    mediosEnRojo: number;
    concentracionExcesiva: boolean;
    sinMovimiento: number;
  };
}

export interface BalanceFinanzasData {
  balance: BalanceMedioFinanzas[];
  totales: TotalesFinanzas;
  analisis: AnalisisFinanzas;
  parametros: {
    fechaDesde?: string;
    fechaHasta?: string;
    incluirGastos: boolean;
    incluirIngresos: boolean;
    medioId?: string;
  };
  generadoEn: string;
}

export interface UseBalanceFinanzasParams {
  fechaDesde?: Date;
  fechaHasta?: Date;
  incluirGastos?: boolean;
  incluirIngresos?: boolean;
  medioId?: string;
  autoRefresh?: boolean;
}

export function useBalanceFinanzas(params: UseBalanceFinanzasParams = {}) {
  const [data, setData] = useState<BalanceFinanzasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Fetching balance general de finanzas with params:', params);
      
      // Construir query parameters
      const queryParams = new URLSearchParams();
      
      if (params.fechaDesde) {
        queryParams.append('fechaDesde', params.fechaDesde.toISOString());
      }
      if (params.fechaHasta) {
        queryParams.append('fechaHasta', params.fechaHasta.toISOString());
      }
      if (params.incluirGastos !== undefined) {
        queryParams.append('incluirGastos', params.incluirGastos.toString());
      }
      if (params.incluirIngresos !== undefined) {
        queryParams.append('incluirIngresos', params.incluirIngresos.toString());
      }
      if (params.medioId) {
        queryParams.append('medioId', params.medioId);
      }
      
      const data = await api.get(`/api/finanzas/balance-medios-pago?${queryParams}`);
      
      console.log('✅ Balance general fetched successfully:', {
        medios: data.balance.length,
        balanceTotal: data.totales.balanceTotal,
        alertas: data.analisis.alertas
      });
      
      setData(data);
    } catch (err: any) {
      console.error('❌ Error fetching balance general:', err);
      setError(err.message || 'Error al cargar balance general');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  // Función para obtener balance de un medio específico
  const getBalanceMedio = useCallback((medioId: string): BalanceMedioFinanzas | null => {
    if (!data) return null;
    return data.balance.find(b => b.medioPago.id === medioId) || null;
  }, [data]);

  // Función para obtener medios con balance positivo
  const getMediosPositivos = useCallback((): BalanceMedioFinanzas[] => {
    if (!data) return [];
    return data.balance.filter(m => m.balance > 0);
  }, [data]);

  // Función para obtener medios con balance negativo
  const getMediosNegativos = useCallback((): BalanceMedioFinanzas[] => {
    if (!data) return [];
    return data.balance.filter(m => m.balance < 0);
  }, [data]);

  // Función para obtener la salud financiera general
  const getSaludFinanciera = useCallback((): {
    estado: 'excelente' | 'buena' | 'regular' | 'mala' | 'critica';
    puntuacion: number;
    mensaje: string;
    recomendaciones: string[];
  } => {
    if (!data) {
      return { 
        estado: 'regular', 
        puntuacion: 0, 
        mensaje: 'Sin datos disponibles',
        recomendaciones: []
      };
    }

    const { totales, analisis } = data;
    let puntuacion = 50; // Base
    const recomendaciones: string[] = [];

    // Factor 1: Balance total (30 puntos)
    if (totales.balanceTotal > 0) {
      puntuacion += 30;
    } else if (totales.balanceTotal < 0) {
      puntuacion -= 20;
      recomendaciones.push('Reducir gastos o incrementar ingresos');
    }

    // Factor 2: Diversificación (20 puntos)
    if (totales.cantidadMedios >= 3) {
      puntuacion += 20;
    } else if (totales.cantidadMedios < 2) {
      puntuacion -= 10;
      recomendaciones.push('Diversificar medios de pago para reducir riesgo');
    }

    // Factor 3: Concentración (15 puntos)
    if (analisis.alertas.concentracionExcesiva) {
      puntuacion -= 15;
      recomendaciones.push('Evitar concentración excesiva en un solo medio');
    } else {
      puntuacion += 10;
    }

    // Factor 4: Medios en rojo (15 puntos)
    const porcentajeMediosRojo = analisis.alertas.mediosEnRojo / Math.max(1, totales.cantidadMedios);
    if (porcentajeMediosRojo > 0.5) {
      puntuacion -= 15;
      recomendaciones.push('Varios medios de pago tienen balance negativo');
    }

    // Factor 5: Ratio ingresos/gastos (20 puntos)
    const ratioGeneral = totales.gastosTotales > 0 ? totales.ingresosTotales / totales.gastosTotales : 1;
    if (ratioGeneral >= 1.2) {
      puntuacion += 20;
    } else if (ratioGeneral < 1) {
      puntuacion -= 20;
      recomendaciones.push('Los gastos superan a los ingresos');
    }

    // Normalizar puntuación
    puntuacion = Math.max(0, Math.min(100, puntuacion));

    // Determinar estado
    let estado: 'excelente' | 'buena' | 'regular' | 'mala' | 'critica';
    let mensaje: string;

    if (puntuacion >= 85) {
      estado = 'excelente';
      mensaje = 'Excelente salud financiera';
    } else if (puntuacion >= 70) {
      estado = 'buena';
      mensaje = 'Buena salud financiera';
    } else if (puntuacion >= 50) {
      estado = 'regular';
      mensaje = 'Salud financiera regular, hay margen de mejora';
    } else if (puntuacion >= 30) {
      estado = 'mala';
      mensaje = 'Situación financiera que requiere atención';
    } else {
      estado = 'critica';
      mensaje = 'Situación financiera crítica';
    }

    return { estado, puntuacion, mensaje, recomendaciones };
  }, [data]);

  // Función para obtener flujo de caja proyectado
  const getFlujoCajaProyectado = useCallback((): {
    proyeccionMensual: number;
    tendencia: 'creciente' | 'decreciente' | 'estable';
    liquidezDias: number;
  } => {
    if (!data || data.balance.length === 0) {
      return { proyeccionMensual: 0, tendencia: 'estable', liquidezDias: 0 };
    }

    // Calcular ingresos y gastos promedio mensual (simplificado)
    const ingresosMensuales = data.totales.ingresosTotales;
    const gastosMensuales = data.totales.gastosTotales;
    const flujoNeto = ingresosMensuales - gastosMensuales;

    // Calcular liquidez en días (efectivo disponible / gasto diario promedio)
    const efectivo = data.balance
      .filter(m => m.medioPago.nombre.toLowerCase().includes('efectivo'))
      .reduce((sum, m) => sum + m.balance, 0);
    
    const gastoDiario = gastosMensuales / 30;
    const liquidezDias = gastoDiario > 0 ? efectivo / gastoDiario : 0;

    // Determinar tendencia (simplificado)
    let tendencia: 'creciente' | 'decreciente' | 'estable';
    if (flujoNeto > ingresosMensuales * 0.1) {
      tendencia = 'creciente';
    } else if (flujoNeto < -gastosMensuales * 0.05) {
      tendencia = 'decreciente';
    } else {
      tendencia = 'estable';
    }

    return {
      proyeccionMensual: flujoNeto,
      tendencia,
      liquidezDias: Math.max(0, liquidezDias)
    };
  }, [data]);

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (params.autoRefresh) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing balance finanzas...');
        fetchBalance();
      }, 5 * 60 * 1000); // 5 minutos

      return () => clearInterval(interval);
    }
  }, [fetchBalance, params.autoRefresh]);

  useEffect(() => {
    console.log('🔄 useBalanceFinanzas effect triggered');
    fetchBalance();
  }, [fetchBalance]);

  return {
    data,
    loading,
    error,
    refetch: fetchBalance,
    
    // Funciones utilitarias
    getBalanceMedio,
    getMediosPositivos,
    getMediosNegativos,
    getSaludFinanciera,
    getFlujoCajaProyectado,
    
    // Estados derivados
    hasData: data !== null,
    totalMedios: data ? data.totales.cantidadMedios : 0,
    balanceTotal: data ? data.totales.balanceTotal : 0,
    esPositivo: data ? data.totales.balanceTotal > 0 : false,
    tieneAlertas: data ? (
      data.analisis.alertas.mediosEnRojo > 0 || 
      data.analisis.alertas.concentracionExcesiva ||
      data.analisis.alertas.sinMovimiento > 0
    ) : false,
    ultimaActualizacion: data ? new Date(data.generadoEn) : null
  };
}

// Hook específico para alertas financieras
export function useAlertasFinancieras() {
  const { data, getSaludFinanciera } = useBalanceFinanzas({ 
    incluirGastos: true, 
    incluirIngresos: true 
  });
  
  const saludFinanciera = getSaludFinanciera();
  
  return {
    alertas: data?.analisis.alertas || null,
    saludFinanciera,
    requiereAtencion: saludFinanciera.estado === 'mala' || saludFinanciera.estado === 'critica',
    alertasCriticas: data ? (
      data.analisis.alertas.mediosEnRojo > data.totales.cantidadMedios / 2 ||
      data.totales.balanceTotal < -data.totales.ingresosTotales * 0.1
    ) : false
  };
}

// Hook para métricas de rendimiento
export function useMetricasRendimiento() {
  const { data, getFlujoCajaProyectado } = useBalanceFinanzas();
  const flujoCaja = getFlujoCajaProyectado();
  
  const metricas = data ? {
    roi: data.totales.gastosTotales > 0 ? 
      ((data.totales.ingresosTotales - data.totales.gastosTotales) / data.totales.gastosTotales) * 100 : 0,
    margenOperativo: data.totales.ingresosTotales > 0 ? 
      ((data.totales.ingresosTotales - data.totales.gastosTotales) / data.totales.ingresosTotales) * 100 : 0,
    rotacionMedios: data.totales.cantidadMedios > 0 ? 
      data.totales.cantidadTransacciones / data.totales.cantidadMedios : 0,
    eficienciaOperativa: data.totales.ingresosTotales > 0 && data.totales.gastosTotales > 0 ? 
      data.totales.ingresosTotales / data.totales.gastosTotales : 0,
    flujoCaja
  } : null;
  
  return { metricas };
}