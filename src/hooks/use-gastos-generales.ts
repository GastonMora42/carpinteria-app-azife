// src/hooks/use-gastos-generales.ts - CORREGIDO
import { useState, useEffect } from 'react';
import { api } from '@/lib/utils/http';

interface GastoGeneral {
  id: string;
  numero: string;
  descripcion: string;
  categoria: string;
  subcategoria?: string;
  monto: number;
  moneda: string;
  fecha: string;
  periodo?: string;
  numeroFactura?: string;
  proveedor?: string;
  medioPago: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface GastoGeneralFormData {
  descripcion: string;
  categoria: string;
  subcategoria?: string;
  monto: number;
  moneda: 'PESOS' | 'DOLARES';
  fecha: string;
  periodo?: string;
  numeroFactura?: string;
  proveedor?: string;
  medioPagoId: string;
}

// CORREGIDO: Interfaces más específicas para estadísticas
interface EstadisticaCategoria {
  categoria: string;
  cantidad: number;
  monto: number;
}

interface EstadisticaMedioPago {
  medioPago: {
    id: string;
    nombre: string;
  };
  cantidad: number;
  monto: number;
}

interface EstadisticasGastosGenerales {
  totalGastos: number;
  montoTotal: number;
  gastosPorCategoria: EstadisticaCategoria[];
  gastosPorMedioPago: EstadisticaMedioPago[];
}

interface UseGastosGeneralesParams {
  page?: number;
  limit?: number;
  categoria?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  periodo?: string;
  medioPagoId?: string;
}

export function useGastosGenerales(params: UseGastosGeneralesParams = {}) {
  const [gastos, setGastos] = useState<GastoGeneral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 20
  });
  const [estadisticas, setEstadisticas] = useState<EstadisticasGastosGenerales>({
    totalGastos: 0,
    montoTotal: 0,
    gastosPorCategoria: [],
    gastosPorMedioPago: []
  });

  const fetchGastos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Fetching gastos generales with params:', params);
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      const data = await api.get(`/api/gastos-generales?${searchParams}`);
      
      console.log('✅ Gastos generales fetched successfully:', {
        gastos: data.data?.length || 0,
        montoTotal: data.estadisticas?.montoTotal || 0,
        mediosPago: data.estadisticas?.gastosPorMedioPago?.length || 0
      });
      
      setGastos(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 0, page: 1, limit: 20 });
      setEstadisticas(data.estadisticas || {
        totalGastos: 0,
        montoTotal: 0,
        gastosPorCategoria: [],
        gastosPorMedioPago: []
      });
    } catch (err: any) {
      console.error('❌ Error fetching gastos generales:', err);
      setError(err.message || 'Error al cargar gastos generales');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const createGasto = async (gastoData: GastoGeneralFormData): Promise<GastoGeneral> => {
    try {
      console.log('➕ Creating gasto general:', {
        descripcion: gastoData.descripcion,
        medioPagoId: gastoData.medioPagoId
      });
      
      const newGasto = await api.post('/api/gastos-generales', gastoData);
      
      console.log('✅ Gasto general created successfully:', newGasto.id);
      
      setGastos(prev => [newGasto, ...prev]);
      
      // Actualizar estadísticas
      setEstadisticas(prev => ({
        totalGastos: prev.totalGastos + 1,
        montoTotal: prev.montoTotal + gastoData.monto,
        gastosPorCategoria: actualizarEstadisticasCategoria(
          prev.gastosPorCategoria, 
          gastoData.categoria, 
          gastoData.monto, 
          1
        ),
        gastosPorMedioPago: actualizarEstadisticasMedioPago(
          prev.gastosPorMedioPago, 
          newGasto.medioPago, 
          gastoData.monto, 
          1
        )
      }));
      
      return newGasto;
    } catch (err: any) {
      console.error('❌ Error creating gasto general:', err);
      throw new Error(err.message || 'Error al crear gasto general');
    }
  };

  const updateGasto = async (id: string, gastoData: Partial<GastoGeneralFormData>): Promise<GastoGeneral> => {
    try {
      console.log('✏️ Updating gasto general:', id);
      
      const updatedGasto = await api.put(`/api/gastos-generales/${id}`, gastoData);
      
      console.log('✅ Gasto general updated successfully:', updatedGasto.id);
      
      setGastos(prev => prev.map(g => g.id === id ? updatedGasto : g));
      return updatedGasto;
    } catch (err: any) {
      console.error('❌ Error updating gasto general:', err);
      throw new Error(err.message || 'Error al actualizar gasto general');
    }
  };

  const deleteGasto = async (id: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting gasto general:', id);
      
      const gastoAEliminar = gastos.find(g => g.id === id);
      
      await api.delete(`/api/gastos-generales/${id}`);
      
      console.log('✅ Gasto general deleted successfully:', id);
      
      setGastos(prev => prev.filter(g => g.id !== id));
      
      // Actualizar estadísticas
      if (gastoAEliminar) {
        setEstadisticas(prev => ({
          totalGastos: Math.max(0, prev.totalGastos - 1),
          montoTotal: prev.montoTotal - gastoAEliminar.monto,
          gastosPorCategoria: actualizarEstadisticasCategoria(
            prev.gastosPorCategoria, 
            gastoAEliminar.categoria, 
            -gastoAEliminar.monto, 
            -1
          ),
          gastosPorMedioPago: actualizarEstadisticasMedioPago(
            prev.gastosPorMedioPago, 
            gastoAEliminar.medioPago, 
            -gastoAEliminar.monto, 
            -1
          )
        }));
      }
    } catch (err: any) {
      console.error('❌ Error deleting gasto general:', err);
      throw new Error(err.message || 'Error al eliminar gasto general');
    }
  };

  // FUNCIONES UTILITARIAS

  const getGastosPorMedioPago = (medioId: string): GastoGeneral[] => {
    return gastos.filter(gasto => gasto.medioPago.id === medioId);
  };

  const getGastosPorCategoria = (categoria: string): GastoGeneral[] => {
    return gastos.filter(gasto => gasto.categoria === categoria);
  };

  const getMedioMasUsado = (): { medioPago: string; cantidad: number; monto: number } | null => {
    if (estadisticas.gastosPorMedioPago.length === 0) return null;
    
    const medioMasUsado = estadisticas.gastosPorMedioPago.reduce((prev, current) => 
      prev.cantidad > current.cantidad ? prev : current
    );
    
    return {
      medioPago: medioMasUsado.medioPago.nombre,
      cantidad: medioMasUsado.cantidad,
      monto: medioMasUsado.monto
    };
  };

  const getCategoriaMayorGasto = (): { categoria: string; monto: number } | null => {
    if (estadisticas.gastosPorCategoria.length === 0) return null;
    
    return estadisticas.gastosPorCategoria.reduce((prev, current) => 
      prev.monto > current.monto ? prev : current
    );
  };

  // CORREGIDO: Funciones helper para actualizar estadísticas con tipos correctos
  const actualizarEstadisticasCategoria = (
    categorias: EstadisticaCategoria[],
    categoria: string,
    montoDelta: number,
    cantidadDelta: number
  ): EstadisticaCategoria[] => {
    const categoriasMap = new Map(categorias.map(c => [c.categoria, { ...c }]));
    
    if (categoriasMap.has(categoria)) {
      const existing = categoriasMap.get(categoria)!;
      existing.cantidad += cantidadDelta;
      existing.monto += montoDelta;
      
      if (existing.cantidad <= 0) {
        categoriasMap.delete(categoria);
      }
    } else if (cantidadDelta > 0) {
      categoriasMap.set(categoria, {
        categoria,
        cantidad: cantidadDelta,
        monto: montoDelta
      });
    }
    
    return Array.from(categoriasMap.values());
  };

  const actualizarEstadisticasMedioPago = (
    mediosPago: EstadisticaMedioPago[],
    medioPago: { id: string; nombre: string; descripcion?: string },
    montoDelta: number,
    cantidadDelta: number
  ): EstadisticaMedioPago[] => {
    const mediosMap = new Map(mediosPago.map(m => [m.medioPago.id, { ...m }]));
    
    if (mediosMap.has(medioPago.id)) {
      const existing = mediosMap.get(medioPago.id)!;
      existing.cantidad += cantidadDelta;
      existing.monto += montoDelta;
      
      if (existing.cantidad <= 0) {
        mediosMap.delete(medioPago.id);
      }
    } else if (cantidadDelta > 0) {
      mediosMap.set(medioPago.id, {
        medioPago: {
          id: medioPago.id,
          nombre: medioPago.nombre
        },
        cantidad: cantidadDelta,
        monto: montoDelta
      });
    }
    
    return Array.from(mediosMap.values());
  };

  useEffect(() => {
    console.log('🔄 useGastosGenerales effect triggered:', params);
    fetchGastos();
  }, [JSON.stringify(params)]);

  return {
    gastos,
    loading,
    error,
    pagination,
    estadisticas,
    refetch: fetchGastos,
    createGasto,
    updateGasto,
    deleteGasto,
    
    // FUNCIONES UTILITARIAS
    getGastosPorMedioPago,
    getGastosPorCategoria,
    getMedioMasUsado,
    getCategoriaMayorGasto
  };
}