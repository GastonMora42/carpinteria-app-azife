// src/hooks/use-presupuestos.ts - ACTUALIZADO CON VALIDACIÓN DE NÚMERO
import { useState, useEffect } from 'react';
import { PresupuestoFormData } from '@/lib/validations/presupuesto';
import { api } from '@/lib/utils/http';
import { convertDecimalFields, PresupuestoWithNumbers } from '@/lib/types/prisma-overrides';

interface UsePresupuestosParams {
  page?: number;
  limit?: number;
  estado?: string;
  clienteId?: string;
  search?: string;
  numero?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export function usePresupuestos(params: UsePresupuestosParams = {}) {
  const [presupuestos, setPresupuestos] = useState<PresupuestoWithNumbers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });

  const fetchPresupuestos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Fetching presupuestos with params:', params);
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });

      const data = await api.get(`/api/presupuestos?${searchParams}`);
      
      console.log('✅ Presupuestos fetched successfully:', data.data?.length || 0);
      
      // Convertir campos Decimal a number
      const convertedPresupuestos = (data.data || []).map((presupuesto: any) => 
        convertDecimalFields(presupuesto, ['subtotal', 'descuento', 'impuestos', 'total'])
      );
      
      setPresupuestos(convertedPresupuestos);
      setPagination(data.pagination || { total: 0, pages: 0, page: 1, limit: 10 });
    } catch (err: any) {
      console.error('❌ Error fetching presupuestos:', err);
      setError(err.message || 'Error al cargar presupuestos');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const createPresupuesto = async (presupuestoData: PresupuestoFormData): Promise<PresupuestoWithNumbers> => {
    try {
      console.log('➕ Creating presupuesto:', presupuestoData.descripcionObra);
      console.log('📋 With number:', presupuestoData.numero || 'auto-generate');
      
      const newPresupuesto = await api.post('/api/presupuestos', presupuestoData);
      
      console.log('✅ Presupuesto created successfully:', {
        id: newPresupuesto.id,
        numero: newPresupuesto.numero,
        total: newPresupuesto.total
      });
      
      // Convertir campos Decimal a number
      const convertedPresupuesto = convertDecimalFields(newPresupuesto, ['subtotal', 'descuento', 'impuestos', 'total']);
      
      setPresupuestos(prev => [convertedPresupuesto, ...prev]);
      return convertedPresupuesto;
    } catch (err: any) {
      console.error('❌ Error creating presupuesto:', err);
      throw new Error(err.message || 'Error al crear presupuesto');
    }
  };

  const updatePresupuesto = async (id: string, data: Partial<PresupuestoFormData>): Promise<PresupuestoWithNumbers> => {
    try {
      console.log('✏️ Updating presupuesto:', id);
      
      const updatedPresupuesto = await api.put(`/api/presupuestos/${id}`, data);
      
      console.log('✅ Presupuesto updated successfully:', updatedPresupuesto.id);
      
      // Convertir campos Decimal a number
      const convertedPresupuesto = convertDecimalFields(updatedPresupuesto, ['subtotal', 'descuento', 'impuestos', 'total']);
      
      setPresupuestos(prev => prev.map(p => p.id === id ? convertedPresupuesto : p));
      return convertedPresupuesto;
    } catch (err: any) {
      console.error('❌ Error updating presupuesto:', err);
      throw new Error(err.message || 'Error al actualizar presupuesto');
    }
  };

  const convertirAVenta = async (id: string) => {
    try {
      console.log('🔄 Converting presupuesto to sale:', id);
      
      const pedido = await api.post(`/api/presupuestos/${id}/convertir`);
      
      console.log('✅ Presupuesto converted successfully:', pedido.id);
      
      setPresupuestos(prev => prev.map(p => 
        p.id === id ? { ...p, estado: 'CONVERTIDO' } : p
      ));
      
      return pedido;
    } catch (err: any) {
      console.error('❌ Error converting presupuesto:', err);
      throw new Error(err.message || 'Error al convertir presupuesto');
    }
  };

  // Función para buscar presupuesto por número específico
  const findByNumero = async (numero: string): Promise<PresupuestoWithNumbers | null> => {
    try {
      console.log('🔍 Searching presupuesto by numero:', numero);
      
      const data = await api.get(`/api/presupuestos?numero=${encodeURIComponent(numero)}&limit=1`);
      
      if (data.data && data.data.length > 0) {
        const convertedPresupuesto = convertDecimalFields(data.data[0], ['subtotal', 'descuento', 'impuestos', 'total']);
        console.log('✅ Presupuesto found:', convertedPresupuesto.numero);
        return convertedPresupuesto;
      }
      
      console.log('❌ Presupuesto not found with numero:', numero);
      return null;
    } catch (err: any) {
      console.error('❌ Error searching presupuesto by numero:', err);
      throw new Error(err.message || 'Error al buscar presupuesto');
    }
  };

  // NUEVO: Función para generar número sugerido
  const generateSuggestedNumber = async (): Promise<string> => {
    try {
      console.log('🔢 Generating suggested number...');
      
      const data = await api.get('/api/presupuestos/generar-numero');
      
      console.log('✅ Suggested number generated:', data.numero);
      return data.numero;
    } catch (err: any) {
      console.error('❌ Error generating suggested number:', err);
      throw new Error(err.message || 'Error al generar número sugerido');
    }
  };

  // NUEVO: Función para validar disponibilidad de número
  const validateNumber = async (numero: string): Promise<{ available: boolean; message: string }> => {
    try {
      console.log('🔍 Validating number availability:', numero);
      
      const data = await api.post('/api/presupuestos/generar-numero', { numero });
      
      console.log(`${data.available ? '✅' : '❌'} Number validation result:`, data.message);
      
      return {
        available: data.available,
        message: data.message
      };
    } catch (err: any) {
      console.error('❌ Error validating number:', err);
      return {
        available: false,
        message: 'Error al validar número'
      };
    }
  };

  // Función para obtener estadísticas de presupuestos
  const getEstadisticas = () => {
    const total = presupuestos.length;
    const pendientes = presupuestos.filter(p => ['PENDIENTE', 'ENVIADO'].includes(p.estado)).length;
    const aprobados = presupuestos.filter(p => p.estado === 'APROBADO').length;
    const convertidos = presupuestos.filter(p => p.estado === 'CONVERTIDO').length;
    const vencidos = presupuestos.filter(p => p.estado === 'VENCIDO').length;
    const montoTotal = presupuestos.reduce((acc, p) => acc + p.total, 0);
    const montoPendiente = presupuestos
      .filter(p => ['PENDIENTE', 'ENVIADO', 'APROBADO'].includes(p.estado))
      .reduce((acc, p) => acc + p.total, 0);

    return {
      total,
      pendientes,
      aprobados,
      convertidos,
      vencidos,
      montoTotal,
      montoPendiente,
      tasaConversion: total > 0 ? (convertidos / total) * 100 : 0
    };
  };

  useEffect(() => {
    console.log('🔄 usePresupuestos effect triggered:', params);
    fetchPresupuestos();
  }, [JSON.stringify(params)]);

  return {
    presupuestos,
    loading,
    error,
    pagination,
    estadisticas: getEstadisticas(),
    refetch: fetchPresupuestos,
    createPresupuesto,
    updatePresupuesto,
    convertirAVenta,
    findByNumero,
    generateSuggestedNumber, // NUEVO
    validateNumber // NUEVO
  };
}

