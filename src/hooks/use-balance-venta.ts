// src/hooks/use-balance-venta.ts - HOOK PARA BALANCE POR MEDIO DE PAGO
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/utils/http';

export interface BalancePorMedio {
  medioPago: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
  transacciones: any[];
  totalCobrado: number;
  cantidadPagos: number;
  ultimoPago: string | null;
  primerPago: string | null;
  porcentajeDelTotal: number;
  pagoPromedio: number;
}

export interface BalanceVenta {
  venta: {
    id: string;
    numero: string;
    cliente: {
      id: string;
      nombre: string;
    };
    total: number;
    moneda: string;
    fechaPedido: string;
  };
  balance: {
    totalCobrado: number;
    saldoPendiente: number;
    porcentajeCobrado: number;
    cantidadMediosPago: number;
    cantidadTransacciones: number;
  };
  balancePorMedio: BalancePorMedio[];
  estadisticas: {
    medioMasUsado: {
      nombre: string;
      cantidad: number;
      monto: number;
    } | null;
    distribucion: Array<{
      medio: string;
      porcentaje: number;
      monto: number;
    }>;
  };
  ultimaActualizacion: string;
}

export function useBalanceVenta(ventaId: string | null) {
  const [balance, setBalance] = useState<BalanceVenta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!ventaId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Fetching balance for venta:', ventaId);
      
      const data = await api.get(`/api/ventas/${ventaId}/balance`);
      
      console.log('✅ Balance fetched successfully:', {
        totalCobrado: data.balance.totalCobrado,
        mediosUsados: data.balancePorMedio.length,
        porcentajeCobrado: data.balance.porcentajeCobrado.toFixed(1) + '%'
      });
      
      setBalance(data);
    } catch (err: any) {
      console.error('❌ Error fetching balance:', err);
      setError(err.message || 'Error al cargar balance');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [ventaId]);

  // Función para obtener balance de un medio específico
  const getBalanceMedio = useCallback((medioId: string): BalancePorMedio | null => {
    if (!balance) return null;
    return balance.balancePorMedio.find(b => b.medioPago.id === medioId) || null;
  }, [balance]);

  // Función para obtener el medio más usado
  const getMedioMasUsado = useCallback((): BalancePorMedio | null => {
    if (!balance || balance.balancePorMedio.length === 0) return null;
    
    return balance.balancePorMedio.reduce((prev, current) => 
      prev.cantidadPagos > current.cantidadPagos ? prev : current
    );
  }, [balance]);

  // Función para obtener medios ordenados por monto
  const getMediosOrdenadosPorMonto = useCallback((): BalancePorMedio[] => {
    if (!balance) return [];
    
    return [...balance.balancePorMedio].sort((a, b) => b.totalCobrado - a.totalCobrado);
  }, [balance]);

  // Función para verificar si está completamente cobrado
  const isCompletamenteCobrado = useCallback((): boolean => {
    if (!balance) return false;
    return balance.balance.saldoPendiente <= 0.01; // Tolerancia de centavos
  }, [balance]);

  // Función para obtener el progreso de cobro
  const getProgresoCobro = useCallback((): {
    porcentaje: number;
    estado: 'pendiente' | 'parcial' | 'completo';
    mensaje: string;
  } => {
    if (!balance) {
      return { porcentaje: 0, estado: 'pendiente', mensaje: 'Sin datos' };
    }

    const porcentaje = balance.balance.porcentajeCobrado;
    
    if (porcentaje === 0) {
      return { 
        porcentaje: 0, 
        estado: 'pendiente', 
        mensaje: 'Sin pagos registrados' 
      };
    } else if (porcentaje < 100) {
      return { 
        porcentaje, 
        estado: 'parcial', 
        mensaje: `${porcentaje.toFixed(1)}% cobrado` 
      };
    } else {
      return { 
        porcentaje: 100, 
        estado: 'completo', 
        mensaje: 'Completamente cobrado' 
      };
    }
  }, [balance]);

  // Función para obtener la distribución de pagos
  const getDistribucionPagos = useCallback((): {
    medio: string;
    monto: number;
    porcentaje: number;
    color: string;
  }[] =>  {
    if (!balance) return [];

    const colores = [
      '#3B82F6', // blue-500
      '#10B981', // emerald-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#8B5CF6', // violet-500
      '#06B6D4', // cyan-500
      '#84CC16', // lime-500
      '#F97316', // orange-500
    ];

    return balance.balancePorMedio.map((medio, index) => ({
      medio: medio.medioPago.nombre,
      monto: medio.totalCobrado,
      porcentaje: medio.porcentajeDelTotal,
      color: colores[index % colores.length]
    }));
  }, [balance]);

  useEffect(() => {
    console.log('🔄 useBalanceVenta effect triggered for venta:', ventaId);
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance,
    
    // Funciones utilitarias
    getBalanceMedio,
    getMedioMasUsado,
    getMediosOrdenadosPorMonto,
    isCompletamenteCobrado,
    getProgresoCobro,
    getDistribucionPagos,
    
    // Estados derivados
    hasBalance: balance !== null,
    hasPagos: balance ? balance.balance.cantidadTransacciones > 0 : false,
    cantidadMediosUsados: balance ? balance.balancePorMedio.length : 0,
    ultimaActualizacion: balance ? new Date(balance.ultimaActualizacion) : null
  };
}

// Hook específico para estadísticas de medios de pago
export function useEstadisticasMediosPagoVenta(ventaId: string | null) {
  const { balance, loading } = useBalanceVenta(ventaId);
  
  const estadisticas = balance ? {
    medioPreferido: balance.estadisticas.medioMasUsado?.nombre || 'N/A',
    cantidadMediosUsados: balance.balance.cantidadMediosPago,
    distribucionUniforme: balance.balancePorMedio.length > 0 ? 
      Math.max(...balance.balancePorMedio.map(m => m.porcentajeDelTotal)) < 70 : false,
    diversificacion: balance.balancePorMedio.length >= 2 ? 'Alta' : 
                    balance.balancePorMedio.length === 1 ? 'Media' : 'Baja'
  } : null;
  
  return { estadisticas, loading };
}

// Hook para alertas de balance
export function useAlertasBalance(ventaId: string | null) {
  const { balance, getProgresoCobro } = useBalanceVenta(ventaId);
  
  const alertas = balance ? {
    saldoPendienteAlto: balance.balance.saldoPendiente > balance.venta.total * 0.5,
    soloUnMedioPago: balance.balancePorMedio.length === 1 && balance.balance.totalCobrado > balance.venta.total * 0.3,
    sinPagosRecientes: balance.balancePorMedio.length > 0 && balance.balancePorMedio.every(m => {
      if (!m.ultimoPago) return true;
      const ultimoPago = new Date(m.ultimoPago);
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      return ultimoPago < hace30Dias;
    }),
    progreso: getProgresoCobro()
  } : null;
  
  return { alertas };
}