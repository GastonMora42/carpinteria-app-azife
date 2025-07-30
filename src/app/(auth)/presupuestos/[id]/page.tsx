// src/app/(auth)/presupuestos/[id]/page.tsx - ACTUALIZADO CON GASTOS Y ANÁLISIS
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePresupuesto } from '@/hooks/use-presupuestos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { GastosPresupuestoComponent } from '@/components/presupuestos/GastosPresupuestoComponent';
import { AnalisisMargenComponent } from '@/components/presupuestos/AnalisisMargenComponent';
import { CurrencyUtils, DateUtils, CalculationUtils } from '@/lib/utils/calculations';
import { ESTADOS_PRESUPUESTO } from '@/lib/utils/validators';
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineClipboardCheck,
  HiOutlineDocumentText,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlinePrinter,
  HiOutlineDownload,
  HiOutlineShare,
  HiOutlineReceiptTax,
  HiOutlineChartBar
} from 'react-icons/hi';

export default function PresupuestoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { presupuesto, loading, error } = usePresupuesto(id);
  const [activeTab, setActiveTab] = useState<'detalle' | 'gastos' | 'analisis'>('detalle');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando presupuesto...</span>
      </div>
    );
  }

  if (error || !presupuesto) {
    return (
      <div className="text-center py-12">
        <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {error || 'Presupuesto no encontrado'}
        </h3>
        <div className="mt-4">
          <Button onClick={() => router.back()}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const estadoInfo = ESTADOS_PRESUPUESTO[presupuesto.estado as keyof typeof ESTADOS_PRESUPUESTO];
  const dueStatus = DateUtils.getDueStatus(presupuesto.fechaValidez);

  // Pestañas de navegación
  const tabs = [
    {
      id: 'detalle',
      name: 'Detalle',
      icon: HiOutlineDocumentText,
      count: presupuesto.items?.length || 0
    },
    {
      id: 'gastos',
      name: 'Gastos',
      icon: HiOutlineReceiptTax,
      count: undefined // Se carga dinámicamente
    },
    {
      id: 'analisis',
      name: 'Análisis',
      icon: HiOutlineChartBar,
      count: undefined
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header con número prominente */}
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
              <h1 className="text-3xl font-bold">{presupuesto.numero}</h1>
              <p className="text-blue-100 mt-1">
                Presupuesto para {presupuesto.cliente.nombre}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold">
                {CurrencyUtils.formatAmount(presupuesto.total, presupuesto.moneda)}
              </div>
              <div className="text-blue-100 text-sm">
                Válido hasta {DateUtils.formatDate(presupuesto.fechaValidez)}
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

      {/* Botones de acción */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          {presupuesto.estado !== 'CONVERTIDO' && (
            <Button onClick={() => router.push(`/presupuestos/${id}/editar`)}>
              <HiOutlinePencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {presupuesto.estado === 'APROBADO' && (
            <Button className="bg-green-600 hover:bg-green-700">
              <HiOutlineClipboardCheck className="h-4 w-4 mr-2" />
              Convertir a Venta
            </Button>
          )}
        </div>

        <div className="flex space-x-3">
          <Button variant="outline">
            <HiOutlineShare className="h-4 w-4 mr-2" />
            Compartir
          </Button>
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button variant="outline">
            <HiOutlinePrinter className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
                {tab.count !== undefined && (
                  <span className={`rounded-full px-2 py-1 text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido según pestaña activa */}
      {activeTab === 'detalle' && (
        <div className="space-y-6">
          {/* Información general */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información del cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HiOutlineUser className="h-5 w-5 mr-2" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Cliente</label>
                  <p className="text-lg font-semibold text-gray-900">{presupuesto.cliente.nombre}</p>
                </div>
                {presupuesto.cliente.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{presupuesto.cliente.email}</p>
                  </div>
                )}
                {presupuesto.cliente.telefono && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                    <p className="text-gray-900">{presupuesto.cliente.telefono}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información del presupuesto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HiOutlineDocumentText className="h-5 w-5 mr-2" />
                  Detalles del Presupuesto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Número</label>
                    <p className="font-mono text-lg font-bold text-blue-600">{presupuesto.numero}</p>
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
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Emisión</label>
                    <p className="text-gray-900">{DateUtils.formatDate(presupuesto.fechaEmision)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Válido hasta</label>
                    <p className={`font-medium ${dueStatus.color}`}>
                      {DateUtils.formatDate(presupuesto.fechaValidez)}
                    </p>
                    <p className={`text-xs ${dueStatus.color}`}>
                      {dueStatus.message}
                    </p>
                  </div>
                </div>
                {presupuesto.tiempoEntrega && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tiempo de Entrega</label>
                    <p className="text-gray-900">{presupuesto.tiempoEntrega}</p>
                  </div>
                )}
                {presupuesto.condicionesPago && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Condiciones de Pago</label>
                    <p className="text-gray-900">{presupuesto.condicionesPago}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Descripción de la obra */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción de la Obra</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900">{presupuesto.descripcionObra}</p>
              {presupuesto.observaciones && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Observaciones</h4>
                  <p className="text-gray-700">{presupuesto.observaciones}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items del presupuesto */}
          <Card>
            <CardHeader>
              <CardTitle>Items del Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Descripción</TableHeaderCell>
                    <TableHeaderCell className="text-center">Cantidad</TableHeaderCell>
                    <TableHeaderCell className="text-center">Unidad</TableHeaderCell>
                    <TableHeaderCell className="text-right">Precio Unit.</TableHeaderCell>
                    <TableHeaderCell className="text-center">Desc. %</TableHeaderCell>
                    <TableHeaderCell className="text-right">Total</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presupuesto.items?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{item.descripcion}</div>
                          {item.detalle && (
                            <div className="text-sm text-gray-500">{item.detalle}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.cantidad?.toString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.unidad}
                      </TableCell>
                      <TableCell className="text-right">
                        {CurrencyUtils.formatAmount(
                          typeof item.precioUnitario === "number"
                            ? item.precioUnitario
                            : Number(item.precioUnitario),
                          presupuesto.moneda
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {(typeof item.descuento === "number"
                          ? item.descuento
                          : Number(item.descuento || 0))}%
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {CurrencyUtils.formatAmount(
                          typeof item.total === "number"
                            ? item.total
                            : Number(item.total),
                          presupuesto.moneda
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Totales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HiOutlineCash className="h-5 w-5 mr-2" />
                Resumen de Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      {CurrencyUtils.formatAmount(presupuesto.subtotal, presupuesto.moneda)}
                    </span>
                  </div>
                  
                  {presupuesto.descuento > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Descuento ({presupuesto.descuento}%):</span>
                      <span className="font-medium">
                        -{CurrencyUtils.formatAmount(
                          (presupuesto.subtotal * presupuesto.descuento) / 100, 
                          presupuesto.moneda
                        )}
                      </span>
                    </div>
                  )}
                  
                  {presupuesto.impuestos > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Impuestos ({presupuesto.impuestos}%):</span>
                      <span className="font-medium">
                        {CurrencyUtils.formatAmount(
                          ((presupuesto.subtotal - (presupuesto.subtotal * presupuesto.descuento) / 100) * presupuesto.impuestos) / 100,
                          presupuesto.moneda
                        )}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3 flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">
                      {CurrencyUtils.formatAmount(presupuesto.total, presupuesto.moneda)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <label className="font-medium text-gray-500">Creado por</label>
                  <p className="text-gray-900">{presupuesto.user.name}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Fecha de creación</label>
                  <p className="text-gray-900">{DateUtils.formatDateTime(presupuesto.createdAt)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Última modificación</label>
                  <p className="text-gray-900">{DateUtils.formatDateTime(presupuesto.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pestaña de Gastos */}
      {activeTab === 'gastos' && (
        <GastosPresupuestoComponent
          presupuestoId={id}
          totalPresupuesto={presupuesto.total}
          monedaPresupuesto={presupuesto.moneda}
          showActions={true}
          compact={false}
        />
      )}

      {/* Pestaña de Análisis */}
      {activeTab === 'analisis' && (
        <AnalisisMargenComponent
          presupuestoId={id}
          showDetailed={true}
        />
      )}
    </div>
  );
}