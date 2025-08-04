// src/components/ventas/MediosPagoSelector.tsx - VERSIÓN CORREGIDA
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useMediosPago } from '@/hooks/use-medios-pago'; // CORREGIDO: usar el hook principal
import { CurrencyUtils } from '@/lib/utils/calculations';
import {
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle
} from 'react-icons/hi';

interface MedioPagoVentaData {
  medioPagoId: string;
  montoAnticipo: number;
  registrarAnticipo: boolean;
  tipoComprobante: string;
  numeroComprobante: string;
  observaciones: string;
}

interface MediosPagoSelectorProps {
  data: MedioPagoVentaData;
  onChange: (data: MedioPagoVentaData) => void;
  totalVenta: number;
  moneda: 'PESOS' | 'DOLARES';
  disabled?: boolean;
  error?: string;
}

const TIPOS_COMPROBANTE = [
  'Recibo',
  'Factura A',
  'Factura B',
  'Factura C',
  'Transferencia',
  'Comprobante Digital',
  'Otro'
];

export function MediosPagoSelector({
  data,
  onChange,
  totalVenta,
  moneda,
  disabled = false,
  error
}: MediosPagoSelectorProps) {
  // CORREGIDO: usar el hook principal y filtrar activos localmente
  const { mediosPago, loading: loadingMedios, error: errorMedios } = useMediosPago();
  const [showAnticipoDetails, setShowAnticipoDetails] = useState(data.registrarAnticipo);

  // Filtrar solo medios activos
  const mediosActivos = mediosPago.filter(medio => medio.activo);

  // Actualizar la visibilidad de detalles cuando cambia registrarAnticipo
  useEffect(() => {
    setShowAnticipoDetails(data.registrarAnticipo);
  }, [data.registrarAnticipo]);

  const handleChange = (field: keyof MedioPagoVentaData, value: any) => {
    const newData = { ...data, [field]: value };
    
    // Si se deshabilita el anticipo, limpiar campos relacionados
    if (field === 'registrarAnticipo' && !value) {
      newData.montoAnticipo = 0;
      newData.tipoComprobante = '';
      newData.numeroComprobante = '';
      newData.observaciones = '';
    }
    
    // Si se habilita el anticipo pero no hay monto, sugerir 30% del total
    if (field === 'registrarAnticipo' && value && newData.montoAnticipo === 0) {
      newData.montoAnticipo = totalVenta * 0.3;
    }
    
    onChange(newData);
  };

  const porcentajeAnticipo = totalVenta > 0 ? (data.montoAnticipo / totalVenta) * 100 : 0;

  if (loadingMedios) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando medios de pago...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errorMedios || mediosActivos.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-center">
            <HiOutlineExclamationCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {errorMedios || 'No hay medios de pago configurados'}
              </p>
              <p className="text-xs text-yellow-700">
                Los medios de pago son necesarios para registrar anticipos. 
                Contacte al administrador para configurarlos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <HiOutlineCreditCard className="h-5 w-5 mr-2" />
          Medio de Pago y Anticipo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <HiOutlineExclamationCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Selección de medio de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medio de Pago Preferido
          </label>
          <select
            value={data.medioPagoId}
            onChange={(e) => handleChange('medioPagoId', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">Seleccionar medio de pago</option>
            {mediosActivos.map(medio => (
              <option key={medio.id} value={medio.id}>
                {medio.nombre}
                {medio.descripcion && ` - ${medio.descripcion}`}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Este será el medio de pago sugerido para futuros cobros de esta venta
          </p>
        </div>

        {/* Opción de registrar anticipo */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.registrarAnticipo}
                onChange={(e) => handleChange('registrarAnticipo', e.target.checked)}
                disabled={disabled || !data.medioPagoId}
                className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Registrar anticipo al crear la venta
              </span>
            </label>
            
            {data.registrarAnticipo && (
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <HiOutlineInformationCircle className="h-3 w-3 inline mr-1" />
                Se registrará automáticamente
              </div>
            )}
          </div>

          {!data.medioPagoId && (
            <p className="text-xs text-gray-500 mb-4">
              Seleccione un medio de pago para habilitar la opción de anticipo
            </p>
          )}

          {/* Detalles del anticipo */}
          {showAnticipoDetails && data.medioPagoId && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <HiOutlineCash className="h-4 w-4 mr-2" />
                Detalles del Anticipo
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Monto del Anticipo *"
                    type="number"
                    value={data.montoAnticipo}
                    onChange={(e) => handleChange('montoAnticipo', Number(e.target.value))}
                    min="0.01"
                    max={totalVenta}
                    step="0.01"
                    disabled={disabled}
                  />
                  {data.montoAnticipo > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {porcentajeAnticipo.toFixed(1)}% del total de la venta
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Comprobante
                  </label>
                  <select
                    value={data.tipoComprobante}
                    onChange={(e) => handleChange('tipoComprobante', e.target.value)}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar tipo</option>
                    {TIPOS_COMPROBANTE.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Número de Comprobante"
                  value={data.numeroComprobante}
                  onChange={(e) => handleChange('numeroComprobante', e.target.value)}
                  placeholder="Ej: REC-001, FC-A-123"
                  disabled={disabled}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vista Previa
                  </label>
                  <div className="text-sm bg-white p-3 rounded border">
                    <div className="font-medium text-green-600">
                      +{CurrencyUtils.formatAmount(data.montoAnticipo, moneda)}
                    </div>
                    <div className="text-gray-600">
                      {mediosActivos.find(m => m.id === data.medioPagoId)?.nombre || 'Medio no seleccionado'}
                    </div>
                    <div className="text-gray-500 text-xs">
                      Saldo restante: {CurrencyUtils.formatAmount(totalVenta - data.montoAnticipo, moneda)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones del Anticipo
                </label>
                <textarea
                  value={data.observaciones}
                  onChange={(e) => handleChange('observaciones', e.target.value)}
                  rows={3}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Información adicional sobre el anticipo..."
                />
              </div>

              {/* Botones de sugerencias rápidas */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-xs text-gray-500 mr-2">Sugerencias rápidas:</span>
                {[0.3, 0.5, 0.7].map(percentage => (
                  <Button
                    key={percentage}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChange('montoAnticipo', totalVenta * percentage)}
                    disabled={disabled}
                    className="text-xs py-1 px-2 h-6"
                  >
                    {(percentage * 100)}% ({CurrencyUtils.formatAmount(totalVenta * percentage, moneda)})
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resumen final */}
        {data.registrarAnticipo && data.montoAnticipo > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Resumen del Anticipo</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Anticipo:</span>
                <p className="font-bold text-blue-900">{CurrencyUtils.formatAmount(data.montoAnticipo, moneda)}</p>
              </div>
              <div>
                <span className="text-blue-700">Saldo restante:</span>
                <p className="font-bold text-blue-900">{CurrencyUtils.formatAmount(totalVenta - data.montoAnticipo, moneda)}</p>
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              ℹ️ El anticipo se registrará automáticamente al crear la venta
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}