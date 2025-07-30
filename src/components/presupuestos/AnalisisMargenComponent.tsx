// src/components/presupuestos/AnalisisMargenComponent.tsx
'use client';

import { useAnalisisMargen } from '@/hooks/use-gastos-presupuesto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyUtils } from '@/lib/utils/calculations';
import { CATEGORIAS_GASTO_PRESUPUESTO } from '@/lib/validations/gasto-presupuesto';
import {
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineMinusCircle,
  HiOutlineCash,
  HiOutlineReceiptTax,
  HiOutlineClipboardList,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle
} from 'react-icons/hi';

interface AnalisisMargenComponentProps {
  presupuestoId: string;
  showDetailed?: boolean;
}

export function AnalisisMargenComponent({
  presupuestoId,
  showDetailed = true
}: AnalisisMargenComponentProps) {
  const {
    presupuesto,
    gastos,
    ventas,
    margen,
    loading,
    error,
    refetch
  } = useAnalisisMargen(presupuestoId);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando análisis de margen...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar análisis</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={refetch}
              className="mt-4 text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Reintentar
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!presupuesto) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <HiOutlineInformationCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin datos suficientes</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se puede realizar el análisis de margen
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getMargenIcon = () => {
    switch (margen.estado) {
      case 'positivo':
        return <HiOutlineTrendingUp className="h-8 w-8 text-green-600" />;
      case 'negativo':
        return <HiOutlineTrendingDown className="h-8 w-8 text-red-600" />;
      default:
        return <HiOutlineMinusCircle className="h-8 w-8 text-gray-600" />;
    }
  };

  const getMargenColor = () => {
    switch (margen.estado) {
      case 'positivo':
        return 'text-green-600';
      case 'negativo':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getMargenBgColor = () => {
    switch (margen.estado) {
      case 'positivo':
        return 'bg-green-50 border-green-200';
      case 'negativo':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen del margen */}
      <Card className={`border-2 ${getMargenBgColor()}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            {getMargenIcon()}
            <span className="ml-3">Análisis de Margen</span>
            <span className="ml-2 text-sm font-normal text-gray-600">
              {presupuesto.numero} - {presupuesto.cliente}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Presupuesto */}
            <div className="text-center">
              <HiOutlineClipboardList className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">Presupuesto</p>
              <p className="text-xl font-bold text-blue-600">
                {CurrencyUtils.formatAmount(presupuesto.total, presupuesto.moneda as any)}
              </p>
            </div>

            {/* Ventas */}
            <div className="text-center">
              <HiOutlineCash className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">Ventas Reales</p>
              <p className="text-xl font-bold text-purple-600">
                {CurrencyUtils.formatAmount(ventas.total, presupuesto.moneda as any)}
              </p>
              {ventas.saldoPendiente > 0 && (
                <p className="text-xs text-gray-500">
                  Pendiente: {CurrencyUtils.formatAmount(ventas.saldoPendiente, presupuesto.moneda as any)}
                </p>
              )}
            </div>

            {/* Gastos */}
            <div className="text-center">
              <HiOutlineReceiptTax className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">Gastos Totales</p>
              <p className="text-xl font-bold text-orange-600">
                {CurrencyUtils.formatAmount(gastos.total, presupuesto.moneda as any)}
              </p>
            </div>

            {/* Margen */}
            <div className="text-center">
              {getMargenIcon()}
              <p className="text-sm font-medium text-gray-500 mt-2">Margen</p>
              <p className={`text-xl font-bold ${getMargenColor()}`}>
                {CurrencyUtils.formatAmount(margen.bruto, presupuesto.moneda as any)}
              </p>
              <p className={`text-sm font-medium ${getMargenColor()}`}>
                {margen.porcentaje.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Barra de progreso del margen */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Composición Financiera</span>
              <span className="text-sm text-gray-500">
                Margen: {margen.porcentaje.toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
              {/* Barra de gastos */}
              <div
                className="absolute top-0 left-0 h-full bg-red-400 transition-all duration-500"
                style={{ 
                  width: ventas.total > 0 ? `${Math.min(100, (gastos.total / ventas.total) * 100)}%` : '0%' 
                }}
              />
              
              {/* Barra de margen */}
              <div
                className="absolute top-0 h-full bg-green-400 transition-all duration-500"
                style={{ 
                  left: ventas.total > 0 ? `${Math.min(100, (gastos.total / ventas.total) * 100)}%` : '0%',
                  width: ventas.total > 0 ? `${Math.max(0, Math.min(100 - (gastos.total / ventas.total) * 100, (margen.bruto / ventas.total) * 100))}%` : '0%'
                }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Gastos: {ventas.total > 0 ? ((gastos.total / ventas.total) * 100).toFixed(1) : 0}%</span>
              <span>Margen: {margen.porcentaje.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desglose detallado */}
      {showDetailed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gastos por categoría */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(gastos.porCategoria).length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay gastos registrados
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(gastos.porCategoria)
                    .sort(([,a], [,b]) => b - a)
                    .map(([categoria, monto]) => {
                      const config = CATEGORIAS_GASTO_PRESUPUESTO[categoria as keyof typeof CATEGORIAS_GASTO_PRESUPUESTO];
                      const porcentaje = gastos.total > 0 ? (monto / gastos.total) * 100 : 0;
                      
                      return (
                        <div key={categoria} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{config?.icon || '📋'}</span>
                            <span className="text-sm font-medium text-gray-700">
                              {config?.label || categoria}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {CurrencyUtils.formatAmount(monto, presupuesto.moneda as any)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {porcentaje.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Indicadores clave */}
          <Card>
            <CardHeader>
              <CardTitle>Indicadores Clave</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Eficiencia vs Presupuesto */}
                <div className="border-b pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Eficiencia vs Presupuesto
                    </span>
                    <span className={`text-sm font-bold ${
                      ventas.total > presupuesto.total ? 'text-green-600' :
                      ventas.total < presupuesto.total * 0.9 ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {presupuesto.total > 0 ? ((ventas.total / presupuesto.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {ventas.total > presupuesto.total ? 'Supera' : 
                     ventas.total < presupuesto.total * 0.9 ? 'Por debajo' : 'Cerca'} del presupuesto original
                  </p>
                </div>

                {/* Ratio Gastos/Ventas */}
                <div className="border-b pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Ratio Gastos/Ventas
                    </span>
                    <span className={`text-sm font-bold ${
                      ventas.total > 0 && (gastos.total / ventas.total) < 0.7 ? 'text-green-600' :
                      ventas.total > 0 && (gastos.total / ventas.total) < 0.85 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {ventas.total > 0 ? ((gastos.total / ventas.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {ventas.total > 0 && (gastos.total / ventas.total) < 0.7 ? 'Excelente control' :
                     ventas.total > 0 && (gastos.total / ventas.total) < 0.85 ? 'Control aceptable' :
                     'Revisar gastos'} de costos
                  </p>
                </div>

                {/* Estado del proyecto */}
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Estado del Proyecto
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      margen.estado === 'positivo' ? 'bg-green-100 text-green-800' :
                      margen.estado === 'negativo' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {margen.estado === 'positivo' ? 'Rentable' :
                       margen.estado === 'negativo' ? 'Con Pérdida' :
                       'En Equilibrio'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {margen.estado === 'positivo' ? 'El proyecto genera beneficios' :
                     margen.estado === 'negativo' ? 'Revisar estructura de costos' :
                     'Proyecto sin ganancias ni pérdidas'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas y recomendaciones */}
      {(margen.estado === 'negativo' || (ventas.total > 0 && (gastos.total / ventas.total) > 0.85)) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <HiOutlineExclamationCircle className="h-5 w-5 mr-2" />
              Alertas y Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-yellow-800">
              {margen.estado === 'negativo' && (
                <p>• <strong>Margen negativo:</strong> Los gastos superan las ventas. Revisar estructura de costos.</p>
              )}
              {ventas.total > 0 && (gastos.total / ventas.total) > 0.85 && (
                <p>• <strong>Ratio de gastos elevado:</strong> Los gastos representan más del 85% de las ventas.</p>
              )}
              {ventas.saldoPendiente > 0 && (
                <p>• <strong>Saldo pendiente:</strong> Hay {CurrencyUtils.formatAmount(ventas.saldoPendiente, presupuesto.moneda as any)} por cobrar.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}