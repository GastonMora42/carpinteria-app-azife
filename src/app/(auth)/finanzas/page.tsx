// src/app/(auth)/finanzas/page.tsx - VERSIÓN MEJORADA CON DATOS REALES
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTransacciones } from '@/hooks/use-transacciones';
import { useDashboard } from '@/hooks/use-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Currency, CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { TransaccionFormData, transaccionSchema } from '@/lib/validations/transaccion';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineCash,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineExclamationCircle,
  HiOutlineCalendar,
  HiOutlineDocumentReport,
  HiOutlineDownload,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineChartBar,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineCreditCard,
  HiOutlineBan
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
  Area,
  ComposedChart
} from 'recharts';

interface TransaccionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransaccionFormData) => Promise<void>;
}

function TransaccionForm({ isOpen, onClose, onSubmit }: TransaccionFormProps) {
  const [formData, setFormData] = useState<TransaccionFormData>({
    tipo: 'INGRESO',
    concepto: '',
    descripcion: '',
    monto: 0,
    moneda: 'PESOS',
    fecha: new Date(),
    numeroComprobante: '',
    tipoComprobante: '',
    medioPagoId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock medios de pago mejorado
  const mediosPago = [
    { id: '1', nombre: 'Efectivo', icon: HiOutlineBan },
    { id: '2', nombre: 'Transferencia Bancaria', icon: HiOutlineCreditCard },
    { id: '3', nombre: 'Cheque', icon: HiOutlineDocumentReport },
    { id: '4', nombre: 'Tarjeta de Débito', icon: HiOutlineCreditCard },
    { id: '5', nombre: 'Tarjeta de Crédito', icon: HiOutlineCreditCard }
  ];

  const tiposTransaccion = [
    { value: 'INGRESO', label: 'Ingreso General', color: 'text-green-600', icon: HiOutlineArrowUp },
    { value: 'EGRESO', label: 'Egreso General', color: 'text-red-600', icon: HiOutlineArrowDown },
    { value: 'ANTICIPO', label: 'Anticipo de Cliente', color: 'text-blue-600', icon: HiOutlineArrowUp },
    { value: 'PAGO_OBRA', label: 'Pago de Obra', color: 'text-green-600', icon: HiOutlineArrowUp },
    { value: 'PAGO_PROVEEDOR', label: 'Pago a Proveedor', color: 'text-red-600', icon: HiOutlineArrowDown },
    { value: 'GASTO_GENERAL', label: 'Gasto General', color: 'text-red-600', icon: HiOutlineArrowDown },
    { value: 'TRANSFERENCIA', label: 'Transferencia', color: 'text-blue-600', icon: HiOutlineCash },
    { value: 'AJUSTE', label: 'Ajuste Contable', color: 'text-yellow-600', icon: HiOutlineCash }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = transaccionSchema.parse(formData);
      await onSubmit(validatedData);
      onClose();
      setFormData({
        tipo: 'INGRESO',
        concepto: '',
        descripcion: '',
        monto: 0,
        moneda: 'PESOS',
        fecha: new Date(),
        numeroComprobante: '',
        tipoComprobante: '',
        medioPagoId: ''
      });
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path?.[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error.message || 'Error al guardar transacción' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof TransaccionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedTipo = tiposTransaccion.find(t => t.value === formData.tipo);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Transacción"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <HiOutlineExclamationCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{errors.general}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Select
              label="Tipo de Transacción *"
              value={formData.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              error={errors.tipo}
            >
              {tiposTransaccion.map(tipo => {
                const IconComponent = tipo.icon;
                return (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                );
              })}
            </Select>

            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  label="Monto *"
                  type="number"
                  value={formData.monto}
                  onChange={(e) => handleChange('monto', Number(e.target.value))}
                  error={errors.monto}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="w-32">
                <Select
                  label="Moneda"
                  value={formData.moneda}
                  onChange={(e) => handleChange('moneda', e.target.value)}
                >
                  <option value="PESOS">ARS $</option>
                  <option value="DOLARES">USD $</option>
                </Select>
              </div>
            </div>

            <Input
              label="Concepto *"
              value={formData.concepto}
              onChange={(e) => handleChange('concepto', e.target.value)}
              error={errors.concepto}
              placeholder="Describe el motivo de la transacción"
            />

            <Input
              label="Fecha *"
              type="date"
              value={formData.fecha instanceof Date ? formData.fecha.toISOString().split('T')[0] : formData.fecha}
              onChange={(e) => handleChange('fecha', new Date(e.target.value))}
              error={errors.fecha}
            />
          </div>

          <div className="space-y-4">
            <Select
              label="Medio de Pago *"
              value={formData.medioPagoId}
              onChange={(e) => handleChange('medioPagoId', e.target.value)}
              error={errors.medioPagoId}
            >
              <option value="">Seleccionar medio</option>
              {mediosPago.map(medio => (
                <option key={medio.id} value={medio.id}>{medio.nombre}</option>
              ))}
            </Select>

            <div className="flex space-x-4">
              <Input
                label="N° Comprobante"
                value={formData.numeroComprobante}
                onChange={(e) => handleChange('numeroComprobante', e.target.value)}
                placeholder="Número de factura/recibo"
              />
              <Input
                label="Tipo"
                value={formData.tipoComprobante}
                onChange={(e) => handleChange('tipoComprobante', e.target.value)}
                placeholder="Factura A, Recibo..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción Adicional
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Información adicional..."
              />
              {errors.descripcion && (
                <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
              )}
            </div>
          </div>
        </div>

        {/* Vista previa del tipo seleccionado */}
        {selectedTipo && (
          <div className={`p-4 rounded-lg border-2 border-dashed ${
            selectedTipo.value.includes('INGRESO') || selectedTipo.value.includes('PAGO_OBRA') || selectedTipo.value.includes('ANTICIPO')
              ? 'border-green-300 bg-green-50' 
              : 'border-red-300 bg-red-50'
          }`}>
            <div className="flex items-center">
              <selectedTipo.icon className={`h-5 w-5 mr-2 ${selectedTipo.color}`} />
              <span className={`font-medium ${selectedTipo.color}`}>
                {selectedTipo.label}
              </span>
              {formData.monto > 0 && (
                <span className={`ml-2 font-bold ${selectedTipo.color}`}>
                  {selectedTipo.value.includes('INGRESO') || selectedTipo.value.includes('PAGO_OBRA') || selectedTipo.value.includes('ANTICIPO') ? '+' : '-'}
                  {CurrencyUtils.formatAmount(formData.monto, formData.moneda as Currency)}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Registrar Transacción
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function FinanzasPage() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [isTransaccionModalOpen, setIsTransaccionModalOpen] = useState(false);
  const [selectedTransaccion, setSelectedTransaccion] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<'mes' | 'trimestre' | 'año'>('mes');

  const { data: dashboardData } = useDashboard();
  const { transacciones, loading, error, createTransaccion, refetch } = useTransacciones({
    tipo: tipoFilter || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined
  });

  // DATOS REALES: Calcular métricas financieras reales
  const ingresos = transacciones.filter(t => ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(t.tipo));
  const egresos = transacciones.filter(t => ['EGRESO', 'PAGO_PROVEEDOR', 'GASTO_GENERAL'].includes(t.tipo));

  const totalIngresos = ingresos.reduce((acc, t) => acc + Number(t.monto), 0);
  const totalEgresos = egresos.reduce((acc, t) => acc + Number(t.monto), 0);
  const flujoNeto = totalIngresos - totalEgresos;

  // DATOS REALES: Calcular flujo mensual real basado en transacciones
  const flujoMensualReal = useMemo(() => {
    const now = new Date();
    const monthsData = [];
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const transaccionesDelMes = transacciones.filter(t => {
        const fechaTransaccion = new Date(t.fecha);
        return fechaTransaccion >= month && fechaTransaccion < nextMonth;
      });
      
      const ingresosDelMes = transaccionesDelMes
        .filter(t => ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(t.tipo))
        .reduce((acc, t) => acc + Number(t.monto), 0);
      
      const egresosDelMes = transaccionesDelMes
        .filter(t => ['EGRESO', 'PAGO_PROVEEDOR', 'GASTO_GENERAL'].includes(t.tipo))
        .reduce((acc, t) => acc + Number(t.monto), 0);
      
      monthsData.push({
        mes: DateUtils.formatDate(month, 'MMM'),
        ingresos: ingresosDelMes,
        egresos: egresosDelMes,
        flujoNeto: ingresosDelMes - egresosDelMes
      });
    }
    
    return monthsData;
  }, [transacciones]);

  // DATOS REALES: Distribución real por tipos de transacción
  const distribucionTiposReal = useMemo(() => {
    const tiposCount = transacciones.reduce((acc, t) => {
      const tipo = t.tipo;
      if (!acc[tipo]) {
        acc[tipo] = { cantidad: 0, monto: 0 };
      }
      acc[tipo].cantidad += 1;
      acc[tipo].monto += Number(t.monto);
      return acc;
    }, {} as Record<string, { cantidad: number; monto: number }>);

    return Object.entries(tiposCount).map(([tipo, data]) => ({
      name: tipo.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      value: data.monto,
      cantidad: data.cantidad,
      color: ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(tipo) ? '#10b981' : '#ef4444'
    }));
  }, [transacciones]);

  // DATOS REALES: Evolución diaria del flujo
  const evolucionDiaria = useMemo(() => {
    const dailyData: Record<string, { ingresos: number; egresos: number; fecha: Date }> = {};
    
    transacciones.forEach(t => {
      const fecha = new Date(t.fecha);
      const fechaStr = DateUtils.formatDate(fecha, 'yyyy-MM-dd');
      
      if (!dailyData[fechaStr]) {
        dailyData[fechaStr] = { ingresos: 0, egresos: 0, fecha };
      }
      
      if (['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(t.tipo)) {
        dailyData[fechaStr].ingresos += Number(t.monto);
      } else if (['EGRESO', 'PAGO_PROVEEDOR', 'GASTO_GENERAL'].includes(t.tipo)) {
        dailyData[fechaStr].egresos += Number(t.monto);
      }
    });

    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30) // Últimos 30 días
      .map(([fechaStr, data]) => ({
        fecha: DateUtils.formatDate(data.fecha, 'dd/MM'),
        ingresos: data.ingresos,
        egresos: data.egresos,
        flujoNeto: data.ingresos - data.egresos
      }));
  }, [transacciones]);

  const handleCreateTransaccion = async (data: TransaccionFormData) => {
    await createTransaccion(data);
    refetch();
  };

  const openDetailModal = (transaccion: any) => {
    setSelectedTransaccion(transaccion);
    setIsDetailModalOpen(true);
  };

  const closeModals = () => {
    setIsTransaccionModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedTransaccion(null);
  };

  const tiposTransaccion = [
    { value: '', label: 'Todos los tipos' },
    { value: 'INGRESO', label: 'Ingresos' },
    { value: 'EGRESO', label: 'Egresos' },
    { value: 'ANTICIPO', label: 'Anticipos' },
    { value: 'PAGO_OBRA', label: 'Pagos de Obra' },
    { value: 'PAGO_PROVEEDOR', label: 'Pagos a Proveedores' },
    { value: 'GASTO_GENERAL', label: 'Gastos Generales' }
  ];

  // Calcular tendencia
  const mesAnterior = flujoMensualReal[flujoMensualReal.length - 2];
  const mesActual = flujoMensualReal[flujoMensualReal.length - 1];
  const tendenciaMensual = mesAnterior && mesAnterior.ingresos > 0 ? 
    ((mesActual.ingresos - mesAnterior.ingresos) / mesAnterior.ingresos) * 100 : 0;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header Mejorado */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Centro Financiero</h1>
            <p className="text-gray-600 mt-1">
              Control de flujo de caja y análisis financiero
            </p>
          </div>
          <div className="flex space-x-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {(['mes', 'trimestre', 'año'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setCurrentPeriod(period)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    currentPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={refetch}>
              <HiOutlineRefresh className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline">
              <HiOutlineDownload className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => setIsTransaccionModalOpen(true)}>
              <HiOutlinePlus className="h-4 w-4 mr-2" />
              Nueva Transacción
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs Financieros Mejorados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Ingresos</p>
                <p className="text-2xl font-bold text-green-800">{CurrencyUtils.formatAmount(totalIngresos)}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <HiOutlineArrowUp className="h-3 w-3 mr-1" />
                  {ingresos.length} transacciones
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <HiOutlineTrendingUp className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Total Egresos</p>
                <p className="text-2xl font-bold text-red-800">{CurrencyUtils.formatAmount(totalEgresos)}</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <HiOutlineArrowDown className="h-3 w-3 mr-1" />
                  {egresos.length} transacciones
                </p>
              </div>
              <div className="p-3 bg-red-200 rounded-full">
                <HiOutlineTrendingDown className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${flujoNeto >= 0 ? 'from-blue-50 to-blue-100 border-l-blue-500' : 'from-orange-50 to-orange-100 border-l-orange-500'} border-l-4`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${flujoNeto >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Flujo Neto</p>
                <p className={`text-2xl font-bold ${flujoNeto >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                  {CurrencyUtils.formatAmount(flujoNeto)}
                </p>
                <p className={`text-xs flex items-center mt-1 ${tendenciaMensual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tendenciaMensual >= 0 ? <HiOutlineTrendingUp className="h-3 w-3 mr-1" /> : <HiOutlineTrendingDown className="h-3 w-3 mr-1" />}
                  {tendenciaMensual >= 0 ? '+' : ''}{tendenciaMensual.toFixed(1)}% vs mes anterior
                </p>
              </div>
              <div className={`p-3 rounded-full ${flujoNeto >= 0 ? 'bg-blue-200' : 'bg-orange-200'}`}>
                <HiOutlineCash className={`h-6 w-6 ${flujoNeto >= 0 ? 'text-blue-700' : 'text-orange-700'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Por Cobrar</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {CurrencyUtils.formatAmount(dashboardData?.estadisticas.saldosPorCobrar || 0)}
                </p>
                <p className="text-xs text-yellow-600 flex items-center mt-1">
                  <HiOutlineExclamationCircle className="h-3 w-3 mr-1" />
                  Pendiente de cobro
                </p>
              </div>
              <div className="p-3 bg-yellow-200 rounded-full">
                <HiOutlineExclamationCircle className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Mejorados con Datos Reales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flujo mensual real */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Evolución de Flujo de Caja
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <HiOutlineChartBar className="h-4 w-4" />
                <span>Últimos 6 meses</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={flujoMensualReal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => CurrencyUtils.formatAmount(value).replace(/\$\s?/, '$')} />
                  <Tooltip 
                    formatter={(value, name) => [
                      CurrencyUtils.formatAmount(Number(value)), 
                      name === 'ingresos' ? 'Ingresos' : name === 'egresos' ? 'Egresos' : 'Flujo Neto'
                    ]}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="ingresos" fill="#10b981" name="ingresos" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="egresos" fill="#ef4444" name="egresos" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="flujoNeto" stroke="#3b82f6" strokeWidth={3} name="flujoNeto" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribución real por tipos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Distribución por Tipo de Transacción
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <HiOutlineCash className="h-4 w-4" />
                <span>{distribucionTiposReal.length} tipos</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {distribucionTiposReal.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionTiposReal}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distribucionTiposReal.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => CurrencyUtils.formatAmount(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80 text-gray-500">
                  <div className="text-center">
                    <HiOutlineCash className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay transacciones para mostrar</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolución diaria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Evolución Diaria - Últimos 30 Días
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <HiOutlineCalendar className="h-4 w-4" />
              <span>{evolucionDiaria.length} días con actividad</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            {evolucionDiaria.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucionDiaria}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="fecha" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => CurrencyUtils.formatAmount(value).replace(/\$\s?/, '$')} />
                  <Tooltip 
                    formatter={(value, name) => [
                      CurrencyUtils.formatAmount(Number(value)), 
                      name === 'ingresos' ? 'Ingresos' : 'Egresos'
                    ]}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area type="monotone" dataKey="ingresos" stackId="1" stroke="#10b981" fill="url(#colorIngresos)" />
                  <Area type="monotone" dataKey="egresos" stackId="2" stroke="#ef4444" fill="url(#colorEgresos)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div className="text-center">
                  <HiOutlineChartBar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay datos diarios disponibles</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filtros Mejorados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HiOutlineFilter className="h-5 w-5 mr-2" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar transacciones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <Select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
            >
              {tiposTransaccion.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </Select>

            <Input
              label="Desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />

            <Input
              label="Hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />

            <div className="flex items-end space-x-2">
              <Button variant="outline" onClick={refetch} className="flex-1">
                <HiOutlineFilter className="h-4 w-4 mr-2" />
                Aplicar
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearch('');
                  setTipoFilter('');
                  setFechaDesde('');
                  setFechaHasta('');
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de transacciones mejorada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Registro de Transacciones
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{transacciones.length} transacciones</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-4 text-gray-600">Cargando transacciones...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar transacciones</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          ) : transacciones.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineCash className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay transacciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || tipoFilter ? 'No se encontraron transacciones con esos criterios' : 'Comienza registrando tu primera transacción'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Fecha</TableHeaderCell>
                    <TableHeaderCell>Concepto</TableHeaderCell>
                    <TableHeaderCell>Tipo</TableHeaderCell>
                    <TableHeaderCell>Monto</TableHeaderCell>
                    <TableHeaderCell>Medio de Pago</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell>Acciones</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacciones.map((transaccion) => (
                    <TableRow key={transaccion.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {DateUtils.formatDate(transaccion.fecha, 'dd/MM/yyyy')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {DateUtils.formatDate(transaccion.fecha, 'HH:mm')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{transaccion.concepto}</div>
                          {transaccion.descripcion && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {transaccion.descripcion}
                            </div>
                          )}
                          {transaccion.numeroComprobante && (
                            <div className="text-xs text-blue-600">
                              {transaccion.tipoComprobante} {transaccion.numeroComprobante}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo) ? 
                            <HiOutlineArrowUp className="h-3 w-3 mr-1" /> : 
                            <HiOutlineArrowDown className="h-3 w-3 mr-1" />
                          }
                          {transaccion.tipo.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold text-lg ${
                          ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo)
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo) ? '+' : '-'}
                          {CurrencyUtils.formatAmount(transaccion.monto, transaccion.moneda as Currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900 flex items-center">
                          <HiOutlineCreditCard className="h-4 w-4 mr-1 text-gray-500" />
                          {transaccion.medioPago?.nombre || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Procesada
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailModal(transaccion)}
                        >
                          <HiOutlineEye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de nueva transacción */}
      <TransaccionForm
        isOpen={isTransaccionModalOpen}
        onClose={closeModals}
        onSubmit={handleCreateTransaccion}
      />

      {/* Modal de detalle mejorado */}
      {selectedTransaccion && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeModals}
          title={`Detalle de Transacción`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(selectedTransaccion.tipo) ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{selectedTransaccion.concepto}</p>
                    <p className="text-sm text-gray-500">{selectedTransaccion.tipo.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${
                    ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(selectedTransaccion.tipo) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(selectedTransaccion.tipo) ? '+' : '-'}
                    {CurrencyUtils.formatAmount(selectedTransaccion.monto, selectedTransaccion.moneda)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {DateUtils.formatDateTime(selectedTransaccion.fecha)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medio de Pago</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <HiOutlineCreditCard className="h-4 w-4 mr-2 text-gray-500" />
                    {selectedTransaccion.medioPago?.nombre}
                  </p>
                </div>
                {selectedTransaccion.numeroComprobante && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Comprobante</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTransaccion.tipoComprobante} N° {selectedTransaccion.numeroComprobante}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Moneda</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaccion.moneda}</p>
                </div>
                {selectedTransaccion.cotizacion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cotización</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransaccion.cotizacion}</p>
                  </div>
                )}
              </div>
            </div>

            {selectedTransaccion.descripcion && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedTransaccion.descripcion}</p>
              </div>
            )}

            <div className="flex justify-end pt-6 border-t">
              <Button variant="outline" onClick={closeModals}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}