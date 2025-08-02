// src/hooks/use-gastos-presupuesto.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/utils/http';
import { GastoPresupuestoFormData } from '@/lib/validations/gasto-presupuesto';

export interface GastoPresupuesto {
  id: string;
  numero: string;
  presupuestoId: string;
  descripcion: string;
  categoria: string;
  subcategoria?: string;
  monto: number;
  moneda: string;
  fecha: string;
  comprobante?: string;
  proveedor?: string;
  notas?: string;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EstadisticasGastosPresupuesto {
  totalGastos: number;
  montoTotal: number;
  gastosPorCategoria: Array<{
    categoria: string;
    cantidad: number;
    monto: number;
  }>;
}

export interface PresupuestoInfo {
  id: string;
  numero: string;
  cliente: string;
}

export function useGastosPresupuesto(presupuestoId: string | null) {
  const [gastos, setGastos] = useState<GastoPresupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGastosPresupuesto>({
    totalGastos: 0,
    montoTotal: 0,
    gastosPorCategoria: []
  });
  const [presupuestoInfo, setPresupuestoInfo] = useState<PresupuestoInfo | null>(null);

  const fetchGastos = useCallback(async () => {
    if (!presupuestoId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Fetching gastos for presupuesto:', presupuestoId);
      
      const data = await api.get(`/api/presupuestos/${presupuestoId}/gastos`);
      
      console.log('✅ Gastos fetched successfully:', data.gastos?.length || 0);
      
      setGastos(data.gastos || []);
      setEstadisticas(data.estadisticas || {
        totalGastos: 0,
        montoTotal: 0,
        gastosPorCategoria: []
      });
      setPresupuestoInfo(data.presupuesto || null);
      
    } catch (err: any) {
      console.error('❌ Error fetching gastos:', err);
      setError(err.message || 'Error al cargar gastos');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [presupuestoId]);

  const createGasto = useCallback(async (gastoData: GastoPresupuestoFormData): Promise<GastoPresupuesto> => {
    try {
      console.log('➕ Creating gasto for presupuesto:', presupuestoId);
      
      const nuevoGasto = await api.post(`/api/presupuestos/${presupuestoId}/gastos`, gastoData);
      
      console.log('✅ Gasto created successfully:', nuevoGasto.numero);
      
      // Actualizar lista de gastos
      setGastos(prev => [nuevoGasto, ...prev]);
      
      // Recalcular estadísticas
      setEstadisticas(prev => ({
        totalGastos: prev.totalGastos + 1,
        montoTotal: prev.montoTotal + gastoData.monto,
        gastosPorCategoria: recalcularCategoria(prev.gastosPorCategoria, gastoData.categoria, gastoData.monto, 1)
      }));
      
      return nuevoGasto;
    } catch (err: any) {
      console.error('❌ Error creating gasto:', err);
      throw new Error(err.message || 'Error al crear gasto');
    }
  }, [presupuestoId]);

  const updateGasto = useCallback(async (id: string, gastoData: Partial<GastoPresupuestoFormData>): Promise<GastoPresupuesto> => {
    try {
      console.log('✏️ Updating gasto:', id);
      
      const updatedGasto = await api.put(`/api/gastos-presupuesto/${id}`, gastoData);
      
      console.log('✅ Gasto updated successfully:', updatedGasto.id);
      
      // Actualizar en la lista
      setGastos(prev => prev.map(g => g.id === id ? updatedGasto : g));
      
      return updatedGasto;
    } catch (err: any) {
      console.error('❌ Error updating gasto:', err);
      throw new Error(err.message || 'Error al actualizar gasto');
    }
  }, []);

  const deleteGasto = useCallback(async (id: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting gasto:', id);
      
      const gastoAEliminar = gastos.find(g => g.id === id);
      
      await api.delete(`/api/gastos-presupuesto/${id}`);
      
      console.log('✅ Gasto deleted successfully');
      
      // Remover de la lista
      setGastos(prev => prev.filter(g => g.id !== id));
      
      // Recalcular estadísticas
      if (gastoAEliminar) {
        setEstadisticas(prev => ({
          totalGastos: Math.max(0, prev.totalGastos - 1),
          montoTotal: prev.montoTotal - gastoAEliminar.monto,
          gastosPorCategoria: recalcularCategoria(prev.gastosPorCategoria, gastoAEliminar.categoria, -gastoAEliminar.monto, -1)
        }));
      }
    } catch (err: any) {
      console.error('❌ Error deleting gasto:', err);
      throw new Error(err.message || 'Error al eliminar gasto');
    }
  }, [gastos]);

  const getGastosPorPeriodo = useCallback((fechaInicio: Date, fechaFin: Date): GastoPresupuesto[] => {
    return gastos.filter(gasto => {
      const fechaGasto = new Date(gasto.fecha);
      return fechaGasto >= fechaInicio && fechaGasto <= fechaFin;
    });
  }, [gastos]);

  const getGastosPorCategoria = useCallback((categoria: string): GastoPresupuesto[] => {
    return gastos.filter(gasto => gasto.categoria === categoria);
  }, [gastos]);

  // Función helper para recalcular categorías
  const recalcularCategoria = (
    categorias: Array<{ categoria: string; cantidad: number; monto: number }>,
    categoria: string,
    montoDelta: number,
    cantidadDelta: number
  ) => {
    const categoriasMap = new Map(categorias.map(c => [c.categoria, { ...c }]));
    
    if (categoriasMap.has(categoria)) {
      const existing = categoriasMap.get(categoria)!;
      existing.cantidad += cantidadDelta;
      existing.monto += montoDelta;
      
      // Si queda en 0, eliminar la categoría
      if (existing.cantidad <= 0) {
        categoriasMap.delete(categoria);
      }
    } else if (cantidadDelta > 0) {
      // Nueva categoría
      categoriasMap.set(categoria, {
        categoria,
        cantidad: cantidadDelta,
        monto: montoDelta
      });
    }
    
    return Array.from(categoriasMap.values());
  };

  useEffect(() => {
    console.log('🔄 useGastosPresupuesto effect triggered for presupuesto:', presupuestoId);
    fetchGastos();
  }, [fetchGastos]);

  return {
    gastos,
    loading,
    error,
    estadisticas,
    presupuestoInfo,
    refetch: fetchGastos,
    createGasto,
    updateGasto,
    deleteGasto,
    getGastosPorPeriodo,
    getGastosPorCategoria
  };
}

// Hook para análisis de márgenes de presupuesto
export function useAnalisisMargen(presupuestoId: string | null) {
  const [analisis, setAnalisis] = useState<{
    presupuesto: {
      numero: string;
      total: number;
      moneda: string;
      cliente: string;
    } | null;
    gastos: {
      total: number;
      porCategoria: Record<string, number>;
    };
    ventas: {
      total: number;
      saldoPendiente: number;
    };
    margen: {
      bruto: number;
      porcentaje: number;
      estado: 'positivo' | 'negativo' | 'equilibrio';
    };
    loading: boolean;
    error: string | null;
  }>({
    presupuesto: null,
    gastos: { total: 0, porCategoria: {} },
    ventas: { total: 0, saldoPendiente: 0 },
    margen: { bruto: 0, porcentaje: 0, estado: 'equilibrio' },
    loading: true,
    error: null
  });

  const fetchAnalisis = useCallback(async () => {
    if (!presupuestoId) {
      setAnalisis(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setAnalisis(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('📊 Fetching análisis de margen for presupuesto:', presupuestoId);
      
      // Obtener datos del presupuesto, gastos y ventas en paralelo
      const [presupuestoData, gastosData, ventasData] = await Promise.all([
        api.get(`/api/presupuestos/${presupuestoId}`),
        api.get(`/api/presupuestos/${presupuestoId}/gastos`),
        api.get(`/api/ventas?presupuestoId=${presupuestoId}`)
      ]);
      
      // Calcular totales
      const totalGastos = gastosData.estadisticas?.montoTotal || 0;
      const totalVentas = ventasData.data?.[0]?.total || 0;
      const saldoPendiente = ventasData.data?.[0]?.saldoPendiente || 0;
      
      // Calcular margen
      const margenBruto = totalVentas - totalGastos;
      const porcentajeMargen = totalVentas > 0 ? (margenBruto / totalVentas) * 100 : 0;
      const estadoMargen: 'positivo' | 'negativo' | 'equilibrio' = 
        margenBruto > 0 ? 'positivo' : margenBruto < 0 ? 'negativo' : 'equilibrio';
      
      // Gastos por categoría
      const gastosPorCategoria = gastosData.estadisticas?.gastosPorCategoria?.reduce(
        (acc: Record<string, number>, item: any) => {
          acc[item.categoria] = item.monto;
          return acc;
        }, {}
      ) || {};
      
      setAnalisis({
        presupuesto: {
          numero: presupuestoData.numero,
          total: Number(presupuestoData.total),
          moneda: presupuestoData.moneda,
          cliente: presupuestoData.cliente.nombre
        },
        gastos: {
          total: totalGastos,
          porCategoria: gastosPorCategoria
        },
        ventas: {
          total: totalVentas,
          saldoPendiente
        },
        margen: {
          bruto: margenBruto,
          porcentaje: porcentajeMargen,
          estado: estadoMargen
        },
        loading: false,
        error: null
      });
      
      console.log('✅ Análisis de margen loaded successfully');
    } catch (err: any) {
      console.error('❌ Error fetching análisis de margen:', err);
      setAnalisis(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Error al cargar análisis'
      }));
    }
  }, [presupuestoId]);

  useEffect(() => {
    fetchAnalisis();
  }, [fetchAnalisis]);

  return {
    ...analisis,
    refetch: fetchAnalisis
  };
}