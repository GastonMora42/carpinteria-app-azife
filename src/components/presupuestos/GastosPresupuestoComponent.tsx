// src/components/gastos/GastosPresupuestoComponent.tsx - ACTUALIZADO CON MEDIO DE PAGO
'use client';

import { useState, useEffect } from 'react';
import { useGastosPresupuesto } from '@/hooks/use-gastos-presupuesto';
import { useMediosPago } from '@/hooks/use-medios-pago';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { GastoPresupuestoFormData, CATEGORIAS_GASTO_PRESUPUESTO } from '@/lib/validations/gasto-presupuesto';
import {
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineReceiptTax,
  HiOutlineCreditCard,
  HiOutlineClipboard
} from 'react-icons/hi';

interface GastoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GastoPresupuestoFormData) => Promise<void>;
  gasto?: any;
  presupuestoId: string;
}

function GastoForm({ isOpen, onClose, onSubmit, gasto, presupuestoId }: GastoFormProps) {
  const [formData, setFormData] = useState<GastoPresupuestoFormData>({
    presupuestoId,
    descripcion: '',
    categoria: 'MATERIALES',
    subcategoria: '',
    monto: 0,
    moneda: 'PESOS',
    fecha: new Date(),
    comprobante: '',
    proveedor: '',
    notas: '',
    medioPagoId: '' // NUEVO
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar medios de pago
  const { mediosPago, loading: loadingMedios } = useMediosPago();

  // Subcategorías por categoría
  const subcategoriasPorCategoria: Record<string, string[]> = {
    'MATERIALES': ['Aluminio', 'Vidrio', 'Herrajes', 'Selladores', 'Tornillería'],
    'MANO_OBRA': ['Fabricación', 'Instalación', 'Medición', 'Diseño'],
    'TRANSPORTE': ['Combustible', 'Flete', 'Peajes', 'Estacionamiento'],
    'HERRAMIENTAS': ['Alquiler', 'Compra', 'Reparación', 'Mantenimiento'],
    'SERVICIOS': ['Diseño', 'Consultoría', 'Subcontratistas', 'Certificaciones'],
    'OTROS': ['Gastos varios', 'Imprevistos', 'Contingencias']
  };

  useEffect(() => {
    if (gasto) {
      setFormData({
        presupuestoId: gasto.presupuestoId,
        descripcion: gasto.descripcion || '',
        categoria: gasto.categoria || 'MATERIALES',
        subcategoria: gasto.subcategoria || '',
        monto: gasto.monto || 0,
        moneda: gasto.moneda || 'PESOS',
        fecha: gasto.fecha ? new Date(gasto.fecha) : new Date(),
        comprobante: gasto.comprobante || '',
        proveedor: gasto.proveedor || '',
        notas: gasto.notas || '',
        medioPagoId: gasto.medioPago?.id || '' // NUEVO
      });
    } else if (isOpen) {
      // Reset form para nuevo gasto
      setFormData({
        presupuestoId,
        descripcion: '',
        categoria: 'MATERIALES',
        subcategoria: '',
        monto: 0,
        moneda: 'PESOS',
        fecha: new Date(),
        comprobante: '',
        proveedor: '',
        notas: '',
        medioPagoId: ''
      });
    }
    setErrors({});
  }, [gasto, isOpen, presupuestoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validaciones básicas
      if (!formData.descripcion?.trim()) {
        setErrors({ descripcion: 'La descripción es requerida' });
        return;
      }

      if (!formData.monto || formData.monto <= 0) {
        setErrors({ monto: 'El monto debe ser mayor a 0' });
        return;
      }

      if (!formData.medioPagoId) {
        setErrors({ medioPagoId: 'Debe seleccionar un medio de pago' });
        return;
      }

      await onSubmit(formData);
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message || 'Error al guardar gasto' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={gasto ? 'Editar Gasto' : 'Nuevo Gasto'}
      size="lg"
    >
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Descripción *"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Descripción del gasto"
              error={errors.descripcion}
              required
            />
          </div>

          <Select
            label="Categoría *"
            value={formData.categoria}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              categoria: e.target.value as any,
              subcategoria: '' // Reset subcategoría
            }))}
            error={errors.categoria}
            required
          >
            {Object.entries(CATEGORIAS_GASTO_PRESUPUESTO).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </Select>

          <Select
            label="Subcategoría"
            value={formData.subcategoria}
            onChange={(e) => setFormData(prev => ({ ...prev, subcategoria: e.target.value }))}
            disabled={!subcategoriasPorCategoria[formData.categoria]}
          >
            <option value="">Seleccionar subcategoría</option>
            {subcategoriasPorCategoria[formData.categoria]?.map(subcat => (
              <option key={subcat} value={subcat}>{subcat}</option>
            ))}
          </Select>

          <Input
            label="Monto *"
            type="number"
            value={formData.monto}
            onChange={(e) => setFormData(prev => ({ ...prev, monto: Number(e.target.value) }))}
            min="0.01"
            step="0.01"
            error={errors.monto}
            required
          />

          <Select
            label="Moneda"
            value={formData.moneda}
            onChange={(e) => setFormData(prev => ({ ...prev, moneda: e.target.value as any }))}
          >
            <option value="PESOS">Pesos Argentinos</option>
            <option value="DOLARES">Dólares</option>
          </Select>

          <Input
            label="Fecha *"
            type="date"
            value={formData.fecha.toISOString().split('T')[0]}
            onChange={(e) => setFormData(prev => ({ ...prev, fecha: new Date(e.target.value) }))}
            required
          />

          {/* NUEVO: Selector de Medio de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medio de Pago *
            </label>
            {loadingMedios ? (
              <div className="flex items-center justify-center py-2 border rounded-md bg-gray-50">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-500">Cargando...</span>
              </div>
            ) : (
              <select
                value={formData.medioPagoId}
                onChange={(e) => setFormData(prev => ({ ...prev, medioPagoId: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.medioPagoId ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Seleccionar medio de pago</option>
                {mediosPago.map(medio => (
                  <option key={medio.id} value={medio.id}>
                    {medio.nombre}
                  </option>
                ))}
              </select>
            )}
            {errors.medioPagoId && (
              <p className="mt-1 text-sm text-red-600">{errors.medioPagoId}</p>
            )}
          </div>

          <Input
            label="Comprobante"
            value={formData.comprobante}
            onChange={(e) => setFormData(prev => ({ ...prev, comprobante: e.target.value }))}
            placeholder="Número de factura/recibo"
          />

          <Input
            label="Proveedor"
            value={formData.proveedor}
            onChange={(e) => setFormData(prev => ({ ...prev, proveedor: e.target.value }))}
            placeholder="Nombre del proveedor"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <textarea
            value={formData.notas}
            onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Información adicional del gasto..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {gasto ? 'Actualizar' : 'Registrar'} Gasto
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface GastosPresupuestoComponentProps {
  presupuestoId: string;
  totalPresupuesto: number;
  monedaPresupuesto: string;
  showActions?: boolean;
  compact?: boolean;
}

export function GastosPresupuestoComponent({ 
  presupuestoId, 
  totalPresupuesto, 
  monedaPresupuesto,
  showActions = true,
  compact = false 
}: GastosPresupuestoComponentProps) {
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<any>(null);

  const { 
    gastos, 
    loading, 
    error, 
    estadisticas,
    createGasto, 
    updateGasto, 
    deleteGasto,
    refetch 
  } = useGastosPresupuesto(presupuestoId);

  const handleCreateGasto = async (data: GastoPresupuestoFormData) => {
    await createGasto(data);
    refetch();
  };

  const handleUpdateGasto = async (data: GastoPresupuestoFormData) => {
    if (selectedGasto) {
      await updateGasto(selectedGasto.id, data);
      refetch();
    }
  };

  const handleDeleteGasto = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este gasto?')) {
      await deleteGasto(id);
    }
  };

  const openEditModal = (gasto: any) => {
    setSelectedGasto(gasto);
    setIsGastoModalOpen(true);
  };

  const closeModal = () => {
    setIsGastoModalOpen(false);
    setSelectedGasto(null);
  };

  // Calcular estadísticas por medio de pago
  const gastosPorMedioPago = gastos.reduce((acc, gasto) => {
    const medioNombre = gasto.medioPago?.nombre || 'Sin especificar';
    if (!acc[medioNombre]) {
      acc[medioNombre] = { cantidad: 0, monto: 0 };
    }
    acc[medioNombre].cantidad += 1;
    acc[medioNombre].monto += Number(gasto.monto);
    return acc;
  }, {} as Record<string, { cantidad: number; monto: number }>);

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center">
              <HiOutlineReceiptTax className="h-5 w-5 mr-2" />
              Gastos
            </CardTitle>
            {showActions && (
              <Button size="sm" onClick={() => setIsGastoModalOpen(true)}>
                <HiOutlinePlus className="h-4 w-4 mr-2" />
                Gasto
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Total Gastos:</span>
              <span className="font-medium text-red-600">
                {CurrencyUtils.formatAmount(estadisticas.montoTotal, monedaPresupuesto as any)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cantidad:</span>
              <span className="font-medium text-gray-900">{estadisticas.totalGastos}</span>
            </div>
            <div className="text-xs text-gray-500">
              Por medio de pago:
            </div>
            {Object.entries(gastosPorMedioPago).map(([medio, data]) => (
              <div key={medio} className="flex justify-between text-xs">
                <span className="text-gray-600">{medio}:</span>
                <span className="font-medium">
                  {CurrencyUtils.formatAmount(data.monto, monedaPresupuesto as any)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>

        <GastoForm
          isOpen={isGastoModalOpen}
          onClose={closeModal}
          onSubmit={selectedGasto ? handleUpdateGasto : handleCreateGasto}
          gasto={selectedGasto}
          presupuestoId={presupuestoId}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs mejorados con desglose por medio de pago */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCash className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Gastos</p>
                <p className="text-lg font-bold text-red-600">
                  {CurrencyUtils.formatAmount(estadisticas.montoTotal, monedaPresupuesto as any)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClipboard className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cantidad</p>
                <p className="text-lg font-bold text-blue-600">{estadisticas.totalGastos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCreditCard className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Medios de Pago</p>
                <p className="text-lg font-bold text-purple-600">
                  {Object.keys(gastosPorMedioPago).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineReceiptTax className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">% del Presupuesto</p>
                <p className="text-lg font-bold text-green-600">
                  {totalPresupuesto > 0 ? ((estadisticas.montoTotal / totalPresupuesto) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por medio de pago */}
      {Object.keys(gastosPorMedioPago).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Medio de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(gastosPorMedioPago).map(([medio, data]) => (
                <div key={medio} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{medio}</h4>
                    <span className="text-sm text-gray-500">{data.cantidad} gastos</span>
                  </div>
                  <p className="text-lg font-bold text-red-600 mt-2">
                    {CurrencyUtils.formatAmount(data.monto, monedaPresupuesto as any)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {totalPresupuesto > 0 ? ((data.monto / totalPresupuesto) * 100).toFixed(1) : 0}% del presupuesto
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de gastos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Gastos</CardTitle>
            {showActions && (
              <Button onClick={() => setIsGastoModalOpen(true)}>
                <HiOutlinePlus className="h-4 w-4 mr-2" />
                Nuevo Gasto
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando gastos...</span>
            </div>
          ) : gastos.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineReceiptTax className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay gastos registrados</h3>
              <p className="mt-1 text-sm text-gray-500">
                Los gastos del presupuesto aparecerán aquí
              </p>
              {showActions && (
                <div className="mt-4">
                  <Button onClick={() => setIsGastoModalOpen(true)}>
                    <HiOutlinePlus className="h-4 w-4 mr-2" />
                    Registrar Primer Gasto
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                  <TableHeaderCell>Descripción</TableHeaderCell>
                  <TableHeaderCell>Categoría</TableHeaderCell>
                  <TableHeaderCell>Medio de Pago</TableHeaderCell>
                  <TableHeaderCell>Monto</TableHeaderCell>
                  {showActions && <TableHeaderCell>Acciones</TableHeaderCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastos.map((gasto) => (
                  <TableRow key={gasto.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {DateUtils.formatDate(gasto.fecha)}
                        </div>
                        <div className="text-xs text-gray-500">{gasto.numero}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{gasto.descripcion}</div>
                        {gasto.proveedor && (
                          <div className="text-sm text-gray-500">{gasto.proveedor}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        CATEGORIAS_GASTO_PRESUPUESTO[gasto.categoria as keyof typeof CATEGORIAS_GASTO_PRESUPUESTO]?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {CATEGORIAS_GASTO_PRESUPUESTO[gasto.categoria as keyof typeof CATEGORIAS_GASTO_PRESUPUESTO]?.label || gasto.categoria}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <HiOutlineCreditCard className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {gasto.medioPago?.nombre || 'No especificado'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-red-600">
                        {CurrencyUtils.formatAmount(gasto.monto, gasto.moneda as any)}
                      </span>
                    </TableCell>
                    {showActions && (
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(gasto)}
                          >
                            <HiOutlinePencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGasto(gasto.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de gastos */}
      <GastoForm
        isOpen={isGastoModalOpen}
        onClose={closeModal}
        onSubmit={selectedGasto ? handleUpdateGasto : handleCreateGasto}
        gasto={selectedGasto}
        presupuestoId={presupuestoId}
      />
    </div>
  );
}