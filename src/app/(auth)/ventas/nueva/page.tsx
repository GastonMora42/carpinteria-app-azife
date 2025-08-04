// src/app/(auth)/ventas/nueva/page.tsx - ACTUALIZADO CON MEDIOS DE PAGO
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClients } from '@/hooks/use-clients';
import { useVentas } from '@/hooks/use-ventas';
import { useTransacciones } from '@/hooks/use-transacciones';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { MediosPagoSelector } from '@/components/ventas/MediosPagoSelector';
import { VentaFormData, ItemVentaFormData, ventaSchema } from '@/lib/validations/venta';
import { TransaccionFormData } from '@/lib/validations/transaccion';
import { CurrencyUtils, CalculationUtils, DateUtils } from '@/lib/utils/calculations';
import {
  HiOutlineArrowLeft,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCalculator,
  HiOutlineCreditCard
} from 'react-icons/hi';

// Tipo extendido para incluir información de medio de pago
interface VentaFormDataExtended extends VentaFormData {
  // Campos del medio de pago
  medioPagoId?: string;
  registrarAnticipo?: boolean;
  montoAnticipo?: number;
  tipoComprobanteAnticipo?: string;
  numeroComprobanteAnticipo?: string;
  observacionesAnticipo?: string;
}

// Tipo para datos del medio de pago
interface MedioPagoVentaData {
  medioPagoId: string;
  montoAnticipo: number;
  registrarAnticipo: boolean;
  tipoComprobante: string;
  numeroComprobante: string;
  observaciones: string;
}

