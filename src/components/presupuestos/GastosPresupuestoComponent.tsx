// src/components/presupuestos/GastosPresupuestoComponent.tsx
'use client';

import { useState } from 'react';
import { useGastosPresupuesto } from '@/hooks/use-gastos-presupuesto';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { GastoPresupuestoFormData, CATEGORIAS_GASTO_PRESUPUESTO } from '@/lib/validations/gasto-presupuesto';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCash,
  HiOutlineReceiptTax,
  HiOutlineClipboardList,
  HiOutlineExclamationCircle
} from 'react-icons/hi';

interface GastosPresupuestoComponentProps {
  presupuestoId: string;
  totalPresupuesto?: number;
  monedaPresupuesto?: string;
  showActions?: boolean;
  compact?: boolean;
}

export function GastosPresupuestoComponent({
  presupuestoId,
  totalPresupuesto = 0,
  monedaPresupuesto = 'PESOS',
  showActions = true,
  compact = false
}: GastosPresupuestoComponentProps) {
  const {
    gastos,
    loading,
    error,
    estadisticas,
    presupuestoInfo,
    createGasto,
    updateGasto,
    deleteGasto,
    refetch
  } = useGastosPresupuesto(presupuestoId);

  const [showModal, setShowModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState<any>(null);
  const [formData, setFormData] = useState<GastoPresupuestoFormData>({
    presupuestoId,
    descripcion: '',
    categoria: 'MATERIALES',
    subcategoria: '',
    monto: 0,
    moneda: monedaPresupuesto as 'PESOS' | 'DOLARES',
    fecha: new Date(),
    comprobante: '',
    proveedor: '',
    notas: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = (gasto?: any) => {
    if (gasto) {
      setEditingGasto(gasto);
      setFormData({
        presupuestoId,
        descripcion: gasto.descripcion,
        categoria: gasto.categoria,
        subcategoria: gasto.subcategoria || '',
        monto: Number(gasto.monto),
        moneda: gasto.moneda,
        fecha: new Date(gasto.fecha),
        comprobante: gasto.comprobante || '',
        proveedor: gasto.proveedor || '',
        notas: gasto.notas || ''
      });
    } else {
      setEditingGasto(null);
      setFormData({
        presupuestoId,
        descripcion: '',
        categoria: 'MATERIALES',
        subcategoria: '',
        monto: 0,
        moneda: monedaPresupuesto as 'PESOS' | 'DOLARES',
        fecha: new Date(),
        comprobante: '',
        proveedor: '',
        notas: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGasto(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingGasto) {
        await updateGasto(editingGasto.id, formData);
      } else {
        await createGasto(formData);
      }
      handleCloseModal();
      refetch();
    } catch (error: any) {
      console.error('Error al guardar gasto:', error);
      alert(error.message || 'Error al guardar gasto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      try {
        await deleteGasto(id);
      } catch (error: any) {
        console.error('Error al eliminar gasto:', error);
        alert(error.message || 'Error al eliminar gasto');
      }
    }
  };

  const porcentajeDelPresupuesto = totalPresupuesto > 0 
    ? (estadisticas.montoTotal / totalPresupuesto) * 100 
    : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando gastos...</span>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar gastos</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <Button onClick={refetch} className="mt-4">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClipboardList className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Gastos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalGastos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCash className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monto Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {CurrencyUtils.formatAmount(estadisticas.montoTotal, monedaPresupuesto as any)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineReceiptTax className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">% del Presupuesto</p>
                <p className={`text-2xl font-bold ${
                  porcentajeDelPresupuesto > 80 ? 'text-red-600' :
                  porcentajeDelPresupuesto > 60 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {porcentajeDelPresupuesto.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gastos por categoría */}
      {estadisticas.gastosPorCategoria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {estadisticas.gastosPorCategoria.map((categoria) => {
                const config = CATEGORIAS_GASTO_PRESUPUESTO[categoria.categoria as keyof typeof CATEGORIAS_GASTO_PRESUPUESTO];
                return (
                  <div key={categoria.categoria} className={`p-4 rounded-lg border ${config?.color || 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{config?.icon || '📋'}</span>
                        <div>
                          <p className="font-medium">{config?.label || categoria.categoria}</p>
                          <p className="text-sm opacity-75">{categoria.cantidad} gastos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {CurrencyUtils.formatAmount(categoria.monto, monedaPresupuesto as any)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de gastos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Gastos del Presupuesto
              {presupuestoInfo && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({presupuestoInfo.numero})
                </span>
              )}
            </CardTitle>
            {showActions && (
              <Button onClick={() => handleOpenModal()}>
                <HiOutlinePlus className="h-4 w-4 mr-2" />
                Nuevo Gasto
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {gastos.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineCash className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay gastos registrados</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza agregando los gastos asociados a este presupuesto
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Descripción</TableHeaderCell>
                  <TableHeaderCell>Categoría</TableHeaderCell>
                  <TableHeaderCell className="text-right">Monto</TableHeaderCell>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                  <TableHeaderCell>Proveedor</TableHeaderCell>
                  {showActions && <TableHeaderCell>Acciones</TableHeaderCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastos.map((gasto) => {
                  const config = CATEGORIAS_GASTO_PRESUPUESTO[gasto.categoria as keyof typeof CATEGORIAS_GASTO_PRESUPUESTO];
                  return (
                    <TableRow key={gasto.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{gasto.descripcion}</div>
                          {gasto.comprobante && (
                            <div className="text-sm text-gray-500">
                              Comprobante: {gasto.comprobante}
                            </div>
                          )}
                          {gasto.notas && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {gasto.notas}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
                          <span className="mr-1">{config?.icon || '📋'}</span>
                          {config?.label || gasto.categoria}
                        </span>
                        {gasto.subcategoria && (
                          <div className="text-xs text-gray-500 mt-1">
                            {gasto.subcategoria}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-gray-900">
                          {CurrencyUtils.formatAmount(gasto.monto, gasto.moneda as any)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900">
                          {DateUtils.formatDate(gasto.fecha)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900">
                          {gasto.proveedor || '-'}
                        </span>
                      </TableCell>
                      {showActions && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(gasto)}
                            >
                              <HiOutlinePencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(gasto.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <HiOutlineTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal para crear/editar gasto */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Descripción *"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Ej: Compra de aluminio para ventanas"
                required
              />
            </div>

            <Select
              label="Categoría *"
              value={formData.categoria}
              onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value as any }))}
              required
            >
              {Object.entries(CATEGORIAS_GASTO_PRESUPUESTO).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.icon} {value.label}
                </option>
              ))}
            </Select>

            <Input
              label="Subcategoría"
              value={formData.subcategoria}
              onChange={(e) => setFormData(prev => ({ ...prev, subcategoria: e.target.value }))}
              placeholder="Ej: Perfiles, Vidrios"
            />

            <Input
              label="Monto *"
              type="number"
              value={formData.monto}
              onChange={(e) => setFormData(prev => ({ ...prev, monto: Number(e.target.value) }))}
              min="0.01"
              step="0.01"
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notas adicionales sobre el gasto..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleCloseModal} type="button">
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingGasto ? 'Actualizar' : 'Crear'} Gasto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}