
// src/hooks/use-transacciones.ts - ACTUALIZADO CON HTTP CLIENT
import { useState, useEffect } from 'react';
import { TransaccionFormData } from '@/lib/validations/transaccion';
import { api } from '@/lib/utils/http';

interface Transaccion {
  tipoComprobante: any;
  numeroComprobante: any;
  id: string;
  numero: string;
  tipo: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  moneda: string;
  fecha: string;
  cliente?: { id: string; nombre: string };
  proveedor?: { id: string; nombre: string };
  pedido?: { id: string; numero: string };
  medioPago: { id: string; nombre: string };
}

interface UseTransaccionesParams {
  page?: number;
  limit?: number;
  tipo?: string;
  clienteId?: string;
  pedidoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export function useTransacciones(params: UseTransaccionesParams = {}) {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });

  const fetchTransacciones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Fetching transacciones with params:', params);
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      // Usar api.get que incluye automáticamente cookies
      const data = await api.get(`/api/transacciones?${searchParams}`);
      
      console.log('✅ Transacciones fetched successfully:', data.data?.length || 0);
      
      setTransacciones(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 0, page: 1, limit: 10 });
    } catch (err: any) {
      console.error('❌ Error fetching transacciones:', err);
      setError(err.message || 'Error al cargar transacciones');
      
      // Si es error de autenticación, redirigir al login
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const createTransaccion = async (transaccionData: TransaccionFormData): Promise<Transaccion> => {
    try {
      console.log('➕ Creating transaccion:', transaccionData.concepto);
      
      // Usar api.post que incluye automáticamente cookies
      const newTransaccion = await api.post('/api/transacciones', transaccionData);
      
      console.log('✅ Transaccion created successfully:', newTransaccion.id);
      
      setTransacciones(prev => [newTransaccion, ...prev]);
      return newTransaccion;
    } catch (err: any) {
      console.error('❌ Error creating transaccion:', err);
      throw new Error(err.message || 'Error al crear transacción');
    }
  };

  useEffect(() => {
    console.log('🔄 useTransacciones effect triggered:', params);
    fetchTransacciones();
  }, [JSON.stringify(params)]);

  return {
    transacciones,
    loading,
    error,
    pagination,
    refetch: fetchTransacciones,
    createTransaccion
  };
}