export default function NuevaVentaPage() {
  const router = useRouter();
  const { clients } = useClients();
  const { createVenta } = useVentas();
  const { createTransaccion } = useTransacciones();

  const [formData, setFormData] = useState<VentaFormDataExtended>({
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

  // NUEVO: Estado para medios de pago
  const [mediosPagoData, setMediosPagoData] = useState<MedioPagoVentaData>({
    medioPagoId: '',
    montoAnticipo: 0,
    registrarAnticipo: false,
    tipoComprobante: '',
    numeroComprobante: '',
    observaciones: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcular totales
  const totales = CalculationUtils.calculateOrderTotals(
    formData.items || [],
    formData.descuento,
    formData.impuestos
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validaciones adicionales para anticipo
      if (mediosPagoData.registrarAnticipo) {
        if (!mediosPagoData.medioPagoId) {
          setErrors({ medioPago: 'Debe seleccionar un medio de pago para registrar anticipo' });
          return;
        }
        
        if (mediosPagoData.montoAnticipo <= 0) {
          setErrors({ anticipo: 'El monto del anticipo debe ser mayor a 0' });
          return;
        }
        
        if (mediosPagoData.montoAnticipo > totales.total) {
          setErrors({ anticipo: 'El anticipo no puede ser mayor al total de la venta' });
          return;
        }
      }

      console.log('📝 Creating venta with medio de pago:', {
        cliente: formData.clienteId,
        total: totales.total,
        medioPreferido: mediosPagoData.medioPagoId || 'ninguno',
        anticipo: mediosPagoData.registrarAnticipo ? mediosPagoData.montoAnticipo : 0
      });

      // 1. Crear la venta principal
      const validatedData = ventaSchema.parse(formData);
      const newVenta = await createVenta(validatedData);
      
      console.log('✅ Venta created:', newVenta.id);

      // 2. Si hay anticipo, registrarlo como transacción
      if (mediosPagoData.registrarAnticipo && mediosPagoData.montoAnticipo > 0) {
        console.log('💰 Registering anticipo transaction...');
        
        const anticipoData: TransaccionFormData = {
          tipo: 'ANTICIPO',
          concepto: `Anticipo obra ${newVenta.numero}`,
          descripcion: mediosPagoData.observaciones || `Anticipo registrado al crear la venta`,
          monto: mediosPagoData.montoAnticipo,
          moneda: formData.moneda,
          fecha: new Date(),
          numeroComprobante: mediosPagoData.numeroComprobante || undefined,
          tipoComprobante: mediosPagoData.tipoComprobante || undefined,
          clienteId: formData.clienteId,
          pedidoId: newVenta.id,
          medioPagoId: mediosPagoData.medioPagoId
        };

        await createTransaccion(anticipoData);
        
        console.log('✅ Anticipo registered successfully');
      }

      // 3. Redirigir a la venta creada
      router.push(`/ventas/${newVenta.id}`);
      
    } catch (error: any) {
      console.error('❌ Error creating venta:', error);
      
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path?.[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ 
          general: error.message || 'Error al crear venta'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof VentaFormDataExtended, value: any) => {
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
            <p className="text-gray-600">Crea una nueva venta directa con medio de pago</p>
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
            <Select
              label="Cliente *"
              value={formData.clienteId}
              onChange={(e) => handleChange('clienteId', e.target.value)}
              error={errors.clienteId}
            >
              <option value="">Seleccionar cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nombre}
                </option>
              ))}
            </Select>

            <Input
              label="Descripción de la Obra *"
              value={formData.descripcionObra}
              onChange={(e) => handleChange('descripcionObra', e.target.value)}
              error={errors.descripcionObra}
              placeholder="Describe el trabajo a realizar..."
            />
          </CardContent>
        </Card>

        {/* Fechas y configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineCalendar className="h-5 w-5 mr-2" />
              Fechas y Configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Fecha de Entrega"
                type="date"
                value={formData.fechaEntrega?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleChange('fechaEntrega', new Date(e.target.value))}
                min={new Date().toISOString().split('T')[0]}
              />

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
              >
                <option value="PESOS">Pesos Argentinos</option>
                <option value="DOLARES">Dólares</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Condiciones de Pago"
                value={formData.condicionesPago}
                onChange={(e) => handleChange('condicionesPago', e.target.value)}
                placeholder="ej: 50% anticipo, 50% contra entrega"
              />

              <Input
                label="Lugar de Entrega"
                value={formData.lugarEntrega}
                onChange={(e) => handleChange('lugarEntrega', e.target.value)}
                placeholder="Dirección de entrega"
              />
            </div>
          </CardContent>
        </Card>

        {/* Items de la venta */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Items de la Venta</CardTitle>
              <Button type="button" variant="outline" onClick={addItem}>
                <HiOutlinePlus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(formData.items || []).map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border">
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

        {/* NUEVO: Selector de medios de pago */}
        <MediosPagoSelector
          data={mediosPagoData}
          onChange={setMediosPagoData}
          totalVenta={totales.total}
          moneda={formData.moneda}
          disabled={isSubmitting}
          error={errors.medioPago || errors.anticipo}
        />

        {/* Totales y configuración final */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineCalculator className="h-5 w-5 mr-2" />
              Totales de la Venta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Descuento General (%)"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => handleChange('observaciones', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">Resumen Financiero</h4>
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
                  
                  {/* Resumen de anticipo */}
                  {mediosPagoData.registrarAnticipo && mediosPagoData.montoAnticipo > 0 && (
                    <>
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between text-green-600">
                          <span>Anticipo a registrar:</span>
                          <span>+{CurrencyUtils.formatAmount(mediosPagoData.montoAnticipo, formData.moneda)}</span>
                        </div>
                        <div className="flex justify-between font-medium text-red-600">
                          <span>Saldo pendiente:</span>
                          <span>{CurrencyUtils.formatAmount(totales.total - mediosPagoData.montoAnticipo, formData.moneda)}</span>
                        </div>
                      </div>
                    </>
                  )}
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
            <HiOutlineCheckCircle className="h-4 w-4 mr-2" />
            {mediosPagoData.registrarAnticipo ? 'Crear Venta y Registrar Anticipo' : 'Crear Venta'}
          </Button>
        </div>
      </form>
    </div>
  );
}