// src/hooks/use-dashboard.ts - VERSIÓN ACTUALIZADA CON NUEVOS DATOS
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/utils/http';

export interface DashboardData {
  // Datos básicos
  estadisticas: {
    totalClientes: number;
    totalPresupuestosPendientes: number;
    totalPedidosPendientes: number;
    ventasMes: number;
    saldosPorCobrar: number;
  };
  
  // Listas principales
  transaccionesRecientes: Array<{
    id: string;
    numero: string;
    tipo: string;
    concepto: string;
    monto: number;
    moneda: string;
    fecha: string;
    cliente?: { nombre: string };
    proveedor?: { nombre: string };
    medioPago?: { nombre: string };
  }>;
  
  presupuestosVencenProximamente: Array<{
    id: string;
    numero: string;
    total: number;
    fechaValidez: string;
    cliente: { nombre: string };
  }>;
  
  pedidosEnProceso: Array<{
    id: string;
    numero: string;
    estado: string;
    fechaEntrega?: string;
    cliente: { nombre: string };
  }>;
  
  ventasPorDia: Array<{
    fecha: string;
    ingresos: number;
    egresos: number;
    transacciones: number;
  }>;
  
  // NUEVOS DATOS ANALÍTICOS
  analisisFinanciero: {
    ventasActuales: number;
    ventasPrevias: number;
    egresosActuales: number;
    egresosPrevios: number;
    tendenciaVentas: number;
    margenReal: number;
    flujoNeto: number;
    proyeccionVentas: number;
  };
  
  estadosPresupuestos: Record<string, {
    cantidad: number;
    monto: number;
  }>;
  
  estadosPedidos: Record<string, {
    cantidad: number;
    monto: number;
  }>;
  
  productividad: {
    transaccionesCount: number;
    clientesNuevos: number;
    presupuestosGenerados: number;
    promedioTransaccionesPorDia: number;
  };
  
  mediosPagoPreferidos: Array<{
    nombre: string;
    cantidad: number;
    monto: number;
  }>;
  
  clientesMasActivos: Array<{
    cliente: string;
    codigo: string;
    transacciones: number;
    monto: number;
  }>;
  
  resumen: {
    alertas: {
      presupuestosVencen: number;
      pedidosAtrasados: number;
      clientesSinActividad: number;
      stockCritico: number;
    };
    metricas: {
      ticketPromedio: number;
      clientesActivos: number;
      eficienciaCobranza: number;
    };
  };
}

export interface DashboardFilters {
  periodo?: '7d' | '30d' | '90d';
  incluirInactivos?: boolean;
  soloAlertas?: boolean;
}

