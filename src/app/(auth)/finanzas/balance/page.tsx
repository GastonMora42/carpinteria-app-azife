// src/app/(auth)/finanzas/balance/page.tsx - VERSIÓN SIMPLIFICADA Y FUNCIONAL
'use client';

import { useState } from 'react';
import { useBalanceFinanzas } from '@/hooks/use-balance-finanzas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { QuickActions, FinancialSummary } from '@/components/balance/QuickActions';
import {
  HiOutlineCash,
  HiOutlineBan,
  HiOutlineCreditCard,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCalendar,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown
} from 'react-icons/hi';

export default function BalanceFinanzasPage() {
  const [filtros, setFiltros] = useState({
    fechaDesde: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Inicio del mes
    fechaHasta: new Date(), // Hoy
    incluirGastos: true,
    incluirIngresos: true,
    medioId: ''
  });

  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  const { 
    data, 
    loading, 
    error, 
    refetch,
    balanceTotal,
    esPositivo
  } = useBalanceFinanzas({ ...filtros, autoRefresh: true });

  const handleFiltroChange = (key: string, value: any) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  // Categorizar medios de pago
  const categorizarMedios = () => {
    if (!data?.balance) return { efectivo: [], banco: [], otros: [] };

    const efectivo = data.balance.filter(m => 
      m.medioPago.nombre.toLowerCase().includes('efectivo')
    );

    const banco = data.balance.filter(m => 
      m.medioPago.nombre.toLowerCase().includes('banco') ||
      m.medioPago.nombre.toLowerCase().includes('transferencia') ||
      m.medioPago.nombre.toLowerCase().includes('cuenta')
    );

    const otros = data.balance.filter(m => 
      !efectivo.includes(m) && !banco.includes(m)
    );

    return { efectivo, banco, otros };
  };

  const { efectivo, banco, otros } = categorizarMedios();

  // Calcular totales por categoría
  const totalEfectivo = efectivo.reduce((sum, m) => sum + m.balance, 0);
  const totalBanco = banco.reduce((sum, m) => sum + m.balance, 0);
  const totalOtros = otros.reduce((sum, m) => sum + m.balance, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Balance Financiero</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando balance...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Balance Financiero</h1>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar balance</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refetch}>
              <HiOutlineRefresh className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balance Financiero</h1>
          <p className="text-gray-600">
            Dinero disponible por medio de pago
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setMostrarDetalles(!mostrarDetalles)}
            size="sm"
          >
            {mostrarDetalles ? (
              <HiOutlineEyeOff className="h-4 w-4 mr-2" />
            ) : (
              <HiOutlineEye className="h-4 w-4 mr-2" />
            )}
            {mostrarDetalles ? 'Ocultar' : 'Ver'} Detalles
          </Button>
          <Button variant="outline" onClick={refetch} size="sm">
            <HiOutlineRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros simples */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <HiOutlineCalendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Período:</span>
            </div>
            <Input
              type="date"
              value={filtros.fechaDesde.toISOString().split('T')[0]}
              onChange={(e) => handleFiltroChange('fechaDesde', new Date(e.target.value))}
              className="w-auto"
   
            />
            <span className="text-gray-400">a</span>
            <Input
              type="date"
              value={filtros.fechaHasta.toISOString().split('T')[0]}
              onChange={(e) => handleFiltroChange('fechaHasta', new Date(e.target.value))}
              className="w-auto"
            
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumen Financiero */}
      <FinancialSummary
        totalEfectivo={totalEfectivo}
        totalBanco={totalBanco}
        totalOtros={totalOtros}
        balanceTotal={balanceTotal}
      />

      {/* Acciones Rápidas */}
      <QuickActions onActionComplete={refetch} />

      {/* Medios Principales con indicadores mejorados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Efectivo */}
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-green-700">
              <div className="flex items-center">
                <HiOutlineCash className="h-6 w-6 mr-2" />
                Efectivo
              </div>
              {totalEfectivo > 0 && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Disponible
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {CurrencyUtils.formatAmount(totalEfectivo)}
                </div>
                <div className="text-sm text-gray-500">
                  {efectivo.length} cuenta(s)
                </div>
              </div>
              
              {/* Barra de proporción */}
              {balanceTotal > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${Math.max(0, (totalEfectivo / balanceTotal) * 100)}%` }}
                  ></div>
                </div>
              )}
              
              {mostrarDetalles && efectivo.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Detalles:</h4>
                  {efectivo.map((medio) => (
                    <div key={medio.medioPago.id} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{medio.medioPago.nombre}</span>
                      <span className={`font-medium ${medio.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {CurrencyUtils.formatAmount(medio.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Banco */}
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-blue-700">
              <div className="flex items-center">
                <HiOutlineBan className="h-6 w-6 mr-2" />
                Banco
              </div>
              {totalBanco > 0 && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Disponible
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {CurrencyUtils.formatAmount(totalBanco)}
                </div>
                <div className="text-sm text-gray-500">
                  {banco.length} cuenta(s)
                </div>
              </div>
              
              {/* Barra de proporción */}
              {balanceTotal > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${Math.max(0, (totalBanco / balanceTotal) * 100)}%` }}
                  ></div>
                </div>
              )}
              
              {mostrarDetalles && banco.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Detalles:</h4>
                  {banco.map((medio) => (
                    <div key={medio.medioPago.id} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{medio.medioPago.nombre}</span>
                      <span className={`font-medium ${medio.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {CurrencyUtils.formatAmount(medio.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Otros */}
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-purple-700">
              <div className="flex items-center">
                <HiOutlineCreditCard className="h-6 w-6 mr-2" />
                Otros Medios
              </div>
              {totalOtros > 0 && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  Disponible
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {CurrencyUtils.formatAmount(totalOtros)}
                </div>
                <div className="text-sm text-gray-500">
                  {otros.length} medio(s)
                </div>
              </div>
              
              {/* Barra de proporción */}
              {balanceTotal > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${Math.max(0, (totalOtros / balanceTotal) * 100)}%` }}
                  ></div>
                </div>
              )}
              
              {mostrarDetalles && otros.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Detalles:</h4>
                  {otros.map((medio) => (
                    <div key={medio.medioPago.id} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{medio.medioPago.nombre}</span>
                      <span className={`font-medium ${medio.balance >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                        {CurrencyUtils.formatAmount(medio.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen rápido */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen del Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {CurrencyUtils.formatAmount(data.totales.ingresosTotales)}
                </div>
                <div className="text-sm text-gray-500">Ingresos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {CurrencyUtils.formatAmount(data.totales.gastosTotales)}
                </div>
                <div className="text-sm text-gray-500">Gastos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {data.totales.cantidadTransacciones}
                </div>
                <div className="text-sm text-gray-500">Transacciones</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {data.totales.cantidadMedios}
                </div>
                <div className="text-sm text-gray-500">Medios Activos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de actualización */}
      <div className="text-center">
        <div className="text-xs text-gray-500 flex items-center justify-center space-x-2">
          <HiOutlineCalendar className="h-4 w-4" />
          <span>
            Última actualización: {data ? DateUtils.formatDateTime(data.generadoEn) : "N/A"}
          </span>
          <span>•</span>
          <span>
            Período: {DateUtils.formatDate(filtros.fechaDesde)} - {DateUtils.formatDate(filtros.fechaHasta)}
          </span>
        </div>
      </div>
    </div>
  );
}