// src/components/ventas/BalanceMediosPagoComponent.tsx - NUEVO COMPONENTE
'use client';

import { useBalanceVenta, useAlertasBalance } from '@/hooks/use-balance-venta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import {
  HiOutlineCash,
  HiOutlineCreditCard,
  HiOutlineChartBar,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineClipboardList
} from 'react-icons/hi';

interface BalanceMediosPagoProps {
  ventaId: string;
  showActions?: boolean;
  compact?: boolean;
  onMedioPagoClick?: (medioId: string) => void;
}

// Componente principal
export function BalanceMediosPagoComponent({ 
  ventaId, 
  showActions = true, 
  compact = false,
  onMedioPagoClick 
}: BalanceMediosPagoProps) {
  const { 
    balance, 
    loading, 
    error, 
    refetch,
    getProgresoCobro,
    getDistribucionPagos,
    getMediosOrdenadosPorMonto,
    isCompletamenteCobrado
  } = useBalanceVenta(ventaId);

  const { alertas } = useAlertasBalance(ventaId);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando balance...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !balance) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar balance</h3>
            <p className="mt-1 text-sm text-gray-500">{error || 'No se pudo obtener la información'}</p>
            {showActions && (
              <Button onClick={refetch} className="mt-4" size="sm">
                <HiOutlineRefresh className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const progreso = getProgresoCobro();
  const distribucion = getDistribucionPagos();
  const mediosOrdenados = getMediosOrdenadosPorMonto();

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <HiOutlineCreditCard className="h-5 w-5 mr-2" />
            Balance por Medios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Cobrado:</span>
              <span className="font-medium text-green-600">
                {CurrencyUtils.formatAmount(balance.balance.totalCobrado, balance.venta.moneda as any)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Medios usados:</span>
              <span className="font-medium">{balance.balance.cantidadMediosPago}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, progreso.porcentaje)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-center">
              {progreso.mensaje}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con progreso general */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={isCompletamenteCobrado() ? "border-green-200 bg-green-50" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCash className={`h-8 w-8 ${isCompletamenteCobrado() ? 'text-green-600' : 'text-blue-600'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Cobrado</p>
                <p className={`text-lg font-bold ${isCompletamenteCobrado() ? 'text-green-600' : 'text-blue-600'}`}>
                  {CurrencyUtils.formatAmount(balance.balance.totalCobrado, balance.venta.moneda as any)}
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
                <p className="text-sm font-medium text-gray-500">Medios Usados</p>
                <p className="text-lg font-bold text-purple-600">{balance.balance.cantidadMediosPago}</p>
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
                <p className="text-lg font-bold text-indigo-600">{balance.balance.cantidadTransacciones}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineChartBar className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">% Cobrado</p>
                <p className="text-lg font-bold text-emerald-600">
                  {progreso.porcentaje.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas si las hay */}
      {alertas && (alertas.saldoPendienteAlto || alertas.soloUnMedioPago || alertas.sinPagosRecientes) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <HiOutlineExclamationCircle className="h-5 w-5 mr-2" />
              Alertas de Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertas.saldoPendienteAlto && (
                <div className="flex items-center text-sm text-yellow-700">
                  <HiOutlineTrendingDown className="h-4 w-4 mr-2" />
                  Saldo pendiente alto ({CurrencyUtils.formatAmount(balance.balance.saldoPendiente, balance.venta.moneda as any)})
                </div>
              )}
              {alertas.soloUnMedioPago && (
                <div className="flex items-center text-sm text-yellow-700">
                  <HiOutlineCreditCard className="h-4 w-4 mr-2" />
                  Solo se usa un medio de pago para una venta considerable
                </div>
              )}
              {alertas.sinPagosRecientes && (
                <div className="flex items-center text-sm text-yellow-700">
                  <HiOutlineClock className="h-4 w-4 mr-2" />
                  No hay pagos recientes en los últimos 30 días
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progreso visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <HiOutlineChartBar className="h-5 w-5 mr-2" />
              Progreso de Cobro
            </span>
            {showActions && (
              <Button variant="ghost" size="sm" onClick={refetch}>
                <HiOutlineRefresh className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {progreso.mensaje}
              </span>
              <span className="text-sm text-gray-500">
                {CurrencyUtils.formatAmount(balance.balance.saldoPendiente, balance.venta.moneda as any)} pendiente
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  progreso.estado === 'completo' ? 'bg-green-500' :
                  progreso.estado === 'parcial' ? 'bg-blue-500' :
                  'bg-gray-400'
                }`}
                style={{ width: `${Math.min(100, progreso.porcentaje)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>$0</span>
              <span>{CurrencyUtils.formatAmount(balance.venta.total, balance.venta.moneda as any)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desglose por medio de pago */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose por Medio de Pago</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {mediosOrdenados.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineCreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pagos registrados</h3>
              <p className="mt-1 text-sm text-gray-500">
                Los pagos por diferentes medios aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {mediosOrdenados.map((medio, index) => (
                <div 
                  key={medio.medioPago.id} 
                  className={`p-6 hover:bg-gray-50 transition-colors ${onMedioPagoClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onMedioPagoClick?.(medio.medioPago.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: distribucion[index]?.color || '#6B7280' }}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{medio.medioPago.nombre}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{medio.cantidadPagos} pago(s)</span>
                          <span>Promedio: {CurrencyUtils.formatAmount(medio.pagoPromedio, balance.venta.moneda as any)}</span>
                          {medio.ultimoPago && (
                            <span>Último: {DateUtils.formatDate(medio.ultimoPago)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {CurrencyUtils.formatAmount(medio.totalCobrado, balance.venta.moneda as any)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {medio.porcentajeDelTotal.toFixed(1)}% del total
                      </div>
                    </div>
                  </div>
                  
                  {/* Barra de progreso individual */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${medio.porcentajeDelTotal}%`,
                          backgroundColor: distribucion[index]?.color || '#6B7280'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas adicionales */}
      {balance.estadisticas.medioMasUsado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineTrendingUp className="h-5 w-5 mr-2" />
              Estadísticas de Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Medio Más Usado</h4>
                <p className="text-xl font-bold text-blue-600">
                  {balance.estadisticas.medioMasUsado.nombre}
                </p>
                <p className="text-sm text-blue-700">
                  {balance.estadisticas.medioMasUsado.cantidad} transacciones
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Mayor Recaudación</h4>
                <p className="text-xl font-bold text-green-600">
                  {mediosOrdenados[0]?.medioPago.nombre || 'N/A'}
                </p>
                <p className="text-sm text-green-700">
                  {mediosOrdenados[0] ? CurrencyUtils.formatAmount(mediosOrdenados[0].totalCobrado, balance.venta.moneda as any) : '$0'}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Diversificación</h4>
                <p className="text-xl font-bold text-purple-600">
                  {balance.balance.cantidadMediosPago > 2 ? 'Alta' : 
                   balance.balance.cantidadMediosPago === 2 ? 'Media' : 'Baja'}
                </p>
                <p className="text-sm text-purple-700">
                  {balance.balance.cantidadMediosPago} medio(s) diferentes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de última actualización */}
      <div className="text-xs text-gray-500 text-center">
        Última actualización: {DateUtils.formatDateTime(balance.ultimaActualizacion)}
      </div>
    </div>
  );
}