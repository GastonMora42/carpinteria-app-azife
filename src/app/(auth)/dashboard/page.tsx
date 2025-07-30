// src/app/(auth)/dashboard/page.tsx - VERSIÓN SIMPLIFICADA Y MEJORADA
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/hooks/use-dashboard';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import Link from 'next/link';
import {
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineChartBar,
  HiOutlineEye,
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineFire,
  HiOutlineCalendar
} from 'react-icons/hi';
import {
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
  BarChart,
  Bar
} from 'recharts';

export default function DashboardPage() {
  const { data, loading, error, refetch } = useDashboard();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <HiOutlineExclamationCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar el dashboard</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={refetch} className="bg-red-600 hover:bg-red-700">
              <HiOutlineRefresh className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <HiOutlineChartBar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No hay datos disponibles</h2>
            <p className="text-gray-600 mb-6">Comienza agregando clientes y presupuestos</p>
            <div className="space-x-4">
              <Link href="/clientes">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Agregar Cliente
                </Button>
              </Link>
              <Link href="/presupuestos">
                <Button variant="outline">
                  Crear Presupuesto
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { estadisticas, transaccionesRecientes, presupuestosVencenProximamente, pedidosEnProceso, ventasPorDia } = data;

  // Calcular alertas
  const alertasCount = presupuestosVencenProximamente.length + 
    pedidosEnProceso.filter(p => p.fechaEntrega && new Date(p.fechaEntrega) < new Date()).length;

  // Preparar datos para gráficos
  const ventasChartData = ventasPorDia.slice(-7).map((item: any) => ({
    fecha: DateUtils.formatDate(item.fecha, 'dd/MM'),
    ventas: Number(item.ingresos) || 0,
    gastos: Number(item.egresos) || 0
  }));

  // Estados para pie chart
  const estadosData = [
    { name: 'Presupuestos', value: estadisticas.totalPresupuestosPendientes, color: '#f59e0b' },
    { name: 'Pedidos', value: estadisticas.totalPedidosPendientes, color: '#3b82f6' },
    { name: 'Clientes', value: estadisticas.totalClientes, color: '#10b981' }
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Mejorado */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Dashboard Ejecutivo
              </h1>
              <p className="text-gray-600 mt-2 flex items-center">
                <HiOutlineCalendar className="h-4 w-4 mr-2" />
                {DateUtils.formatDate(new Date(), 'EEEE, dd MMMM yyyy')}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Period Selector */}
              <div className="flex items-center bg-white/50 rounded-lg p-1 border">
                {(['7d', '30d', '90d'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedPeriod === period
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {period === '7d' ? '7 días' : period === '30d' ? '30 días' : '90 días'}
                  </button>
                ))}
              </div>

              <Button 
                onClick={refetch} 
                variant="outline" 
                className="bg-white/50 border-white/20 hover:bg-white/70"
              >
                <HiOutlineRefresh className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Alertas */}
          {alertasCount > 0 && (
            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <HiOutlineBell className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    {alertasCount} alerta{alertasCount !== 1 ? 's' : ''} requiere{alertasCount === 1 ? '' : 'n'} atención
                  </h3>
                  <p className="text-xs text-yellow-700 mt-1">
                    {presupuestosVencenProximamente.length > 0 && `${presupuestosVencenProximamente.length} presupuesto(s) por vencer`}
                    {presupuestosVencenProximamente.length > 0 && pedidosEnProceso.length > 0 && ' • '}
                    {pedidosEnProceso.length > 0 && `${pedidosEnProceso.length} pedido(s) en proceso`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Clientes Activos"
            value={estadisticas.totalClientes}
            icon={HiOutlineUsers}
            color="from-blue-500 to-blue-600"
            link="/clientes"
          />
          <KPICard
            title="Presupuestos Pendientes"
            value={estadisticas.totalPresupuestosPendientes}
            icon={HiOutlineDocumentText}
            color="from-yellow-500 to-orange-500"
            link="/presupuestos"
          />
          <KPICard
            title="Pedidos en Proceso"
            value={estadisticas.totalPedidosPendientes}
            icon={HiOutlineClipboardCheck}
            color="from-purple-500 to-indigo-500"
            link="/ventas"
          />
          <KPICard
            title="Ventas del Mes"
            value={CurrencyUtils.formatAmount(estadisticas.ventasMes)}
            icon={HiOutlineCash}
            color="from-green-500 to-emerald-500"
            link="/finanzas"
          />
        </div>

        {/* Gráficos y Estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolución de Ventas */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-gray-900">Evolución de Ventas</span>
                <span className="text-sm text-gray-500">Últimos 7 días</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {ventasChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ventasChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="fecha" stroke="#6b7280" fontSize={12} />
                      <YAxis 
                        stroke="#6b7280" 
                        fontSize={12}
                        tickFormatter={(value) => CurrencyUtils.formatAmount(value).replace(/\$\s?/, '$')}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          CurrencyUtils.formatAmount(Number(value)), 
                          name === 'ventas' ? 'Ventas' : 'Gastos'
                        ]}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          backdropFilter: 'blur(4px)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="ventas" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="gastos" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <HiOutlineChartBar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay datos de ventas disponibles</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Distribución General */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>Distribución General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {estadosData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estadosData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {estadosData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <HiOutlineCheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay datos para mostrar</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listas de Actividad */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Presupuestos por Vencer */}
          <ActivityCard
            title="Presupuestos por Vencer"
            items={presupuestosVencenProximamente}
            emptyMessage="No hay presupuestos próximos a vencer"
            renderItem={(item: any) => (
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{item.numero}</p>
                  <p className="text-sm text-gray-600">{item.cliente.nombre}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{CurrencyUtils.formatAmount(item.total)}</p>
                  <p className="text-xs text-red-600">
                    Vence: {DateUtils.formatDate(item.fechaValidez, 'dd/MM')}
                  </p>
                </div>
              </div>
            )}
            viewAllLink="/presupuestos"
          />

          {/* Pedidos en Proceso */}
          <ActivityCard
            title="Pedidos en Proceso"
            items={pedidosEnProceso}
            emptyMessage="No hay pedidos en proceso"
            renderItem={(item: any) => (
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{item.numero}</p>
                  <p className="text-sm text-gray-600">{item.cliente.nombre}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.estado}
                  </span>
                  {item.fechaEntrega && (
                    <p className="text-xs text-gray-500 mt-1">
                      Entrega: {DateUtils.formatDate(item.fechaEntrega, 'dd/MM')}
                    </p>
                  )}
                </div>
              </div>
            )}
            viewAllLink="/ventas"
          />
        </div>

        {/* Transacciones Recientes */}
        <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <HiOutlineCash className="h-5 w-5 mr-2 text-green-500" />
                Actividad Financiera Reciente
              </span>
              <Link href="/finanzas/transacciones">
                <Button variant="ghost" size="sm">
                  Ver todas
                  <HiOutlineArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transaccionesRecientes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <HiOutlineCash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay transacciones recientes</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {transaccionesRecientes.slice(0, 5).map((transaccion: any) => (
                  <div key={transaccion.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo) ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{transaccion.concepto}</p>
                        <p className="text-xs text-gray-500">
                          {transaccion.cliente?.nombre || transaccion.proveedor?.nombre || 'Sin entidad'}
                          {' • '}
                          {DateUtils.formatDate(transaccion.fecha, 'dd/MM HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
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
    </div>
  );
}

// Componente KPI Card mejorado
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  link: string;
}

function KPICard({ title, value, icon: Icon, color, link }: KPICardProps) {
  return (
    <Link href={link}>
      <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-3xl font-bold text-gray-900">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
            </div>
            <div className={`p-4 rounded-full bg-gradient-to-r ${color} group-hover:scale-110 transition-transform`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Componente Activity Card mejorado
interface ActivityCardProps {
  title: string;
  items: any[];
  emptyMessage: string;
  renderItem: (item: any) => React.ReactNode;
  viewAllLink: string;
}

function ActivityCard({ title, items, emptyMessage, renderItem, viewAllLink }: ActivityCardProps) {
  return (
    <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Link href={viewAllLink}>
            <Button variant="ghost" size="sm">
              Ver todos ({items.length})
              <HiOutlineArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HiOutlineCheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {items.slice(0, 4).map(renderItem)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}