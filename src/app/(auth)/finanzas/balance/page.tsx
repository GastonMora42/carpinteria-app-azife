// src/app/(auth)/finanzas/balance/page.tsx - NUEVA PÁGINA DE BALANCE FINANCIERO
'use client';

import { useState } from 'react';
import { useBalanceFinanzas, useAlertasFinancieras, useMetricasRendimiento } from '@/hooks/use-balance-finanzas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import {
  HiOutlineCash,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineCreditCard,
  HiOutlineChartBar,
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineFilter,
  HiOutlineClock,
  HiOutlineClipboardList,
  HiOutlineShieldCheck,
  HiOutlineShieldExclamation,
  HiOutlineLightBulb,
  HiOutlineCalendar,
  HiOutlineEye
} from 'react-icons/hi';

export default function BalanceFinanzasPage() {
  const [filtros, setFiltros] = useState({
    fechaDesde: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Inicio del mes
    fechaHasta: new Date(), // Hoy
    incluirGastos: true,
    incluirIngresos: true,
    medioId: ''
  });

  const [showFiltros, setShowFiltros] = useState(false);

  const { 
    data, 
    loading, 
    error, 
    refetch,
    getMediosPositivos,
    getMediosNegativos,
    getSaludFinanciera,
    getFlujoCajaProyectado,
    hasData,
    balanceTotal,
    esPositivo,
    tieneAlertas
  } = useBalanceFinanzas({ ...filtros, autoRefresh: true });

  const { alertas, saludFinanciera, requiereAtencion } = useAlertasFinancieras();
  const { metricas } = useMetricasRendimiento();

  const handleFiltroChange = (key: string, value: any) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const resetFiltros = () => {
    setFiltros({
      fechaDesde: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      fechaHasta: new Date(),
      incluirGastos: true,
      incluirIngresos: true,
      medioId: ''
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Balance por Medios de Pago</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Calculando balance financiero...</span>
        </div>
      </div>
    );
  }

  if (error || !hasData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Balance por Medios de Pago</h1>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar balance</h3>
            <p className="mt-1 text-sm text-gray-500">{error || 'No se pudo obtener la información financiera'}</p>
            <Button onClick={refetch} className="mt-4">
              <HiOutlineRefresh className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mediosPositivos = getMediosPositivos();
  const mediosNegativos = getMediosNegativos();
  const flujoCaja = getFlujoCajaProyectado();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balance por Medios de Pago</h1>
          <p className="text-gray-600">
            Análisis financiero consolidado por medios de pago
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowFiltros(!showFiltros)}>
            <HiOutlineFilter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" onClick={refetch}>
            <HiOutlineRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFiltros && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros de Análisis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Fecha Desde"
                type="date"
                value={filtros.fechaDesde.toISOString().split('T')[0]}
                onChange={(e) => handleFiltroChange('fechaDesde', new Date(e.target.value))}
              />
              <Input
                label="Fecha Hasta"
                type="date"
                value={filtros.fechaHasta.toISOString().split('T')[0]}
                onChange={(e) => handleFiltroChange('fechaHasta', new Date(e.target.value))}
              />
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filtros.incluirIngresos}
                    onChange={(e) => handleFiltroChange('incluirIngresos', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Incluir Ingresos</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filtros.incluirGastos}
                    onChange={(e) => handleFiltroChange('incluirGastos', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Incluir Gastos</span>
                </label>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={resetFiltros} size="sm">
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicadores principales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className={esPositivo ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCash className={`h-8 w-8 ${esPositivo ? 'text-green-600' : 'text-red-600'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Balance Total</p>
                <p className={`text-xl font-bold ${esPositivo ? 'text-green-600' : 'text-red-600'}`}>
                  {CurrencyUtils.formatAmount(balanceTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineTrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ingresos</p>
                <p className="text-xl font-bold text-blue-600">
                  {CurrencyUtils.formatAmount(data?.totales?.ingresosTotales ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineTrendingDown className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Gastos</p>
                <p className="text-xl font-bold text-orange-600">
                  {CurrencyUtils.formatAmount(data?.totales?.gastosTotales ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCreditCard className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Medios Activos</p>
                <p className="text-xl font-bold text-purple-600">
                  {data?.totales?.cantidadMedios ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClipboardList className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Transacciones</p>
                <p className="text-xl font-bold text-indigo-600">
                  {data?.totales?.cantidadTransacciones ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas y Salud Financiera */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salud Financiera */}
        <Card className={
          saludFinanciera.estado === 'excelente' ? "border-green-200 bg-green-50" :
          saludFinanciera.estado === 'buena' ? "border-blue-200 bg-blue-50" :
          saludFinanciera.estado === 'regular' ? "border-yellow-200 bg-yellow-50" :
          saludFinanciera.estado === 'mala' ? "border-orange-200 bg-orange-50" :
          "border-red-200 bg-red-50"
        }>
          <CardHeader>
            <CardTitle className="flex items-center">
              {saludFinanciera.estado === 'excelente' || saludFinanciera.estado === 'buena' ? (
                <HiOutlineShieldCheck className="h-5 w-5 mr-2 text-green-600" />
              ) : (
                <HiOutlineShieldExclamation className="h-5 w-5 mr-2 text-yellow-600" />
              )}
              Salud Financiera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Puntuación</span>
                  <span className="font-bold">{saludFinanciera.puntuacion}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      saludFinanciera.puntuacion >= 70 ? 'bg-green-500' :
                      saludFinanciera.puntuacion >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${saludFinanciera.puntuacion}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-700">{saludFinanciera.mensaje}</p>
              
              {saludFinanciera.recomendaciones.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <HiOutlineLightBulb className="h-4 w-4 mr-1" />
                    Recomendaciones:
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {saludFinanciera.recomendaciones.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-gray-400 mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Flujo de Caja */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineClock className="h-5 w-5 mr-2" />
              Flujo de Caja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Proyección Mensual</p>
                <p className={`text-lg font-bold ${flujoCaja.proyeccionMensual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {CurrencyUtils.formatAmount(flujoCaja.proyeccionMensual)}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Tendencia</p>
                <div className="flex items-center">
                  {flujoCaja.tendencia === 'creciente' ? (
                    <HiOutlineTrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : flujoCaja.tendencia === 'decreciente' ? (
                    <HiOutlineTrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  ) : (
                    <HiOutlineChartBar className="h-4 w-4 text-gray-500 mr-1" />
                  )}
                  <span className="text-sm capitalize">{flujoCaja.tendencia}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Liquidez</p>
                <p className="text-sm text-gray-700">
                  {flujoCaja.liquidezDias.toFixed(0)} días de gastos cubiertos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {tieneAlertas && alertas && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center">
                <HiOutlineExclamationCircle className="h-5 w-5 mr-2" />
                Alertas Financieras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertas.mediosEnRojo > 0 && (
                  <div className="flex items-center text-sm text-yellow-700">
                    <HiOutlineTrendingDown className="h-4 w-4 mr-2" />
                    {alertas.mediosEnRojo} medio(s) con balance negativo
                  </div>
                )}
                {alertas.concentracionExcesiva && (
                  <div className="flex items-center text-sm text-yellow-700">
                    <HiOutlineExclamationCircle className="h-4 w-4 mr-2" />
                    Concentración excesiva en un medio de pago
                  </div>
                )}
                {alertas.sinMovimiento > 0 && (
                  <div className="flex items-center text-sm text-yellow-700">
                    <HiOutlineClock className="h-4 w-4 mr-2" />
                    {alertas.sinMovimiento} medio(s) sin movimiento
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Medios de Pago - Balance detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medios con Balance Positivo */}
        {mediosPositivos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700 flex items-center">
                <HiOutlineCheckCircle className="h-5 w-5 mr-2" />
                Medios con Balance Positivo ({mediosPositivos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {mediosPositivos.map((medio) => (
                  <div key={medio.medioPago.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{medio.medioPago.nombre}</h4>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Ingresos:</span>
                            <p className="text-green-600">{CurrencyUtils.formatAmount(medio.ingresos.total)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Gastos:</span>
                            <p className="text-red-600">{CurrencyUtils.formatAmount(medio.gastos.total)}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {medio.ingresos.cantidad + medio.gastos.cantidad} transacciones
                          {medio.ultimaTransaccion && (
                            <span className="ml-2">
                              • Último: {DateUtils.formatDate(medio.ultimaTransaccion)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          +{CurrencyUtils.formatAmount(medio.balance)}
                        </p>
                        {medio.ratioIngresoGasto && (
                          <p className="text-xs text-gray-500">
                            Ratio I/G: {medio.ratioIngresoGasto.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medios con Balance Negativo */}
        {mediosNegativos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center">
                <HiOutlineExclamationCircle className="h-5 w-5 mr-2" />
                Medios con Balance Negativo ({mediosNegativos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {mediosNegativos.map((medio) => (
                  <div key={medio.medioPago.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{medio.medioPago.nombre}</h4>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Ingresos:</span>
                            <p className="text-green-600">{CurrencyUtils.formatAmount(medio.ingresos.total)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Gastos:</span>
                            <p className="text-red-600">{CurrencyUtils.formatAmount(medio.gastos.total)}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {medio.ingresos.cantidad + medio.gastos.cantidad} transacciones
                          {medio.ultimaTransaccion && (
                            <span className="ml-2">
                              • Último: {DateUtils.formatDate(medio.ultimaTransaccion)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          {CurrencyUtils.formatAmount(medio.balance)}
                        </p>
                        {medio.ratioIngresoGasto && (
                          <p className="text-xs text-gray-500">
                            Ratio I/G: {medio.ratioIngresoGasto.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Información de última actualización */}
      <div className="text-xs text-gray-500 text-center flex items-center justify-center">
        <HiOutlineCalendar className="h-4 w-4 mr-1" />
        Última actualización: {data ? DateUtils.formatDateTime(data.generadoEn) : "N/A"}
        <span className="mx-2">•</span>
        Período: {DateUtils.formatDate(filtros.fechaDesde)} - {DateUtils.formatDate(filtros.fechaHasta)}
      </div>
    </div>
  );
}