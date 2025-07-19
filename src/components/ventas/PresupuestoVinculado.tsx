// src/components/ventas/PresupuestoVinculado.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import {
  HiOutlineDocumentText,
  HiOutlineEye,
  HiOutlineExternalLink,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineCash,
  HiOutlineClipboard,
  HiOutlineCheckCircle
} from 'react-icons/hi';

interface PresupuestoInfo {
  id: string;
  numero: string;
  fechaEmision: string;
  fechaValidez: string;
  descripcionObra: string;
  observaciones?: string;
  condicionesPago?: string;
  tiempoEntrega?: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  moneda: string;
  cliente: {
    id: string;
    nombre: string;
    email?: string;
    telefono?: string;
  };
  user: {
    id: string;
    name: string;
  };
  items?: Array<{
    id: string;
    descripcion: string;
    detalle?: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
    descuento: number;
    total: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface PresupuestoVinculadoProps {
  presupuesto: PresupuestoInfo;
  showFullDetails?: boolean;
  className?: string;
}

export function PresupuestoVinculado({ 
  presupuesto, 
  showFullDetails = false, 
  className = "" 
}: PresupuestoVinculadoProps) {
  const [showModal, setShowModal] = useState(false);
  const [showItems, setShowItems] = useState(false);

  const diasDesdeEmision = Math.floor(
    (new Date().getTime() - new Date(presupuesto.fechaEmision).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (showFullDetails) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <HiOutlineDocumentText className="h-5 w-5 mr-2 text-blue-600" />
              Presupuesto Vinculado
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModal(true)}
              >
                <HiOutlineEye className="h-4 w-4 mr-2" />
                Detalles
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/presupuestos/${presupuesto.id}`, '_blank')}
              >
                <HiOutlineExternalLink className="h-4 w-4 mr-2" />
                Abrir
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <HiOutlineClipboard className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-700">Número</span>
              </div>
              <p className="text-lg font-bold text-blue-900">{presupuesto.numero}</p>
              <p className="text-xs text-blue-600">
                Creado hace {diasDesdeEmision} días
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <HiOutlineCash className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-700">Total</span>
              </div>
              <p className="text-lg font-bold text-green-900">
                {CurrencyUtils.formatAmount(presupuesto.total, presupuesto.moneda as any)}
              </p>
              <p className="text-xs text-green-600">
                {presupuesto.items?.length || 0} items
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <HiOutlineCalendar className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-700">Emisión</span>
              </div>
              <p className="text-sm font-bold text-purple-900">
                {DateUtils.formatDate(presupuesto.fechaEmision)}
              </p>
              <p className="text-xs text-purple-600">
                Válido hasta {DateUtils.formatDate(presupuesto.fechaValidez)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <HiOutlineUser className="h-4 w-4 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Creado por</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{presupuesto.user.name}</p>
              <p className="text-xs text-gray-600">
                <HiOutlineCheckCircle className="h-3 w-3 inline mr-1" />
                Convertido exitosamente
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Descripción de la Obra</h4>
            <p className="text-gray-700 text-sm">{presupuesto.descripcionObra}</p>
          </div>

          {presupuesto.items && presupuesto.items.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-900">Items del Presupuesto</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowItems(!showItems)}
                >
                  {showItems ? 'Ocultar' : 'Mostrar'} ({presupuesto.items.length})
                </Button>
              </div>
              
              {showItems && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Descripción
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Cantidad
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Precio Unit.
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {presupuesto.items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-4 py-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.descripcion}
                              </div>
                              {item.detalle && (
                                <div className="text-xs text-gray-500">{item.detalle}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.cantidad} {item.unidad}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {CurrencyUtils.formatAmount(item.precioUnitario, presupuesto.moneda as any)}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {CurrencyUtils.formatAmount(item.total, presupuesto.moneda as any)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* Modal con detalles completos */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`Presupuesto ${presupuesto.numero}`}
          size="xl"
        >
          <div className="space-y-6">
            {/* Información del cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Información del Cliente</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">{presupuesto.cliente.nombre}</p>
                  {presupuesto.cliente.email && (
                    <p className="text-sm text-gray-600">{presupuesto.cliente.email}</p>
                  )}
                  {presupuesto.cliente.telefono && (
                    <p className="text-sm text-gray-600">{presupuesto.cliente.telefono}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Fechas Importantes</h4>
                <div className="bg-gray-50 p-3 rounded space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Emisión:</span>
                    <span>{DateUtils.formatDate(presupuesto.fechaEmision)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Validez:</span>
                    <span>{DateUtils.formatDate(presupuesto.fechaValidez)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Creado:</span>
                    <span>{DateUtils.formatDateTime(presupuesto.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Condiciones */}
            {(presupuesto.condicionesPago || presupuesto.tiempoEntrega) && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Condiciones</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {presupuesto.condicionesPago && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Condiciones de Pago:</span>
                      <p className="text-sm text-gray-900">{presupuesto.condicionesPago}</p>
                    </div>
                  )}
                  {presupuesto.tiempoEntrega && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Tiempo de Entrega:</span>
                      <p className="text-sm text-gray-900">{presupuesto.tiempoEntrega}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Observaciones */}
            {presupuesto.observaciones && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Observaciones</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-700">{presupuesto.observaciones}</p>
                </div>
              </div>
            )}

            {/* Totales */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Totales</h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{CurrencyUtils.formatAmount(presupuesto.subtotal, presupuesto.moneda as any)}</span>
                  </div>
                  {presupuesto.descuento > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento:</span>
                      <span>-{CurrencyUtils.formatAmount(presupuesto.descuento, presupuesto.moneda as any)}</span>
                    </div>
                  )}
                  {presupuesto.impuestos > 0 && (
                    <div className="flex justify-between">
                      <span>Impuestos:</span>
                      <span>{CurrencyUtils.formatAmount(presupuesto.impuestos, presupuesto.moneda as any)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-blue-600">
                      {CurrencyUtils.formatAmount(presupuesto.total, presupuesto.moneda as any)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </Card>
    );
  }

  // Versión compacta
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <HiOutlineDocumentText className="h-4 w-4 text-blue-600 mr-2" />
          <div>
            <span className="text-sm font-medium text-blue-900">
              Originado desde: {presupuesto.numero}
            </span>
            <p className="text-xs text-blue-600">
              {DateUtils.formatDate(presupuesto.fechaEmision)} • {CurrencyUtils.formatAmount(presupuesto.total, presupuesto.moneda as any)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`/presupuestos/${presupuesto.id}`, '_blank')}
          className="text-blue-600 hover:text-blue-700"
        >
          <HiOutlineExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}