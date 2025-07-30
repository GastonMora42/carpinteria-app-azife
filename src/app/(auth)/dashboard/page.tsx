// src/app/(auth)/dashboard/page.tsx - VERSIÓN MEJORADA CON DATOS REALES
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboard } from '@/hooks/use-dashboard';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { ESTADOS_PEDIDO, ESTADOS_PRESUPUESTO } from '@/lib/utils/validators';
import Link from 'next/link';
import { useState } from 'react';
import {
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineChevronRight,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineEye,
  HiOutlineBell,
  HiOutlineFilter
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

export default function DashboardPage() {
  const { data, loading, error, refetch } = useDashboard();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [showAlerts, setShowAlerts] = useState(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar datos</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <Button onClick={refetch} className="mt-4">
          <HiOutlineRefresh className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { 
    estadisticas, 
    transaccionesRecientes, 
    presupuestosVencenProximamente, 
    pedidosEnProceso, 
    ventasPorDia, 
    resumen 
  } = data;

  // DATOS REALES: Calcular estados de presupuestos basado en datos reales
  const presupuestosData = presupuestosVencenProximamente || [];
  const pedidosData = pedidosEnProceso || [];
  
  // Calcular distribución real de estados
  const estadosPresupuestosReales = [
    { 
      name: 'Pendientes', 
      value: estadisticas.totalPresupuestosPendientes,
      color: '#f59e0b'
    },
    { 
      name: 'Por Vencer', 
      value: presupuestosData.length,
      color: '#ef4444'
    }
  ];

  const estadosPedidosReales = [
    { 
      name: 'En Proceso', 
      value: estadisticas.totalPedidosPendientes,
      color: '#3b82f6'
    },
    { 
      name: 'Activos', 
      value: pedidosData.length,
      color: '#10b981'
    }
  ];

  // DATOS REALES: Preparar datos de ventas por día
  const ventasFormateadas = (ventasPorDia || []).map((item: any, index: number) => ({
    dia: DateUtils.formatDate(item.fecha, 'dd/MM'),
    ventas: Number(item.total) || 0,
    fecha: item.fecha
  }));

  // DATOS REALES: Calcular métricas financieras reales
  const ingresosMes = estadisticas.ventasMes || 0;
  const egresosMes = (transaccionesRecientes || [])
    .filter((t: any) => ['EGRESO', 'PAGO_PROVEEDOR', 'GASTO_GENERAL'].includes(t.tipo))
    .reduce((acc: number, t: any) => acc + Number(t.monto), 0);
  
  const flujoNeto = ingresosMes - egresosMes;
  const margenReal = ingresosMes > 0 ? ((flujoNeto / ingresosMes) * 100) : 0;

  // Calcular tendencia real (comparar con período anterior)
  const ventasUltimos7Dias = ventasFormateadas.slice(-7).reduce((acc, v) => acc + v.ventas, 0);
  const ventasPrevios7Dias = ventasFormateadas.slice(-14, -7).reduce((acc, v) => acc + v.ventas, 0);
  const tendencia = ventasPrevios7Dias > 0 ? ((ventasUltimos7Dias - ventasPrevios7Dias) / ventasPrevios7Dias) * 100 : 0;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header Mejorado */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
            <p className="text-gray-600 mt-1">
              Resumen de actividad - {DateUtils.formatDate(new Date(), 'EEEE, dd MMMM yyyy')}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {(['7d', '30d', '90d'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {period === '7d' ? '7 días' : period === '30d' ? '30 días' : '90 días'}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={refetch}>
              <HiOutlineRefresh className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button>
              <HiOutlineChartBar className="h-4 w-4 mr-2" />
              Reportes
            </Button>
          </div>
        </div>
      </div>

      {/* Alertas Inteligentes */}
      {showAlerts && (resumen.alertas.presupuestosVencen > 0 || resumen.alertas.pedidosAtrasados > 0) && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <HiOutlineBell className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Atención Requerida</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="space-y-1">
                  {resumen.alertas.presupuestosVencen > 0 && (
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      {resumen.alertas.presupuestosVencen} presupuesto(s) vencen pronto
                    </li>
                  )}
                  {resumen.alertas.pedidosAtrasados > 0 && (
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      {resumen.alertas.pedidosAtrasados} pedido(s) con retraso en entrega
                    </li>
                  )}
                </ul>
              </div>
            </div>
            <button 
              onClick={() => setShowAlerts(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* KPIs Principales Mejorados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalClientes}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <HiOutlineTrendingUp className="h-3 w-3 mr-1" />
                  Base sólida
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <HiOutlineUsers className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Presupuestos Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalPresupuestosPendientes}</p>
                <p className="text-xs text-yellow-600 flex items-center mt-1">
                  <HiOutlineExclamationCircle className="h-3 w-3 mr-1" />
                  Requieren seguimiento
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <HiOutlineDocumentText className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-indigo-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pedidos en Proceso</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalPedidosPendientes}</p>
                <p className="text-xs text-indigo-600 flex items-center mt-1">
                  <HiOutlineClipboardCheck className="h-3 w-3 mr-1" />
                  En producción
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <HiOutlineClipboardCheck className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas del Mes</p>
                <p className="text-2xl font-bold text-gray-900">{CurrencyUtils.formatAmount(ingresosMes)}</p>
                <p className={`text-xs flex items-center mt-1 ${tendencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tendencia >= 0 ? <HiOutlineTrendingUp className="h-3 w-3 mr-1" /> : <HiOutlineTrendingDown className="h-3 w-3 mr-1" />}
                  {tendencia >= 0 ? '+' : ''}{tendencia.toFixed(1)}% vs anterior
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <HiOutlineCash className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Financieras Reales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <HiOutlineExclamationCircle className="h-5 w-5 mr-2 text-red-600" />
              Por Cobrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {CurrencyUtils.formatAmount(estadisticas.saldosPorCobrar)}
            </div>
            <p className="text-sm text-red-700 mb-4">Saldos pendientes de cobro</p>
            <Link href="/finanzas/saldos">
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                Ver Detalle
                <HiOutlineChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <HiOutlineCash className="h-5 w-5 mr-2 text-blue-600" />
              Flujo del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ingresos:</span>
                <span className="text-sm font-medium text-green-600">
                  {CurrencyUtils.formatAmount(ingresosMes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Egresos:</span>
                <span className="text-sm font-medium text-red-600">
                  {CurrencyUtils.formatAmount(egresosMes)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-sm font-medium">Flujo Neto:</span>
                <span className={`text-sm font-bold ${flujoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {CurrencyUtils.formatAmount(flujoNeto)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <HiOutlineChartBar className="h-5 w-5 mr-2 text-purple-600" />
              Rendimiento Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Margen del Mes</span>
                <div className="flex items-center">
                  {margenReal >= 0 ? 
                    <HiOutlineTrendingUp className="h-4 w-4 text-green-500 mr-1" /> :
                    <HiOutlineTrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  }
                  <span className={`text-sm font-medium ${margenReal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {margenReal.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Transacciones</span>
                <span className="text-sm font-medium">{transaccionesRecientes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Promedio/Día</span>
                <span className="text-sm font-medium">
                  {ventasFormateadas.length > 0 ? 
                    CurrencyUtils.formatAmount(ventasUltimos7Dias / 7) : 
                    CurrencyUtils.formatAmount(0)
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Mejorados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por día con área */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Evolución de Ventas
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <HiOutlineCalendar className="h-4 w-4" />
                <span>Últimos {ventasFormateadas.length} días</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ventasFormateadas}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="dia" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => CurrencyUtils.formatAmount(value).replace(/\$\s?/, '$')}
                  />
                  <Tooltip 
                    formatter={(value) => [CurrencyUtils.formatAmount(Number(value)), 'Ventas']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="ventas" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorVentas)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {ventasFormateadas.length === 0 && (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <div className="text-center">
                  <HiOutlineChartBar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay datos de ventas disponibles</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estados de presupuestos reales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Estado de Presupuestos
              <Link href="/presupuestos">
                <Button variant="ghost" size="sm">
                  Ver todos
                  <HiOutlineChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {estadosPresupuestosReales.some(e => e.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={estadosPresupuestosReales}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => value > 0 ? `${name}: ${value}` : ''}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {estadosPresupuestosReales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Cantidad']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80 text-gray-500">
                  <div className="text-center">
                    <HiOutlineDocumentText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay presupuestos pendientes</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listas Mejoradas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Presupuestos que vencen pronto */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <HiOutlineExclamationCircle className="h-5 w-5 mr-2 text-yellow-500" />
              Presupuestos por Vencer
            </CardTitle>
            <Link href="/presupuestos?estado=PENDIENTE">
              <Button variant="ghost" size="sm">
                Ver todos ({presupuestosData.length})
                <HiOutlineChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {presupuestosData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <HiOutlineDocumentText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay presupuestos próximos a vencer</p>
              </div>
            ) : (
              <div className="space-y-3">
                {presupuestosData.slice(0, 5).map((presupuesto: any) => (
                  <div key={presupuesto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {presupuesto.numero}
                      </p>
                      <p className="text-xs text-gray-500">
                        {presupuesto.cliente.nombre}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {CurrencyUtils.formatAmount(presupuesto.total)}
                      </p>
                      <p className="text-xs text-red-600">
                        Vence: {DateUtils.formatDate(presupuesto.fechaValidez, 'dd/MM')}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-2">
                      <HiOutlineEye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pedidos en proceso */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <HiOutlineClipboardCheck className="h-5 w-5 mr-2 text-blue-500" />
              Pedidos en Proceso
            </CardTitle>
            <Link href="/ventas?estado=EN_PROCESO">
              <Button variant="ghost" size="sm">
                Ver todos ({pedidosData.length})
                <HiOutlineChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pedidosData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <HiOutlineClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay pedidos en proceso</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pedidosData.slice(0, 5).map((pedido: any) => (
                  <div key={pedido.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {pedido.numero}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pedido.cliente.nombre}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        ESTADOS_PEDIDO[pedido.estado as keyof typeof ESTADOS_PEDIDO]?.color === 'blue' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {ESTADOS_PEDIDO[pedido.estado as keyof typeof ESTADOS_PEDIDO]?.label}
                      </span>
                      {pedido.fechaEntrega && (
                        <p className="text-xs text-gray-500 mt-1">
                          Entrega: {DateUtils.formatDate(pedido.fechaEntrega, 'dd/MM')}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="ml-2">
                      <HiOutlineEye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transacciones recientes mejoradas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <HiOutlineCash className="h-5 w-5 mr-2 text-green-500" />
            Actividad Financiera Reciente
          </CardTitle>
          <Link href="/finanzas/transacciones">
            <Button variant="ghost" size="sm">
              Ver todas ({transaccionesRecientes.length})
              <HiOutlineChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transaccionesRecientes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HiOutlineCash className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay transacciones recientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transaccionesRecientes.slice(0, 6).map((transaccion: any) => (
                <div key={transaccion.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo) ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaccion.concepto}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaccion.cliente?.nombre || transaccion.proveedor?.nombre || 'Sin entidad'}
                        {' • '}
                        {transaccion.medioPago?.nombre}
                        {' • '}
                        {DateUtils.formatDate(transaccion.fecha, 'dd/MM HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo) ? '+' : '-'}
                      {CurrencyUtils.formatAmount(transaccion.monto)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}