export function useDashboard(filters: DashboardFilters = {}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Fetching comprehensive dashboard data with filters:', filters);

      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filters.periodo) params.append('periodo', filters.periodo);
      if (filters.incluirInactivos) params.append('incluirInactivos', 'true');
      if (filters.soloAlertas) params.append('soloAlertas', 'true');

      const dashboardData = await api.get(`/api/dashboard?${params}`);
      
      console.log('✅ Dashboard data fetched successfully');
      console.log('📈 Financial analysis:', dashboardData.analisisFinanciero);
      console.log('🎯 Productivity metrics:', dashboardData.productividad);
      console.log('🚨 Alert summary:', dashboardData.resumen.alertas);
      
      setData(dashboardData);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('❌ Error fetching dashboard data:', err);
      setError(err.message || 'Error al cargar datos del dashboard');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login?from=/dashboard';
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...');
      fetchDashboardData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  useEffect(() => {
    console.log('🔄 useDashboard effect triggered with filters:', filters);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Funciones de análisis derivadas
  const getTopAlerts = useCallback(() => {
    if (!data) return [];
    
    const alerts = [];
    const { alertas } = data.resumen;
    
    if (alertas.presupuestosVencen > 0) {
      alerts.push({
        type: 'warning',
        title: 'Presupuestos por vencer',
        message: `${alertas.presupuestosVencen} presupuesto(s) vencen pronto`,
        count: alertas.presupuestosVencen,
        action: '/presupuestos?estado=PENDIENTE'
      });
    }
    
    if (alertas.pedidosAtrasados > 0) {
      alerts.push({
        type: 'error',
        title: 'Pedidos atrasados',
        message: `${alertas.pedidosAtrasados} pedido(s) con retraso`,
        count: alertas.pedidosAtrasados,
        action: '/ventas?estado=EN_PROCESO'
      });
    }
    
    if (alertas.clientesSinActividad > 0) {
      alerts.push({
        type: 'info',
        title: 'Clientes inactivos',
        message: `${alertas.clientesSinActividad} cliente(s) sin actividad en 60 días`,
        count: alertas.clientesSinActividad,
        action: '/clientes'
      });
    }
    
    if (alertas.stockCritico > 0) {
      alerts.push({
        type: 'warning',
        title: 'Stock crítico',
        message: `${alertas.stockCritico} material(es) con stock bajo`,
        count: alertas.stockCritico,
        action: '/inventario'
      });
    }
    
    return alerts.sort((a, b) => b.count - a.count);
  }, [data]);

  const getFinancialSummary = useCallback(() => {
    if (!data) return null;
    
    const { analisisFinanciero } = data;
    
    return {
      ventasActuales: analisisFinanciero.ventasActuales,
      tendencia: {
        valor: analisisFinanciero.tendenciaVentas,
        esPositiva: analisisFinanciero.tendenciaVentas >= 0,
        texto: analisisFinanciero.tendenciaVentas >= 0 ? 
          `+${analisisFinanciero.tendenciaVentas.toFixed(1)}%` : 
          `${analisisFinanciero.tendenciaVentas.toFixed(1)}%`
      },
      margen: {
        valor: analisisFinanciero.margenReal,
        esSaludable: analisisFinanciero.margenReal >= 20,
        categoria: analisisFinanciero.margenReal >= 30 ? 'excelente' : 
                  analisisFinanciero.margenReal >= 20 ? 'bueno' : 
                  analisisFinanciero.margenReal >= 10 ? 'regular' : 'bajo'
      },
      proyeccion: analisisFinanciero.proyeccionVentas,
      flujoNeto: analisisFinanciero.flujoNeto,
      eficienciaCobranza: data.resumen.metricas.eficienciaCobranza
    };
  }, [data]);

  const getProductivityInsights = useCallback(() => {
    if (!data) return null;
    
    const { productividad } = data;
    
    return {
      transaccionesDiarias: productividad.promedioTransaccionesPorDia,
      clientesNuevos: productividad.clientesNuevos,
      presupuestosGenerados: productividad.presupuestosGenerados,
      ticketPromedio: data.resumen.metricas.ticketPromedio,
      puntuacion: Math.min(100, Math.round(
        (productividad.promedioTransaccionesPorDia * 10) +
        (productividad.clientesNuevos * 5) +
        (productividad.presupuestosGenerados * 3)
      ))
    };
  }, [data]);

  const getTrendingData = useCallback(() => {
    if (!data) return { clientes: [], mediosPago: [] };
    
    return {
      clientes: data.clientesMasActivos.slice(0, 5),
      mediosPago: data.mediosPagoPreferidos.slice(0, 3)
    };
  }, [data]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refetch: fetchDashboardData,
    
    // Funciones de análisis
    getTopAlerts,
    getFinancialSummary,
    getProductivityInsights,
    getTrendingData,
    
    // Estados derivados
    hasAlerts: data ? Object.values(data.resumen.alertas).some(count => count > 0) : false,
    totalAlerts: data ? Object.values(data.resumen.alertas).reduce((acc, count) => acc + count, 0) : 0,
    isHealthy: data ? (
      data.analisisFinanciero.flujoNeto > 0 && 
      data.analisisFinanciero.margenReal > 15 &&
      data.resumen.metricas.eficienciaCobranza > 80
    ) : false
  };
}

// Hook especializado para métricas financieras
export function useFinancialMetrics() {
  const { data, loading, error } = useDashboard();
  
  const metrics = data ? {
    ingresosTotales: data.analisisFinanciero.ventasActuales,
    egresosTotales: data.analisisFinanciero.egresosActuales,
    flujoNeto: data.analisisFinanciero.flujoNeto,
    margen: data.analisisFinanciero.margenReal,
    tendencia: data.analisisFinanciero.tendenciaVentas,
    proyeccion: data.analisisFinanciero.proyeccionVentas,
    saldosPorCobrar: data.estadisticas.saldosPorCobrar,
    eficienciaCobranza: data.resumen.metricas.eficienciaCobranza
  } : null;
  
  return { metrics, loading, error };
}

// Hook para alertas del dashboard
export function useDashboardAlerts() {
  const { data, loading, getTopAlerts } = useDashboard();
  
  const alerts = getTopAlerts();
  const criticalCount = alerts.filter(a => a.type === 'error').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;
  
  return {
    alerts,
    criticalCount,
    warningCount,
    totalCount: alerts.length,
    hasCritical: criticalCount > 0,
    hasWarnings: warningCount > 0,
    loading
  };
}

// Hook para datos de performance
export function usePerformanceData() {
  const { data, loading } = useDashboard();
  
  const performance = data ? {
    ventasDiarias: data.ventasPorDia.map(dia => ({
      fecha: dia.fecha,
      ventas: dia.ingresos,
      gastos: dia.egresos,
      neto: dia.ingresos - dia.egresos,
      transacciones: dia.transacciones
    })),
    
    distribucionPresupuestos: Object.entries(data.estadosPresupuestos).map(([estado, info]) => ({
      estado,
      cantidad: info.cantidad,
      monto: info.monto,
      porcentaje: data.estadisticas.totalPresupuestosPendientes > 0 ? 
        (info.cantidad / data.estadisticas.totalPresupuestosPendientes) * 100 : 0
    })),
    
    distribucionPedidos: Object.entries(data.estadosPedidos).map(([estado, info]) => ({
      estado,
      cantidad: info.cantidad,
      monto: info.monto,
      porcentaje: data.estadisticas.totalPedidosPendientes > 0 ? 
        (info.cantidad / data.estadisticas.totalPedidosPendientes) * 100 : 0
    }))
  } : null;
  
  return { performance, loading };
}