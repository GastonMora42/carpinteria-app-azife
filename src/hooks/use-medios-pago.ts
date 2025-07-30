// src/hooks/use-medios-pago.ts - HOOK PARA CARGAR MEDIOS DE PAGO REALES
import { useState, useEffect } from 'react';
import { api } from '@/lib/utils/http';

interface MedioPago {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseMediosPagoResult {
  mediosPago: MedioPago[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createMedioPago: (data: { nombre: string; descripcion?: string }) => Promise<MedioPago>;
}

export function useMediosPago(): UseMediosPagoResult {
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMediosPago = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏦 Fetching medios de pago...');
      
      const response = await api.get('/api/medios-pago');
      
      console.log('✅ Medios de pago fetched successfully:', response.data?.length || 0);
      
      // El API ya maneja la creación automática si no existen medios
      setMediosPago(response.data || []);
    } catch (err: any) {
      console.error('❌ Error fetching medios de pago:', err);
      setError(err.message || 'Error al cargar medios de pago');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const createMedioPago = async (data: { nombre: string; descripcion?: string }): Promise<MedioPago> => {
    try {
      console.log('➕ Creating medio de pago:', data.nombre);
      
      const newMedio = await api.post('/api/medios-pago', data);
      
      console.log('✅ Medio de pago created successfully:', newMedio.id);
      
      setMediosPago(prev => [newMedio, ...prev]);
      return newMedio;
    } catch (err: any) {
      console.error('❌ Error creating medio de pago:', err);
      throw new Error(err.message || 'Error al crear medio de pago');
    }
  };

  useEffect(() => {
    console.log('🔄 useMediosPago effect triggered');
    fetchMediosPago();
  }, []);

  return {
    mediosPago,
    loading,
    error,
    refetch: fetchMediosPago,
    createMedioPago
  };
}

// Hook específico para obtener medios de pago activos (para formularios)
export function useMediosPagoActivos() {
  const { mediosPago, loading, error } = useMediosPago();
  
  const mediosActivos = mediosPago.filter(medio => medio.activo);
  
  return {
    mediosPago: mediosActivos,
    loading,
    error,
    isEmpty: mediosActivos.length === 0
  };
}

// Hook para estadísticas de medios de pago (uso en transacciones)
export function useEstadisticasMediosPago() {
  const [estadisticas, setEstadisticas] = useState<{
    uso: Array<{
      medioPago: string;
      cantidad: number;
      monto: number;
      porcentaje: number;
    }>;
    preferencias: {
      masUsado: string;
      mayorMonto: string;
    };
    loading: boolean;
  }>({
    uso: [],
    preferencias: { masUsado: '', mayorMonto: '' },
    loading: true
  });

  const fetchEstadisticas = async () => {
    try {
      console.log('📊 Fetching estadísticas de medios de pago...');
      
      // Obtener transacciones y calcular estadísticas
      const transacciones = await api.get('/api/transacciones?limit=1000');
      
      const usoMedios = (transacciones.data || []).reduce((acc: any, t: any) => {
        const medioNombre = t.medioPago?.nombre || 'Sin especificar';
        if (!acc[medioNombre]) {
          acc[medioNombre] = { cantidad: 0, monto: 0 };
        }
        acc[medioNombre].cantidad += 1;
        acc[medioNombre].monto += Number(t.monto);
        return acc;
      }, {});

      const totalTransacciones = transacciones.data?.length || 0;
      const totalMonto = Object.values(usoMedios).reduce((acc: number, uso: any) => acc + uso.monto, 0);

      const estadisticasUso = Object.entries(usoMedios).map(([medio, data]: [string, any]) => ({
        medioPago: medio,
        cantidad: data.cantidad,
        monto: data.monto,
        porcentaje: totalTransacciones > 0 ? (data.cantidad / totalTransacciones) * 100 : 0
      })).sort((a, b) => b.cantidad - a.cantidad);

      const masUsado = estadisticasUso[0]?.medioPago || '';
      const mayorMonto = estadisticasUso.sort((a, b) => b.monto - a.monto)[0]?.medioPago || '';

      setEstadisticas({
        uso: estadisticasUso,
        preferencias: { masUsado, mayorMonto },
        loading: false
      });
      
      console.log('✅ Estadísticas calculadas:', estadisticasUso.length, 'medios analizados');
    } catch (err: any) {
      console.error('❌ Error calculating estadísticas:', err);
      setEstadisticas(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  return estadisticas;
}