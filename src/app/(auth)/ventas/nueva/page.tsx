// src/app/(auth)/ventas/nueva/page.tsx - ACTUALIZADO CON ITEMS
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClients } from '@/hooks/use-clients';
import { usePresupuestos } from '@/hooks/use-presupuestos';
import { useVentas } from '@/hooks/use-ventas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { VentaFormData, ItemVentaFormData, ventaSchema } from '@/lib/validations/venta';
import { CurrencyUtils, CalculationUtils } from '@/lib/utils/calculations';
import {
  HiOutlineArrowLeft,
  HiOutlineExclamationCircle,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCalculator
} from 'react-icons/hi';

export default function NuevaVentaPage() {
  const router = useRouter();
  const { clients } = useClients();
  const { presupuestos } = usePresupuestos({ estado: 'APROBADO' });
  const { createVenta } = useVentas();

  const [formData, setFormData] = useState<VentaFormData>({
    clienteId: '',
    presupuestoId: '',
    fechaEntrega: new Date(),
    prioridad: 'NORMAL',
    descripcionObra: '',
    observaciones: '',
    condicionesPago: '',
    lugarEntrega: '',
    descuento: 0,
    impuestos: 21,
    moneda: 'PESOS',
    items: [{
      descripcion: '',
      detalle: '',
      cantidad: 1,
      unidad: 'unidad',
      precioUnitario: 0,
      descuento: 0
    }]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<any>(null);
  const [ventaDirecta, setVentaDirecta] = useState(true); // Por defecto venta directa

  // Calcular totales basado en items o presupuesto
  const totales = selectedPresupuesto 
    ? {
        subtotal: Number(selectedPresupuesto.subtotal),
        descuentoTotal: Number(selectedPresupuesto.descuento) || 0,
        impuestos: Number(selectedPresupuesto.impuestos) || 0,
        total: Number(selectedPresupuesto.total)
      }
    : CalculationUtils.calculateOrderTotals(
        formData.items || [],
        formData.descuento,
        formData.impuestos
      );

  // Cuando se selecciona un presupuesto
  useEffect(() => {
    if (formData.presupuestoId) {
      const presupuesto = presupuestos.find(p => p.id === formData.presupuestoId);
      if (presupuesto) {
        setSelectedPresupuesto(presupuesto);
        setVentaDirecta(false);
        setFormData(prev => ({
          ...prev,
          clienteId: presupuesto.cliente.id,
          descripcionObra: presupuesto.descripcionObra || '',
          moneda: presupuesto.moneda as 'PESOS' | 'DOLARES',
          descuento: Number(presupuesto.descuento) || 0,
          impuestos: Number(presupuesto.impuestos) || 0
        }));
      }
    } else {
      setSelectedPresupuesto(null);
      setVentaDirecta(true);
    }
  }, [formData.presupuestoId, presupuestos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const dataToSubmit = {
        ...formData,
        // Si es venta directa, incluir items. Si es desde presupuesto, no incluir items
        items: ventaDirecta ? formData.items : undefined
      };

      const validatedData = ventaSchema.parse(dataToSubmit);
      const newVenta = await createVenta(validatedData);
      router.push(`/ventas/${newVenta.id}`);
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
        setErrors({ general: error.message || 'Error al crear venta' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof VentaFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), {
        descripcion: '',
        detalle: '',
        cantidad: 1,
        unidad: 'unidad',
        precioUnitario: 0,
        descuento: 0
      }]
    }));
  };

  const removeItem = (index: number) => {
    if ((formData.items?.length || 0) > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items?.filter((_, i) => i !== index) || []
      }));
    }
  };

  const updateItem = (index: number, field: keyof ItemVentaFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map((item, i) => i === index ? { ...item, [field]: value } : item) || []
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Venta</h1>
            <p className="text-gray-600">Crea una nueva venta o pedido</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <HiOutlineExclamationCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{errors.general}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineUsers className="h-5 w-5 mr-2" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Presupuesto Origen (Opcional)"
                value={formData.presupuestoId}
                onChange={(e) => handleChange('presupuestoId', e.target.value)}
                error={errors.presupuestoId}
              >
                <option value="">Venta directa (sin presupuesto)</option>
                {presupuestos.map(presupuesto => (
                  <option key={presupuesto.id} value={presupuesto.id}>
                    {presupuesto.numero} - {presupuesto.cliente.nombre}
                  </option>
                ))}
              </Select>

              <Select
                label="Cliente *"
                value={formData.clienteId}
                onChange={(e) => handleChange('clienteId', e.target.value)}
                error={errors.clienteId}
                disabled={!!selectedPresupuesto}
              >
                <option value="">Seleccionar cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nombre}
                  </option>
                ))}
              </Select>
            </div>

            {selectedPresupuesto && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Datos del Presupuesto: {selectedPresupuesto.numero}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Total:</span>
                    <p className="text-blue-900">
                      {CurrencyUtils.formatAmount(selectedPresupuesto.total, selectedPresupuesto.moneda)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Fecha Emisión:</span>
                    <p className="text-blue-900">
                      {new Date(selectedPresupuesto.fechaEmision).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Items:</span>
                    <p className="text-blue-900">{selectedPresupuesto.items?.length || 0} items</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items de la venta (solo para venta directa) */}
        {ventaDirecta && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <HiOutlineDocumentText className="h-5 w-5 mr-2" />
                  Items de la Venta
                </CardTitle>
                <Button type="button" variant="outline" onClick={addItem}>
                  <HiOutlinePlus className="h-4 w-4 mr-2" />
                  Agregar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(formData.items || []).map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Item #{index + 1}</h4>
                    {(formData.items?.length || 0) > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
                    <div className="md:col-span-2">
                      <Input
                        label="Descripción *"
                        value={item.descripcion}
                        onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                        placeholder="Descripción del item"
                      />
                    </div>

                    <Input
                      label="Cantidad"
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => updateItem(index, 'cantidad', Number(e.target.value))}
                      min="0.001"
                      step="0.001"
                    />

                    <Input
                      label="Unidad"
                      value={item.unidad}
                      onChange={(e) => updateItem(index, 'unidad', e.target.value)}
                      placeholder="m2, metro, unidad"
                    />

                    <Input
                      label="Precio Unit."
                      type="number"
                      value={item.precioUnitario}
                      onChange={(e) => updateItem(index, 'precioUnitario', Number(e.target.value))}
                      min="0"
                      step="0.01"
                    />

                    <Input
                      label="Desc. %"
                      type="number"
                      value={item.descuento}
                      onChange={(e) => updateItem(index, 'descuento', Number(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>

                  <Input
                    label="Detalle"
                    value={item.detalle}
                    onChange={(e) => updateItem(index, 'detalle', e.target.value)}
                    placeholder="Información adicional del item"
                  />

                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">
                        Total: {CurrencyUtils.formatAmount(
                          CalculationUtils.calculateItemTotal(item.cantidad, item.precioUnitario, item.descuento),
                          formData.moneda
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Detalles del pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineDocumentText className="h-5 w-5 mr-2" />
              Detalles del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Prioridad"
                value={formData.prioridad}
                onChange={(e) => handleChange('prioridad', e.target.value)}
              >
                <option value="BAJA">Baja</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </Select>

              <Select
                label="Moneda"
                value={formData.moneda}
                onChange={(e) => handleChange('moneda', e.target.value)}
                disabled={!!selectedPresupuesto}
              >
                <option value="PESOS">Pesos Argentinos</option>
                <option value="DOLARES">Dólares</option>
              </Select>
            </div>

            <Input
              label="Descripción de la Obra *"
              value={formData.descripcionObra}
              onChange={(e) => handleChange('descripcionObra', e.target.value)}
              error={errors.descripcionObra}
              placeholder="Describe el trabajo a realizar..."
              disabled={!!selectedPresupuesto}
            />

            <Input
              label="Lugar de Entrega"
              value={formData.lugarEntrega}
              onChange={(e) => handleChange('lugarEntrega', e.target.value)}
              error={errors.lugarEntrega}
              placeholder="Dirección donde se entregará"
            />
          </CardContent>
        </Card>

        {/* Fechas y condiciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineCalendar className="h-5 w-5 mr-2" />
              Fechas y Condiciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha de Entrega"
                type="date"
                value={formData.fechaEntrega ? formData.fechaEntrega.toISOString().split('T')[0] : ''}
                onChange={(e) => handleChange('fechaEntrega', new Date(e.target.value))}
                error={errors.fechaEntrega}
              />

              {ventaDirecta && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Descuento (%)"
                    type="number"
                    value={formData.descuento}
                    onChange={(e) => handleChange('descuento', Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                  <Input
                    label="Impuestos (%)"
                    type="number"
                    value={formData.impuestos}
                    onChange={(e) => handleChange('impuestos', Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
              )}
            </div>

            <Input
              label="Condiciones de Pago"
              value={formData.condicionesPago}
              onChange={(e) => handleChange('condicionesPago', e.target.value)}
              placeholder="ej: 50% anticipo, 50% contra entrega"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleChange('observaciones', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Observaciones adicionales del pedido..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Totales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineCalculator className="h-5 w-5 mr-2" />
              Resumen de Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">Totales de la Venta</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{CurrencyUtils.formatAmount(totales.subtotal, formData.moneda)}</span>
                </div>
                {totales.descuentoTotal > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento:</span>
                    <span>-{CurrencyUtils.formatAmount(totales.descuentoTotal, formData.moneda)}</span>
                  </div>
                )}
                {totales.impuestos > 0 && (
                  <div className="flex justify-between">
                    <span>Impuestos:</span>
                    <span>{CurrencyUtils.formatAmount(totales.impuestos, formData.moneda)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-blue-600">
                    {CurrencyUtils.formatAmount(totales.total, formData.moneda)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => router.back()} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Crear Venta
          </Button>
        </div>
      </form>
    </div>
  );
}