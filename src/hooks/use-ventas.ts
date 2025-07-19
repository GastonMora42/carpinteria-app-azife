// src/hooks/use-ventas.ts - VERSIÓN MEJORADA Y PROFESIONALIZADA
import { useState, useEffect } from 'react';
import { VentaFormData } from '@/lib/validations/venta';
import { api } from '@/lib/utils/http';
import { convertDecimalFields, VentaWithNumbers } from '@/lib/types/prisma-overrides';

interface UseVentasParams {
  page?: number;
  limit?: number;
  estado?: string;
  clienteId?: string;
  search?: string;
}

export function useVentas(params: UseVentasParams = {}) {
  const [ventas, setVentas] = useState<VentaWithNumbers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });

  const fetchVentas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🛒 Fetching ventas with params:', params);
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      const data = await api.get(`/api/ventas?${searchParams}`);
      
      console.log('✅ Ventas fetched successfully:', data.data?.length || 0);
      
      // Convertir campos Decimal a number
      const convertedVentas = (data.data || []).map((venta: any) => 
        convertDecimalFields(venta, [
          'subtotal', 
          'descuento', 
          'impuestos', 
          'total', 
          'totalCobrado', 
          'saldoPendiente', 
          'porcentajeAvance'
        ])
      );
      
      setVentas(convertedVentas);
      setPagination(data.pagination || { total: 0, pages: 0, page: 1, limit: 10 });
    } catch (err: any) {
      console.error('❌ Error fetching ventas:', err);
      setError(err.message || 'Error al cargar ventas');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const createVenta = async (ventaData: VentaFormData): Promise<VentaWithNumbers> => {
    try {
      console.log('➕ Creating venta with data:', {
        cliente: ventaData.clienteId,
        presupuesto: ventaData.presupuestoId || 'ninguno',
        tipo: ventaData.presupuestoId ? 'conversión de presupuesto' : 'venta directa',
        items: ventaData.items?.length || 0,
        fechaEntrega: ventaData.fechaEntrega,
        descripcion: ventaData.descripcionObra?.substring(0, 50) + '...'
      });
      
      // Preparar datos para envío
      const dataToSend = {
        ...ventaData,
        // Asegurar que fechaEntrega sea string ISO si existe
        fechaEntrega: ventaData.fechaEntrega ? ventaData.fechaEntrega.toISOString() : undefined
      };
      
      console.log('📤 Sending venta data:', {
        ...dataToSend,
        fechaEntrega: dataToSend.fechaEntrega || 'ninguna'
      });
      
      const newVenta = await api.post('/api/ventas', dataToSend);
      
      console.log('✅ Venta created successfully:', {
        id: newVenta.id,
        numero: newVenta.numero,
        total: newVenta.total,
        cliente: newVenta.cliente?.nombre || 'N/A'
      });
      
      // Convertir campos Decimal a number
      const convertedVenta = convertDecimalFields(newVenta, [
        'subtotal', 
        'descuento', 
        'impuestos', 
        'total', 
        'totalCobrado', 
        'saldoPendiente', 
        'porcentajeAvance'
      ]);
      
      setVentas(prev => [convertedVenta, ...prev]);
      return convertedVenta;
    } catch (err: any) {
      console.error('❌ Error creating venta:', err);
      
      // Manejo específico de errores de validación
      if (err.message?.includes('Datos inválidos') && err.details) {
        const validationErrors = err.details.map((detail: any) => 
          `${detail.field}: ${detail.message}`
        ).join(', ');
        throw new Error(`Error de validación: ${validationErrors}`);
      }
      
      // Manejo específico de errores de conversión de presupuesto
      if (err.message?.includes('presupuesto')) {
        throw new Error(`Error con presupuesto: ${err.message}`);
      }
      
      // Error genérico
      throw new Error(err.message || 'Error al crear venta');
    }
  };

  const updateEstado = async (id: string, nuevoEstado: string): Promise<VentaWithNumbers> => {
    try {
      console.log('🔄 Updating venta estado:', { id, nuevoEstado });
      
      const updatedVenta = await api.put(`/api/ventas/${id}`, { estado: nuevoEstado });
      
      console.log('✅ Venta estado updated successfully:', updatedVenta.id);
      
      // Convertir campos Decimal a number
      const convertedVenta = convertDecimalFields(updatedVenta, [
        'subtotal', 
        'descuento', 
        'impuestos', 
        'total', 
        'totalCobrado', 
        'saldoPendiente', 
        'porcentajeAvance'
      ]);
      
      setVentas(prev => prev.map(v => v.id === id ? convertedVenta : v));
      return convertedVenta;
    } catch (err: any) {
      console.error('❌ Error updating venta estado:', err);
      throw new Error(err.message || 'Error al actualizar estado');
    }
  };

  const updateAvance = async (id: string, porcentajeAvance: number): Promise<VentaWithNumbers> => {
    try {
      console.log('📈 Updating venta avance:', { id, porcentajeAvance });
      
      const updatedVenta = await api.put(`/api/ventas/${id}`, { porcentajeAvance });
      
      console.log('✅ Venta avance updated successfully:', updatedVenta.id);
      
      // Convertir campos Decimal a number
      const convertedVenta = convertDecimalFields(updatedVenta, [
        'subtotal', 
        'descuento', 
        'impuestos', 
        'total', 
        'totalCobrado', 
        'saldoPendiente', 
        'porcentajeAvance'
      ]);
      
      setVentas(prev => prev.map(v => v.id === id ? convertedVenta : v));
      return convertedVenta;
    } catch (err: any) {
      console.error('❌ Error updating venta avance:', err);
      throw new Error(err.message || 'Error al actualizar avance');
    }
  };

  useEffect(() => {
    console.log('🔄 useVentas effect triggered:', params);
    fetchVentas();
  }, [JSON.stringify(params)]);

  return {
    ventas,
    loading,
    error,
    pagination,
    refetch: fetchVentas,
    createVenta,
    updateEstado,
    updateAvance
  };
}

// Hook para obtener una venta específica con todos sus detalles
export function useVenta(id: string | null) {
  const [venta, setVenta] = useState<VentaWithNumbers | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchVenta = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching venta details:', id);
        
        const data = await api.get(`/api/ventas/${id}`);
        
        console.log('✅ Venta fetched successfully:', {
          id: data.id,
          numero: data.numero,
          items: data.items?.length || 0,
          transacciones: data.transacciones?.length || 0
        });
        
        // Convertir campos Decimal a number
        const convertedVenta = convertDecimalFields(data, [
          'subtotal', 
          'descuento', 
          'impuestos', 
          'total', 
          'totalCobrado', 
          'saldoPendiente', 
          'porcentajeAvance'
        ]);
        
        setVenta(convertedVenta);
      } catch (err: any) {
        console.error('❌ Error fetching venta:', err);
        setError(err.message || 'Error al cargar venta');
        
        if (err.message?.includes('404')) {
          setError('Venta no encontrada');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVenta();
  }, [id]);

  return { venta, loading, error };
}