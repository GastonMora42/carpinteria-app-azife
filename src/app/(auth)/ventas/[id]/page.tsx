// src/app/(auth)/ventas/[id]/page.tsx - VERSIÓN MEJORADA
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useVenta } from '@/hooks/use-ventas';
import { usePagosVenta } from '@/hooks/use-pagos-ventas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PagosComponent } from '@/components/ventas/PagosComponent';
import { Currency, CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { ESTADOS_PEDIDO } from '@/lib/utils/validators';
import { TransaccionFormData } from '@/lib/validations/transaccion';
import {
  HiOutlineArrowLeft,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineClipboardCheck,
  HiOutlineCalendar,
  HiOutlineDocumentReport,
  HiOutlinePrinter,
  HiOutlineDownload,
  HiOutlineEye,
  HiOutlinePencil
} from 'react-icons/hi';

export default function VentaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { venta, loading: ventaLoading, error: ventaError } = useVenta(id);
  const { 
    pagos, 
    loading: pagosLoading, 
    estadisticas,
    registrarPago, 
    anularPago,
    refetch: refetchPagos,
    actualizarEstadisticasConVenta
  } = usePagosVenta(id);

  // Actualizar estadísticas cuando se carga la venta
  useEffect(() => {
    if (venta) {
      actualizarEstadisticasConVenta({
        id: venta.id,
        numero: venta.numero,
        total: venta.total,
        totalCobrado: venta.totalCobrado,
        saldoPendiente: venta.saldoPendiente,
        moneda: venta.moneda,
        cliente: venta.cliente
      });
    }
  }, [venta, actualizarEstadisticasConVenta]);

  const handleRegistrarPago = async (data: TransaccionFormData) => {
    try {
      await registrarPago(data);
      // Recargar los datos de la venta para obtener los saldos actualizados
      window.location.reload();
    } catch (error) {
      console.error('Error al registrar pago:', error);
      // Aquí podrías mostrar un toast de error
    }
  };

  const handleAnularPago = async (pagoId: string) => {
    try {
      await anularPago(pagoId);
      // Recargar los datos de la venta para obtener los saldos actualizados
      window.location.reload();
    } catch (error) {
      console.error('Error al anular pago:', error);
      // Aquí podrías mostrar un toast de error
    }
  };

  if (ventaLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando venta...</span>
      </div>
    );
  }

  if (ventaError || !venta) {
    return (
      <div className="text-center py-12">
        <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {ventaError || 'Venta no encontrada'}
        </h3>
        <div className="mt-4">
          <Button onClick={() => router.back()}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const estadoInfo = ESTADOS_PEDIDO[venta.estado as keyof typeof ESTADOS_PEDIDO];
  const porcentajeCobrado = venta.total > 0 ? (venta.totalCobrado / venta.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="text-white hover:bg-blue-500"
            >
              <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{venta.numero}</h1>
              <p className="text-blue-100 mt-1">
                Venta para {venta.cliente.nombre}
              </p>
              <div className="flex items-center mt-2 space-x-4 text-sm text-blue-200">
                <span className="flex items-center">
                  <HiOutlineCalendar className="h-4 w-4 mr-1" />
                  {DateUtils.formatDate(venta.fechaPedido)}
                </span>
                {venta.fechaEntrega && (
                  <span className="flex items-center">
                    <HiOutlineClipboardCheck className="h-4 w-4 mr-1" />
                    Entrega: {DateUtils.formatDate(venta.fechaEntrega)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-2xl font-bold">
                {CurrencyUtils.formatAmount(venta.total, venta.moneda as Currency)}
              </div>
              <div className="text-blue-100 text-sm">
                Total de la venta
              </div>
            </div>
            
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              estadoInfo.color === 'green' ? 'bg-green-100 text-green-800' :
              estadoInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              estadoInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
              estadoInfo.color === 'red' ? 'bg-red-100 text-red-800' :
              estadoInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {estadoInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Resumen financiero rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineDocumentReport className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Venta</p>
                <p className="text-lg font-bold text-gray-900">
                  {CurrencyUtils.formatAmount(venta.total, venta.moneda as Currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCash className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Cobrado</p>
                <p className="text-lg font-bold text-green-600">
                  {CurrencyUtils.formatAmount(venta.totalCobrado, venta.moneda as Currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineExclamationCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Saldo Pendiente</p>
                <p className="text-lg font-bold text-red-600">
                  {CurrencyUtils.formatAmount(venta.saldoPendiente, venta.moneda as Currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClipboardCheck className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">% Cobrado</p>
                <p className="text-lg font-bold text-purple-600">
                  {estadisticas.porcentajeCobrado.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de progreso de cobro */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Progreso de Cobro</h3>
            <span className="text-sm text-gray-500">
              {CurrencyUtils.formatAmount(venta.totalCobrado, venta.moneda as Currency)} de{' '}
              {CurrencyUtils.formatAmount(venta.total, venta.moneda as Currency)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                porcentajeCobrado === 100 ? 'bg-green-500' :
                porcentajeCobrado >= 75 ? 'bg-blue-500' :
                porcentajeCobrado >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, porcentajeCobrado)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>{porcentajeCobrado.toFixed(1)}%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <Button variant="outline">
            <HiOutlinePrinter className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline">
            <HiOutlineEye className="h-4 w-4 mr-2" />
            Ver Presupuesto
          </Button>
        </div>

        <div className="flex space-x-3">
          <Button variant="outline">
            <HiOutlinePencil className="h-4 w-4 mr-2" />
            Editar Venta
          </Button>
        </div>
      </div>

      {/* Componente de pagos */}
      <PagosComponent
        venta={{
          id: venta.id,
          numero: venta.numero,
          total: venta.total,
          totalCobrado: venta.totalCobrado,
          saldoPendiente: venta.saldoPendiente,
          moneda: venta.moneda,
          cliente: venta.cliente
        }}
        pagos={pagos}
        loading={pagosLoading}
        onRegistrarPago={handleRegistrarPago}
        onAnularPago={handleAnularPago}
        showActions={true}
        compact={false}
      />

      {/* Información adicional de la venta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Cliente</label>
              <p className="text-lg font-semibold text-gray-900">{venta.cliente.nombre}</p>
            </div>
            {venta.cliente.email && (
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{venta.cliente.email}</p>
              </div>
            )}
            {venta.cliente.telefono && (
              <div>
                <label className="text-sm font-medium text-gray-500">Teléfono</label>
                <p className="text-gray-900">{venta.cliente.telefono}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Venta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Número</label>
                <p className="font-mono text-lg font-bold text-blue-600">{venta.numero}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                  estadoInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                  estadoInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  estadoInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                  estadoInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                  estadoInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {estadoInfo.label}
                </span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Prioridad</label>
              <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                venta.prioridad === 'URGENTE' ? 'bg-red-100 text-red-800' :
                venta.prioridad === 'ALTA' ? 'bg-orange-100 text-orange-800' :
                venta.prioridad === 'NORMAL' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {venta.prioridad}
              </span>
            </div>
            
            {venta.descripcionObra && (
              <div>
                <label className="text-sm font-medium text-gray-500">Descripción</label>
                <p className="text-gray-900">{venta.descripcionObra}</p>
              </div>
            )}
            
            {venta.condicionesPago && (
              <div>
                <label className="text-sm font-medium text-gray-500">Condiciones de Pago</label>
                <p className="text-gray-900">{venta.condicionesPago}</p>
              </div>
            )}

            {venta.lugarEntrega && (
              <div>
                <label className="text-sm font-medium text-gray-500">Lugar de Entrega</label>
                <p className="text-gray-900">{venta.lugarEntrega}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items de la venta (si los tiene) */}
      {venta.items && venta.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items de la Venta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Precio Unit.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {venta.items.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.descripcion}
                          </div>
                          {item.detalle && (
                            <div className="text-sm text-gray-500">{item.detalle}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.cantidad} {item.unidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {CurrencyUtils.formatAmount(item.precioUnitario, venta.moneda as Currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {CurrencyUtils.formatAmount(item.total, venta.moneda as Currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}