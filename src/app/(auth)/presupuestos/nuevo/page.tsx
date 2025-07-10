// src/app/(auth)/presupuestos/nuevo/page.tsx - ACTUALIZADO CON NÚMERO MANUAL
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClients } from '@/hooks/use-clients';
import { usePresupuestos } from '@/hooks/use-presupuestos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PresupuestoFormData, ItemPresupuestoFormData, presupuestoSchema } from '@/lib/validations/presupuesto';
import { CurrencyUtils, CalculationUtils } from '@/lib/utils/calculations';
import {
  HiOutlineArrowLeft,
  HiOutlineExclamationCircle,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineCalculator,
  HiOutlineRefresh
} from 'react-icons/hi';

export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const { clients } = useClients();
  const { createPresupuesto } = usePresupuestos();

  const [formData, setFormData] = useState<PresupuestoFormData>({
    numero: '', // NUEVO: Campo para número manual
    clienteId: '',
    fechaValidez: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    descripcionObra: '',
    observaciones: '',
    condicionesPago: '',
    tiempoEntrega: '',
    validezDias: 30,
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
  const [numeroSugerido, setNumeroSugerido] = useState('');
  const [generandoNumero, setGenerandoNumero] = useState(false);

  // Calcular totales
  const totales = CalculationUtils.calculateOrderTotals(
    formData.items,
    formData.descuento,
    formData.impuestos
  );

  // Función para generar número sugerido
  const generarNumeroSugerido = async () => {
    setGenerandoNumero(true);
    try {
      const response = await fetch('/api/presupuestos/generar-numero', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setNumeroSugerido(data.numero);
        
        // Si el campo está vacío, usar el número sugerido
        if (!formData.numero) {
          setFormData(prev => ({ ...prev, numero: data.numero }));
        }
      }
    } catch (error) {
      console.error('Error generando número:', error);
    } finally {
      setGenerandoNumero(false);
    }
  };

  // Generar número sugerido al cargar la página
  useEffect(() => {
    generarNumeroSugerido();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Calcular fecha de validez basada en días
      const fechaValidez = new Date();
      fechaValidez.setDate(fechaValidez.getDate() + formData.validezDias);
      
      const dataToSubmit = {
        ...formData,
        fechaValidez,
        // Si no hay número, enviarlo como undefined para que se genere automáticamente
        numero: formData.numero?.trim() || undefined
      };

      const validatedData = presupuestoSchema.parse(dataToSubmit);
      const newPresupuesto = await createPresupuesto(validatedData);
      router.push(`/presupuestos/${newPresupuesto.id}`);
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
        setErrors({ general: error.message || 'Error al crear presupuesto' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof PresupuestoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
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
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index: number, field: keyof ItemPresupuestoFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const usarNumeroSugerido = () => {
    setFormData(prev => ({ ...prev, numero: numeroSugerido }));
    if (errors.numero) {
      setErrors(prev => ({ ...prev, numero: '' }));
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Presupuesto</h1>
            <p className="text-gray-600">Crea un nuevo presupuesto para un cliente</p>
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
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* NUEVO: Campo para número de presupuesto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Número de Presupuesto
                  </label>
                  <div className="flex items-center space-x-2">
                    {numeroSugerido && numeroSugerido !== formData.numero && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={usarNumeroSugerido}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Usar: {numeroSugerido}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generarNumeroSugerido}
                      disabled={generandoNumero}
                      className="text-xs"
                    >
                      {generandoNumero ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                      ) : (
                        <HiOutlineRefresh className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <Input
                  value={formData.numero || ''}
                  onChange={(e) => handleChange('numero', e.target.value)}
                  error={errors.numero}
                  placeholder="Ej: PRES-2025-001 (opcional, se genera automáticamente)"
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">
                  Deja vacío para generar automáticamente
                </p>
              </div>

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Validez (días)"
                  type="number"
                  value={formData.validezDias}
                  onChange={(e) => handleChange('validezDias', Number(e.target.value))}
                  error={errors.validezDias}
                  min="1"
                  max="365"
                />
                <Select
                  label="Moneda"
                  value={formData.moneda}
                  onChange={(e) => handleChange('moneda', e.target.value)}
                >
                  <option value="PESOS">Pesos Argentinos</option>
                  <option value="DOLARES">Dólares</option>
                </Select>
              </div>
            </div>

            <Input
              label="Descripción de la Obra *"
              value={formData.descripcionObra}
              onChange={(e) => handleChange('descripcionObra', e.target.value)}
              error={errors.descripcionObra}
              placeholder="Describe el trabajo a presupuestar..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tiempo de Entrega"
                value={formData.tiempoEntrega}
                onChange={(e) => handleChange('tiempoEntrega', e.target.value)}
                placeholder="ej: 15 días hábiles"
              />

              <Input
                label="Condiciones de Pago"
                value={formData.condicionesPago}
                onChange={(e) => handleChange('condicionesPago', e.target.value)}
                placeholder="ej: 50% anticipo, 50% contra entrega"
              />
            </div>
          </CardContent>
        </Card>

        {/* Items del presupuesto */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <HiOutlineDocumentText className="h-5 w-5 mr-2" />
                Items del Presupuesto
              </CardTitle>
              <Button type="button" variant="outline" onClick={addItem}>
                <HiOutlinePlus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Item #{index + 1}</h4>
                  {formData.items.length > 1 && (
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

        {/* Totales y configuración final */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineCalculator className="h-5 w-5 mr-2" />
              Totales y Configuración
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
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Observaciones adicionales del presupuesto..."
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">Resumen de Totales</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{CurrencyUtils.formatAmount(totales.subtotal, formData.moneda)}</span>
                  </div>
                  {formData.descuento > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento ({formData.descuento}%):</span>
                      <span>-{CurrencyUtils.formatAmount(totales.descuentoTotal, formData.moneda)}</span>
                    </div>
                  )}
                  {formData.impuestos > 0 && (
                    <div className="flex justify-between">
                      <span>Impuestos ({formData.impuestos}%):</span>
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
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => router.back()} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Crear Presupuesto
          </Button>
        </div>
      </form>
    </div>
  );
}