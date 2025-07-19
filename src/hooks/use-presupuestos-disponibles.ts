// src/hooks/use-presupuestos-disponibles.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/utils/http';
import { convertDecimalFields, PresupuestoWithNumbers } from '@/lib/types/prisma-overrides';

interface PresupuestoDisponible extends PresupuestoWithNumbers {
  diasVencimiento: number;
  puedeConvertir: boolean;
  motivoNoConversion?: string;
}

export function usePresupuestosDisponibles() {
  const [presupuestos, setPresupuestos] = useState<PresupuestoDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPresupuestosDisponibles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Fetching presupuestos disponibles para venta...');
      
      // Obtener presupuestos que pueden convertirse a venta
      const data = await api.get('/api/presupuestos?estado=APROBADO&disponibleParaVenta=true');
      
      console.log('✅ Presupuestos disponibles fetched:', data.data?.length || 0);
      
      // Convertir y enriquecer datos
      const presupuestosEnriquecidos = (data.data || []).map((presupuesto: any) => {
        const converted = convertDecimalFields(presupuesto, ['subtotal', 'descuento', 'impuestos', 'total']);
        
        // Calcular días hasta vencimiento
        const fechaVencimiento = new Date(presupuesto.fechaValidez);
        const hoy = new Date();
        const diasVencimiento = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determinar si puede convertirse
        const puedeConvertir = !presupuesto.pedido && diasVencimiento > 0;
        let motivoNoConversion = '';
        
        if (presupuesto.pedido) {
          motivoNoConversion = 'Ya fue convertido a venta';
        } else if (diasVencimiento <= 0) {
          motivoNoConversion = 'Presupuesto vencido';
        }
        
        return {
          ...converted,
          diasVencimiento,
          puedeConvertir,
          motivoNoConversion
        };
      });
      
      setPresupuestos(presupuestosEnriquecidos);
    } catch (err: any) {
      console.error('❌ Error fetching presupuestos disponibles:', err);
      setError(err.message || 'Error al cargar presupuestos disponibles');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const getPresupuestoById = (id: string): PresupuestoDisponible | null => {
    return presupuestos.find(p => p.id === id) || null;
  };

  const marcarComoConvertido = (presupuestoId: string) => {
    setPresupuestos(prev => prev.map(p => 
      p.id === presupuestoId 
        ? { ...p, puedeConvertir: false, motivoNoConversion: 'Ya fue convertido a venta' }
        : p
    ));
  };

  useEffect(() => {
    fetchPresupuestosDisponibles();
  }, []);

  return {
    presupuestos: presupuestos.filter(p => p.puedeConvertir), // Solo disponibles
    presupuestosCompletos: presupuestos, // Todos (incluye no disponibles)
    loading,
    error,
    refetch: fetchPresupuestosDisponibles,
    getPresupuestoById,
    marcarComoConvertido
  };
}