// src/components/balance/QuickActions.tsx - COMPONENTE DE ACCIONES RÁPIDAS
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useMediosPago } from '@/hooks/use-medios-pago';
import { useTransacciones } from '@/hooks/use-transacciones';
import { CurrencyUtils } from '@/lib/utils/calculations';
import {
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineChatAlt
} from 'react-icons/hi';

interface QuickActionsProps {
  onActionComplete?: () => void;
}

export function QuickActions({ onActionComplete }: QuickActionsProps) {
  const [showForm, setShowForm] = useState<'ingreso' | 'egreso' | 'transferencia' | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    concepto: '',
    monto: '',
    medioPagoId: '',
    descripcion: ''
  });

  const { mediosPago } = useMediosPago();
  const { createTransaccion } = useTransacciones();

  const handleSubmit = async (tipo: 'INGRESO' | 'EGRESO') => {
    if (!formData.concepto || !formData.monto || !formData.medioPagoId) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      
      await createTransaccion({
        tipo,
        concepto: formData.concepto,
        descripcion: formData.descripcion || undefined,
        monto: parseFloat(formData.monto),
        moneda: 'PESOS',
        fecha: new Date(),
        medioPagoId: formData.medioPagoId
      });

      // Limpiar formulario
      setFormData({
        concepto: '',
        monto: '',
        medioPagoId: '',
        descripcion: ''
      });
      setShowForm(null);
      
      // Notificar que se completó la acción
      onActionComplete?.();
      
      alert('Transacción registrada exitosamente');
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      alert(error.message || 'Error al registrar transacción');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      concepto: '',
      monto: '',
      medioPagoId: '',
      descripcion: ''
    });
    setShowForm(null);
  };

  if (showForm) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              {showForm === 'ingreso' ? (
                <>
                  <HiOutlineArrowUp className="h-5 w-5 mr-2 text-green-600" />
                  Registrar Ingreso
                </>
              ) : showForm === 'egreso' ? (
                <>
                  <HiOutlineArrowDown className="h-5 w-5 mr-2 text-red-600" />
                  Registrar Egreso
                </>
              ) : (
                <>
                  <HiOutlineChatAlt className="h-5 w-5 mr-2 text-blue-600" />
                  Transferencia
                </>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={resetForm}>
              <HiOutlineX className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Concepto *
            </label>
            <Input
              value={formData.concepto}
              onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
              placeholder="Ej: Venta de producto, Pago de proveedor..."
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.monto}
                onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medio de Pago *
              </label>
              <Select
                value={formData.medioPagoId}
                onChange={(e) => setFormData(prev => ({ ...prev, medioPagoId: e.target.value }))}
                disabled={loading}
              >
                <option value="">Seleccionar...</option>
                {mediosPago.map((medio) => (
                  <option key={medio.id} value={medio.id}>
                    {medio.nombre}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <Input
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Detalles adicionales..."
              disabled={loading}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => handleSubmit(showForm === 'ingreso' ? 'INGRESO' : 'EGRESO')}
              disabled={loading || !formData.concepto || !formData.monto || !formData.medioPagoId}
              className={showForm === 'ingreso' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <HiOutlineCheck className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Guardando...' : 'Registrar'}
            </Button>
            <Button variant="outline" onClick={resetForm} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={() => setShowForm('ingreso')}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <HiOutlineArrowUp className="h-5 w-5 mr-2" />
            Nuevo Ingreso
          </Button>
          
          <Button
            onClick={() => setShowForm('egreso')}
            className="bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            <HiOutlineArrowDown className="h-5 w-5 mr-2" />
            Nuevo Egreso
          </Button>

          <Button
            onClick={() => window.open('/finanzas/transacciones', '_blank')}
            variant="outline"
            size="lg"
          >
            <HiOutlineChatAlt className="h-5 w-5 mr-2" />
            Ver Transacciones
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de resumen financiero simple
export function FinancialSummary({ 
  totalEfectivo, 
  totalBanco, 
  totalOtros, 
  balanceTotal 
}: {
  totalEfectivo: number;
  totalBanco: number;
  totalOtros: number;
  balanceTotal: number;
}) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-green-50">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            💰 Dinero Disponible Total
          </h3>
          <div className="text-3xl font-bold text-blue-600">
            {CurrencyUtils.formatAmount(balanceTotal)}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white bg-opacity-60 rounded-lg p-3">
            <div className="text-green-600 font-bold">
              {CurrencyUtils.formatAmount(totalEfectivo)}
            </div>
            <div className="text-xs text-gray-600">Efectivo</div>
          </div>
          <div className="bg-white bg-opacity-60 rounded-lg p-3">
            <div className="text-blue-600 font-bold">
              {CurrencyUtils.formatAmount(totalBanco)}
            </div>
            <div className="text-xs text-gray-600">Banco</div>
          </div>
          <div className="bg-white bg-opacity-60 rounded-lg p-3">
            <div className="text-purple-600 font-bold">
              {CurrencyUtils.formatAmount(totalOtros)}
            </div>
            <div className="text-xs text-gray-600">Otros</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}