// Hook específico para obtener un presupuesto por ID
export function usePresupuesto(id: string | null) {
  const [presupuesto, setPresupuesto] = useState<PresupuestoWithNumbers | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchPresupuesto = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching presupuesto:', id);
        
        const data = await api.get(`/api/presupuestos/${id}`);
        
        console.log('✅ Presupuesto fetched successfully:', data.numero);
        
        const convertedPresupuesto = convertDecimalFields(data, ['subtotal', 'descuento', 'impuestos', 'total']);
        setPresupuesto(convertedPresupuesto);
      } catch (err: any) {
        console.error('❌ Error fetching presupuesto:', err);
        setError(err.message || 'Error al cargar presupuesto');
        
        if (err.message?.includes('404')) {
          setError('Presupuesto no encontrado');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPresupuesto();
  }, [id]);

  return { presupuesto, loading, error };
}

// Hook para buscar presupuestos con debounce
export function usePresupuestoSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PresupuestoWithNumbers[]>([]);
  const [searching, setSearching] = useState(false);

  const search = async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      
      const data = await api.get(`/api/presupuestos?search=${encodeURIComponent(term)}&limit=10`);
      
      const convertedResults = (data.data || []).map((presupuesto: any) => 
        convertDecimalFields(presupuesto, ['subtotal', 'descuento', 'impuestos', 'total'])
      );
      
      setSearchResults(convertedResults);
    } catch (err: any) {
      console.error('❌ Error searching presupuestos:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    searching,
    clearResults: () => setSearchResults([])
  };
}

// NUEVO: Hook para validación de números en tiempo real
export function useNumberValidation() {
  const [validationResult, setValidationResult] = useState<{
    isChecking: boolean;
    isValid: boolean;
    message: string;
  }>({
    isChecking: false,
    isValid: true,
    message: ''
  });

  const validateNumber = async (numero: string) => {
    if (!numero.trim()) {
      setValidationResult({
        isChecking: false,
        isValid: true,
        message: ''
      });
      return;
    }

    setValidationResult(prev => ({ ...prev, isChecking: true }));

    try {
      const data = await api.post('/api/presupuestos/generar-numero', { numero: numero.trim() });
      
      setValidationResult({
        isChecking: false,
        isValid: data.available,
        message: data.message
      });
    } catch (error: any) {
      setValidationResult({
        isChecking: false,
        isValid: false,
        message: 'Error al validar número'
      });
    }
  };

  return {
    validationResult,
    validateNumber
  };
}