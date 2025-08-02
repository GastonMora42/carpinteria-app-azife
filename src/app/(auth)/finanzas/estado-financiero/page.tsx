// src/app/(auth)/finanzas/estado-financiero/page.tsx - NUEVO DASHBOARD
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { api } from '@/lib/utils/http';
import {
  HiOutlineCash,
  HiOutlineBan,
  HiOutlineReceiptTax,
  HiOutlineCreditCard,
  HiOutlineChartPie,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineFilter
} from 'react-icons/hi';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface EstadoFinancieroPorMedio {
  medioPago: string;
  ingresos: {
    monto: number;
    cantidad: number;
    ultimaTransaccion?: string;
  };
  egresos: {
    monto: number;
    cantidad: number;
    ultimaTransaccion?: string;
  };
  saldo: number;
  porcentajeParticipacion: number;
}

interface MovimientosRecientes {
  id: string;
  tipo: 'INGRESO' | 'EGRESO';
  fecha: string;
  concepto: string;
  monto: number;
  moneda: string;
  medioPago: string;
  cliente?: string;
  proveedor?: string;
}

export default function EstadoFinancieroPage() {
  const [estadoPorMedio, setEstadoPorMedio] = useState<EstadoFinancieroPorMedio[]>([]);
  const [movimientosRecientes, setMovimientosRecientes] = useState<MovimientosRecientes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [medioFiltro, setMedioFiltro] = useState('');

  // Resumen general
  const [resumenGeneral, setResumenGeneral] = useState({
    totalIngresos: 0,
    totalEgresos: 0,
    flujoNeto: 0,
    efectivoDisponible: 0,
    bancosDisponible: 0,
    chequesCartera: 0,
    chequesPendientes: 0
  });

  const fetchEstadoFinanciero = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('💰 Fetching estado financiero por medio de pago...');

      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (fechaDesde) params.append('fechaDesde', fechaDesde);
      if (fechaHasta) params.append('fechaHasta', fechaHasta);
      if (medioFiltro) params.append('medioPago', medioFiltro);

      // Obtener datos en paralelo
      const [transaccionesResponse, chequesResponse, gastosResponse] = await Promise.all([
        api.get(`/api/transacciones?limit=1000&${params}`),
        api.get(`/api/cheques?${params}`),
        api.get(`/api/gastos-generales?${params}`)
      ]);

      // Procesar transacciones por medio de pago
      const transacciones = transaccionesResponse.data || [];
      const cheques = chequesResponse.data || [];
      const gastos = gastosResponse.data || [];

      // Calcular estado por medio de pago
      const estadoPorMedioMap = new Map<string, EstadoFinancieroPorMedio>();

      // Procesar transacciones
      transacciones.forEach((transaccion: any) => {
        const medio = transaccion.medioPago?.nombre || 'Sin especificar';
        const esIngreso = ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo);
        const monto = Number(transaccion.monto);

        if (!estadoPorMedioMap.has(medio)) {
          estadoPorMedioMap.set(medio, {
            medioPago: medio,
            ingresos: { monto: 0, cantidad: 0 },
            egresos: { monto: 0, cantidad: 0 },
            saldo: 0,
            porcentajeParticipacion: 0
          });
        }

        const estado = estadoPorMedioMap.get(medio)!;
        if (esIngreso) {
          estado.ingresos.monto += monto;
          estado.ingresos.cantidad += 1;
          estado.ingresos.ultimaTransaccion = transaccion.fecha;
        } else {
          estado.egresos.monto += monto;
          estado.egresos.cantidad += 1;
          estado.egresos.ultimaTransaccion = transaccion.fecha;
        }
      });

      // Calcular saldos y porcentajes
      const totalVolumen = Array.from(estadoPorMedioMap.values())
        .reduce((acc, estado) => acc + estado.ingresos.monto + estado.egresos.monto, 0);

      const estadoFinal = Array.from(estadoPorMedioMap.values()).map(estado => ({
        ...estado,
        saldo: estado.ingresos.monto - estado.egresos.monto,
        porcentajeParticipacion: totalVolumen > 0 
          ? ((estado.ingresos.monto + estado.egresos.monto) / totalVolumen) * 100 
          : 0
      }));

      // Calcular resumen general
      const totalIngresos = estadoFinal.reduce((acc, estado) => acc + estado.ingresos.monto, 0);
      const totalEgresos = estadoFinal.reduce((acc, estado) => acc + estado.egresos.monto, 0);

      // Calcular disponible por tipo de medio
      const efectivoDisponible = estadoFinal
        .filter(estado => estado.medioPago === 'Efectivo')
        .reduce((acc, estado) => acc + estado.saldo, 0);

      const bancosDisponible = estadoFinal
        .filter(estado => ['Transferencia Bancaria', 'Tarjeta de Débito', 'Tarjeta de Crédito'].includes(estado.medioPago))
        .reduce((acc, estado) => acc + estado.saldo, 0);

      const chequesCartera = cheques
        .filter((cheque: any) => cheque.estado === 'CARTERA')
        .reduce((acc: number, cheque: any) => acc + Number(cheque.monto), 0);

      const chequesPendientes = cheques
        .filter((cheque: any) => ['DEPOSITADO', 'ENDOSADO'].includes(cheque.estado))
        .reduce((acc: number, cheque: any) => acc + Number(cheque.monto), 0);

      setEstadoPorMedio(estadoFinal.sort((a, b) => b.saldo - a.saldo));
      setResumenGeneral({
        totalIngresos,
        totalEgresos,
        flujoNeto: totalIngresos - totalEgresos,
        efectivoDisponible,
        bancosDisponible,
        chequesCartera,
        chequesPendientes
      });

      // Obtener movimientos recientes
      const movimientosRecientesData = transacciones
        .slice(0, 10)
        .map((t: any) => ({
          id: t.id,
          tipo: ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(t.tipo) ? 'INGRESO' : 'EGRESO',
          fecha: t.fecha,
          concepto: t.concepto,
          monto: Number(t.monto),
          moneda: t.moneda,
          medioPago: t.medioPago?.nombre || 'Sin especificar',
          cliente: t.cliente?.nombre,
          proveedor: t.proveedor?.nombre
        }));

      setMovimientosRecientes(movimientosRecientesData);

      console.log('✅ Estado financiero loaded successfully');

    } catch (err: any) {
      console.error('❌ Error fetching estado financiero:', err);
      setError(err.message || 'Error al cargar estado financiero');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstadoFinanciero();
  }, [fechaDesde, fechaHasta, medioFiltro]);

  // Datos para gráficos
  const datosPieChart = estadoPorMedio.map((estado, index) => ({
    name: estado.medioPago,
    value: Math.abs(estado.saldo),
    color: `hsl(${(index * 50) % 360}, 70%, 50%)`
  }));

  const datosBarChart = estadoPorMedio.map(estado => ({
    medio: estado.medioPago.length > 15 ? estado.medioPago.substring(0, 12) + '...' : estado.medioPago,
    ingresos: estado.ingresos.monto,
    egresos: estado.egresos.monto,
    saldo: estado.saldo
  }));

  const mediosDisponibles = [...new Set(estadoPorMedio.map(e => e.medioPago))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando estado financiero...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estado Financiero</h1>
          <p className="text-gray-600">Control detallado por medio de pago</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={fetchEstadoFinanciero}>
            <HiOutlineRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCash className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Efectivo Disponible</p>
                <p className="text-lg font-bold text-green-600">
                  {CurrencyUtils.formatAmount(resumenGeneral.efectivoDisponible)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineBan className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En Bancos</p>
                <p className="text-lg font-bold text-blue-600">
                  {CurrencyUtils.formatAmount(resumenGeneral.bancosDisponible)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineReceiptTax className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cheques en Cartera</p>
                <p className="text-lg font-bold text-purple-600">
                  {CurrencyUtils.formatAmount(resumenGeneral.chequesCartera)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineTrendingUp className={`h-8 w-8 ${resumenGeneral.flujoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Flujo Neto</p>
                <p className={`text-lg font-bold ${resumenGeneral.flujoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {CurrencyUtils.formatAmount(resumenGeneral.flujoNeto)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <HiOutlineFilter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Fecha Desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />

            <Input
              label="Fecha Hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />

            <Select
              label="Medio de Pago"
              value={medioFiltro}
              onChange={(e) => setMedioFiltro(e.target.value)}
            >
              <option value="">Todos los medios</option>
              {mediosDisponibles.map(medio => (
                <option key={medio} value={medio}>{medio}</option>
              ))}
            </Select>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFechaDesde('');
                  setFechaHasta('');
                  setMedioFiltro('');
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por medio de pago */}
        <Card>
          <CardHeader>
            <CardTitle>Saldos por Medio de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosPieChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${CurrencyUtils.formatAmount(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {datosPieChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => CurrencyUtils.formatAmount(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Comparativo ingresos vs egresos */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs Egresos por Medio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosBarChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="medio" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => CurrencyUtils.formatAmount(Number(value))}
                  />
                  <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
                  <Bar dataKey="egresos" fill="#ef4444" name="Egresos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla detallada por medio de pago */}
      <Card>
        <CardHeader>
          <CardTitle>Estado Detallado por Medio de Pago</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {estadoPorMedio.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron movimientos en el período seleccionado
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Medio de Pago</TableHeaderCell>
                  <TableHeaderCell>Ingresos</TableHeaderCell>
                  <TableHeaderCell>Egresos</TableHeaderCell>
                  <TableHeaderCell>Saldo</TableHeaderCell>
                  <TableHeaderCell>Transacciones</TableHeaderCell>
                  <TableHeaderCell>Participación</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estadoPorMedio.map((estado) => (
                  <TableRow key={estado.medioPago}>
                    <TableCell>
                      <div className="flex items-center">
                        <HiOutlineCreditCard className="h-5 w-5 mr-3 text-gray-400" />
                        <span className="font-medium text-gray-900">{estado.medioPago}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-green-600">
                          +{CurrencyUtils.formatAmount(estado.ingresos.monto)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {estado.ingresos.cantidad} transacciones
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-red-600">
                          -{CurrencyUtils.formatAmount(estado.egresos.monto)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {estado.egresos.cantidad} transacciones
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold text-lg ${
                        estado.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {estado.saldo >= 0 ? '+' : ''}{CurrencyUtils.formatAmount(estado.saldo)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {estado.ingresos.cantidad + estado.egresos.cantidad} total
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium text-gray-900">
                          {estado.porcentajeParticipacion.toFixed(1)}%
                        </span>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, estado.porcentajeParticipacion)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Movimientos recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Recientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {movimientosRecientes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No hay movimientos recientes</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                  <TableHeaderCell>Concepto</TableHeaderCell>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Medio de Pago</TableHeaderCell>
                  <TableHeaderCell>Monto</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientosRecientes.map((movimiento) => (
                  <TableRow key={movimiento.id}>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {DateUtils.formatDate(movimiento.fecha)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium text-gray-900">{movimiento.concepto}</span>
                        {(movimiento.cliente || movimiento.proveedor) && (
                          <div className="text-xs text-gray-500">
                            {movimiento.cliente || movimiento.proveedor}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        movimiento.tipo === 'INGRESO' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {movimiento.tipo === 'INGRESO' ? (
                          <HiOutlineTrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <HiOutlineTrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {movimiento.tipo}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">{movimiento.medioPago}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        movimiento.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movimiento.tipo === 'INGRESO' ? '+' : '-'}
                        {CurrencyUtils.formatAmount(movimiento.monto, movimiento.moneda as any)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}