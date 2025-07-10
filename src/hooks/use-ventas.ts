// src/hooks/use-ventas.ts - ACTUALIZADO
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
      console.log('➕ Creating venta:', ventaData.descripcionObra);
      console.log('📋 Venta data:', {
        clienteId: ventaData.clienteId,
        presupuestoId: ventaData.presupuestoId,
        itemsCount: ventaData.items?.length || 0,
        total: ventaData.items?.reduce((acc: number, item: { cantidad: number; precioUnitario: number; descuento: any; }) => 
          acc + (item.cantidad * item.precioUnitario * (1 - (item.descuento || 0) / 100)), 0
        ) || 0
      });
      
      const newVenta = await api.post('/api/ventas', ventaData);
      
      console.log('✅ Venta created successfully:', newVenta.id);
      
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
      throw new Error(err.message || 'Error al crear venta');
    }
  };

  const updateEstado = async (id: string, nuevoEstado: string): Promise<VentaWithNumbers> => {
    try {
      console.log('🔄 Updating venta estado:', id, nuevoEstado);
      
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
      console.log('📈 Updating venta avance:', id, porcentajeAvance);
      
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

        console.log('🔍 Fetching venta:', id);
        
        const data = await api.get(`/api/ventas/${id}`);
        
        console.log('✅ Venta fetched successfully:', data.id);
        console.log('📋 Items count:', data.items?.length || 0);
        
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