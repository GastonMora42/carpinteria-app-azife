// src/components/dashboard/DashboardWidgets.tsx - WIDGETS ESPECIALIZADOS
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import Link from 'next/link';
import {
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineExclamationCircle,
  HiOutlineCash,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineInformationCircle,
  HiOutlineFire,
  HiOutlineStar,
  HiOutlineEye,
  HiOutlineArrowRight,
  HiOutlineBell
} from 'react-icons/hi';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

// Widget de KPI mejorado
interface KPIWidgetProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
    isPositive: boolean;
  };
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo';
  subtitle?: string;
  onClick?: () => void;
}

export function KPIWidget({ title, value, change, icon: Icon, color, subtitle, onClick }: KPIWidgetProps) {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-l-blue-500', icon: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-l-green-500', icon: 'text-green-600' },
    red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-l-red-500', icon: 'text-red-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-l-yellow-500', icon: 'text-yellow-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-l-purple-500', icon: 'text-purple-600' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-l-indigo-500', icon: 'text-indigo-600' }
  };

  const classes = colorClasses[color];

  return (
    <div
      className={`hover:shadow-lg transition-all border-l-4 ${classes.border} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ outline: "none" }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {change && (
              <div className={`flex items-center mt-2 text-sm ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {change.isPositive ? (
                  <HiOutlineTrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <HiOutlineTrendingDown className="h-4 w-4 mr-1" />
                )}
                <span>{change.isPositive ? '+' : ''}{change.value.toFixed(1)}% {change.period}</span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-full ${classes.bg}`}>
            <Icon className={`h-8 w-8 ${classes.icon}`} />
          </div>
        </div>
      </CardContent>
    </div>
  );
}

// Widget de alertas inteligentes
interface AlertsWidgetProps {
  alerts: Array<{
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    count: number;
    action: string;
  }>;
  onDismiss?: () => void;
}

export function AlertsWidget({ alerts, onDismiss }: AlertsWidgetProps) {
  if (alerts.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <HiOutlineCheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-green-800">Todo en orden</h3>
              <p className="text-green-600">No hay alertas activas en este momento</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-orange-800">
            <HiOutlineBell className="h-5 w-5 mr-2" />
            Alertas Activas ({alerts.length})
          </CardTitle>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {alerts.slice(0, 4).map((alert, index) => {
            const iconMap = {
              error: HiOutlineXCircle,
              warning: HiOutlineExclamationCircle,
              info: HiOutlineInformationCircle
            };
            const colorMap = {
              error: 'text-red-600',
              warning: 'text-yellow-600',
              info: 'text-blue-600'
            };
            
            const AlertIcon = iconMap[alert.type];
            
            return (
              <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
                <AlertIcon className={`h-5 w-5 mt-0.5 ${colorMap[alert.type]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                  <p className="text-xs text-gray-600">{alert.message}</p>
                </div>
                <Link href={alert.action}>
                  <Button variant="ghost" size="sm">
                    <HiOutlineEye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            );
          })}
          {alerts.length > 4 && (
            <p className="text-xs text-center text-gray-500">
              y {alerts.length - 4} alerta(s) más...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Widget de análisis financiero
interface FinancialAnalysisWidgetProps {
  data: {
    ventasActuales: number;
    tendencia: {
      valor: number;
      esPositiva: boolean;
      texto: string;
    };
    margen: {
      valor: number;
      esSaludable: boolean;
      categoria: string;
    };
    proyeccion: number;
    flujoNeto: number;
    eficienciaCobranza: number;
  };
}

export function FinancialAnalysisWidget({ data }: FinancialAnalysisWidgetProps) {
  const margenColor = {
    excelente: 'text-green-600',
    bueno: 'text-blue-600',
    regular: 'text-yellow-600',
    bajo: 'text-red-600'
  }[data.margen.categoria];

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <HiOutlineChartBar className="h-5 w-5 mr-2" />
          Análisis Financiero
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ventas actuales con tendencia */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventas del Mes</p>
              <p className="text-2xl font-bold text-gray-900">
                {CurrencyUtils.formatAmount(data.ventasActuales)}
              </p>
            </div>
            <div className={`flex items-center text-sm font-medium ${data.tendencia.esPositiva ? 'text-green-600' : 'text-red-600'}`}>
              {data.tendencia.esPositiva ? (
                <HiOutlineTrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <HiOutlineTrendingDown className="h-4 w-4 mr-1" />
              )}
              {data.tendencia.texto} vs anterior
            </div>
          </div>
        </div>

        {/* Métricas clave */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Margen Real</p>
            <p className={`text-xl font-bold ${margenColor}`}>
              {data.margen.valor.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 capitalize">{data.margen.categoria}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Flujo Neto</p>
            <p className={`text-xl font-bold ${data.flujoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {CurrencyUtils.formatAmount(data.flujoNeto)}
            </p>
          </div>
        </div>

        {/* Proyección y eficiencia */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-600">Proyección Mensual</p>
            <p className="text-lg font-semibold text-blue-600">
              {CurrencyUtils.formatAmount(data.proyeccion)}
            </p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Eficiencia Cobranza</p>
            <p className={`text-sm font-medium ${data.eficienciaCobranza >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
              {data.eficienciaCobranza.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Widget de clientes destacados
interface TopClientsWidgetProps {
  clients: Array<{
    cliente: string;
    codigo: string;
    transacciones: number;
    monto: number;
  }>;
}

export function TopClientsWidget({ clients }: TopClientsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <HiOutlineFire className="h-5 w-5 mr-2 text-orange-500" />
            Clientes Más Activos
          </div>
          <Link href="/clientes">
            <Button variant="ghost" size="sm">
              Ver todos
              <HiOutlineArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HiOutlineUsers className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay actividad de clientes este mes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client, index) => (
              <div key={client.codigo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{client.cliente}</p>
                    <p className="text-xs text-gray-500">{client.codigo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {CurrencyUtils.formatAmount(client.monto)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {client.transacciones} transacción{client.transacciones !== 1 ? 'es' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Widget de productividad
interface ProductivityWidgetProps {
  data: {
    transaccionesDiarias: number;
    clientesNuevos: number;
    presupuestosGenerados: number;
    ticketPromedio: number;
    puntuacion: number;
  };
}

export function ProductivityWidget({ data }: ProductivityWidgetProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Regular';
    return 'Bajo';
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center text-purple-800">
            <HiOutlineStar className="h-5 w-5 mr-2" />
            Productividad
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(data.puntuacion)}`}>
            {data.puntuacion}/100
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-lg p-4">
          <p className={`text-lg font-semibold ${getScoreColor(data.puntuacion)} mb-2`}>
            Rendimiento {getScoreLabel(data.puntuacion)}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                data.puntuacion >= 80 ? 'bg-green-500' :
                data.puntuacion >= 60 ? 'bg-blue-500' :
                data.puntuacion >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, data.puntuacion)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-600">Trans./Día</p>
            <p className="text-lg font-bold text-gray-900">{data.transaccionesDiarias}</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-600">Clientes Nuevos</p>
            <p className="text-lg font-bold text-blue-600">+{data.clientesNuevos}</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-600">Presupuestos</p>
            <p className="text-lg font-bold text-green-600">{data.presupuestosGenerados}</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-600">Ticket Prom.</p>
            <p className="text-lg font-bold text-purple-600">
              {CurrencyUtils.formatAmount(data.ticketPromedio)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Widget de evolución temporal
interface TimeEvolutionWidgetProps {
  data: Array<{
    fecha: string;
    ventas: number;
    gastos: number;
    neto: number;
    transacciones: number;
  }>;
  period: string;
}

export function TimeEvolutionWidget({ data, period }: TimeEvolutionWidgetProps) {
  const chartData = data.map(item => ({
    fecha: item.fecha,
    ventas: item.ventas,
    gastos: item.gastos,
    neto: item.neto
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <HiOutlineClock className="h-5 w-5 mr-2 text-blue-500" />
            Evolución {period}
          </div>
          <div className="text-sm text-gray-500">
            {data.length} días con actividad
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => CurrencyUtils.formatAmount(value).replace(/\$\s?/, '$')}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    CurrencyUtils.formatAmount(value), 
                    name === 'ventas' ? 'Ventas' : name === 'gastos' ? 'Gastos' : 'Neto'
                  ]}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="gastos" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="neto" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <HiOutlineChartBar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay datos para el período seleccionado</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Widget de distribución (pie chart)
interface DistributionWidgetProps {
  title: string;
  data: Array<{
    estado: string;
    cantidad: number;
    monto: number;
    porcentaje: number;
  }>;
  colorMap: Record<string, string>;
}

export function DistributionWidget({ title, data, colorMap }: DistributionWidgetProps) {
  const chartData = data.filter(item => item.cantidad > 0).map(item => ({
    name: item.estado.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    value: item.cantidad,
    monto: item.monto,
    color: colorMap[item.estado] || '#6b7280'
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="flex items-center space-x-6">
            <div className="flex-1 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, 'Cantidad']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.value}</div>
                    <div className="text-xs text-gray-500">
                      {CurrencyUtils.formatAmount(item.monto)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No hay datos para mostrar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}