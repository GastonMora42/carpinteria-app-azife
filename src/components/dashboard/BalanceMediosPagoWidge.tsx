// src/components/dashboard/BalanceMediosPagoWidget.tsx - WIDGET PARA DASHBOARD
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyUtils } from '@/lib/utils/calculations';
import { useRouter } from 'next/navigation';
import {
  HiOutlineCash,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCreditCard,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineRefresh
} from 'react-icons/hi';
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from 'react';
import { useBalanceFinanzas } from '@/hooks/use-balance-finanzas';

interface BalanceMediosPagoWidgetProps {
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export function BalanceMediosPagoWidget({ 
  showActions = true, 
  compact = false,
  className = ''
}: BalanceMediosPagoWidgetProps) {
  const router = useRouter();
  
  // Obtener balance del último mes
  const fechaHasta = new Date();
  const fechaDesde = new Date();
  fechaDesde.setMonth(fechaDesde.getMonth() - 1);
  
  const { 
    data, 
    loading, 
    error, 
    refetch,
    balanceTotal,
    esPositivo,
    tieneAlertas,
    totalMedios
  } = useBalanceFinanzas({
    fechaDesde,
    fechaHasta,
    incluirGastos: true,
    incluirIngresos: true
  });

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Cargando balance...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Balance por Medios de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto h-8 w-8 text-red-400" />
            <p className="text-sm text-gray-500 mt-2">Error al cargar</p>
            {showActions && (
              <Button size="sm" variant="outline" onClick={refetch} className="mt-2">
                <HiOutlineRefresh className="h-3 w-3 mr-1" />
                Reintentar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Obtener los medios más importantes
  const mediosPrincipales = data.balance
    .filter((m: { balance: number; }) => Math.abs(m.balance) > 0)
    .sort((a: { balance: number; }, b: { balance: number; }) => Math.abs(b.balance) - Math.abs(a.balance))
    .slice(0, compact ? 2 : 4);

  const mediosPositivos = data.balance.filter((m: { balance: number; }) => m.balance > 0);
  const mediosNegativos = data.balance.filter((m: { balance: number; }) => m.balance < 0);

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Balance Medios de Pago</CardTitle>
            {showActions && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => router.push('/finanzas/balance')}
              >
                <HiOutlineEye className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Balance Total:</span>
              <span className={`text-sm font-bold ${esPositivo ? 'text-green-600' : 'text-red-600'}`}>
                {CurrencyUtils.formatAmount(balanceTotal)}
              </span>
            </div>
            
            <div className="space-y-1">
              {mediosPrincipales.slice(0, 2).map((medio: { medioPago: { id: Key | null | undefined; nombre: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }; balance: number; }) => (
                <div key={medio.medioPago.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate">{medio.medioPago.nombre}</span>
                  <span className={`font-medium ${medio.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {CurrencyUtils.formatAmount(medio.balance)}
                  </span>
                </div>
              ))}
            </div>

            {tieneAlertas && (
              <div className="flex items-center text-xs text-yellow-600">
                <HiOutlineExclamationCircle className="h-3 w-3 mr-1" />
                Requiere atención
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Balance por Medios de Pago</CardTitle>
          {showActions && (
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={refetch}
              >
                <HiOutlineRefresh className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => router.push('/finanzas/balance')}
              >
                <HiOutlineEye className="h-4 w-4 mr-2" />
                Ver Detalle
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Resumen principal */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full mx-auto mb-2 ${
                esPositivo ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <HiOutlineCash className={`h-5 w-5 ${esPositivo ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <p className="text-xs text-gray-500">Balance Total</p>
              <p className={`text-lg font-bold ${esPositivo ? 'text-green-600' : 'text-red-600'}`}>
                {CurrencyUtils.formatAmount(balanceTotal)}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
                <HiOutlineCreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500">Medios Activos</p>
              <p className="text-lg font-bold text-blue-600">{totalMedios}</p>
            </div>

            <div className="text-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full mx-auto mb-2 ${
                tieneAlertas ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                {tieneAlertas ? (
                  <HiOutlineExclamationCircle className="h-5 w-5 text-yellow-600" />
                ) : (
                  <HiOutlineCheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className="text-xs text-gray-500">Estado</p>
              <p className={`text-sm font-medium ${tieneAlertas ? 'text-yellow-600' : 'text-green-600'}`}>
                {tieneAlertas ? 'Atención' : 'Estable'}
              </p>
            </div>
          </div>

          {/* Medios principales */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Principales Medios</h4>
            <div className="space-y-2">
              {mediosPrincipales.map((medio: { medioPago: { id: Key | null | undefined; nombre: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }; balance: number; }) => (
                <div key={medio.medioPago.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      medio.balance >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm text-gray-700">{medio.medioPago.nombre}</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    medio.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {CurrencyUtils.formatAmount(medio.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center text-green-600 mb-1">
                <HiOutlineTrendingUp className="h-4 w-4 mr-1" />
                <span className="text-xs">Positivos</span>
              </div>
              <p className="text-sm font-medium">{mediosPositivos.length}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center text-red-600 mb-1">
                <HiOutlineTrendingDown className="h-4 w-4 mr-1" />
                <span className="text-xs">Negativos</span>
              </div>
              <p className="text-sm font-medium">{mediosNegativos.length}</p>
            </div>
          </div>

          {/* Alertas si las hay */}
          {data.analisis.alertas && (
            data.analisis.alertas.mediosEnRojo > 0 || 
            data.analisis.alertas.concentracionExcesiva ||
            data.analisis.alertas.sinMovimiento > 0
          ) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <HiOutlineExclamationCircle className="h-4 w-4 text-yellow-600 mr-2" />
                <div className="text-xs text-yellow-800">
                  {data.analisis.alertas.mediosEnRojo > 0 && (
                    <p>{data.analisis.alertas.mediosEnRojo} medios en rojo</p>
                  )}
                  {data.analisis.alertas.concentracionExcesiva && (
                    <p>Concentración excesiva detectada</p>
                  )}
                  {data.analisis.alertas.sinMovimiento > 0 && (
                    <p>{data.analisis.alertas.sinMovimiento} sin movimiento</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}