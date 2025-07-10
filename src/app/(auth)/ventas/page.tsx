// src/app/(auth)/ventas/page.tsx
'use client';

import { useState } from 'react';
import { useVentas } from '@/hooks/use-ventas';
import { useClients } from '@/hooks/use-clients';
import { useTransacciones } from '@/hooks/use-transacciones';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Currency, CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { ESTADOS_PEDIDO } from '@/lib/utils/validators';
import { TransaccionFormData } from '@/lib/validations/transaccion';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineClipboardCheck,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineXCircle
} from 'react-icons/hi';

interface PagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  venta: any;
  onSubmit: (data: TransaccionFormData) => Promise<void>;
}

function PagoModal({ isOpen, onClose, venta, onSubmit }: PagoModalProps) {
  const [formData, setFormData] = useState({
    monto: venta?.saldoPendiente || 0,
    concepto: `Pago obra ${venta?.numero}`,
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    medioPagoId: '',
    numeroComprobante: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock medios de pago - en la realidad vendrían de una API
  const mediosPago = [
    { id: '1', nombre: 'Efectivo' },
    { id: '2', nombre: 'Transferencia Bancaria' },
    { id: '3', nombre: 'Cheque' },
    { id: '4', nombre: 'Tarjeta de Débito' },
    { id: '5', nombre: 'Tarjeta de Crédito' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const transaccionData: TransaccionFormData = {
        tipo: 'PAGO_OBRA',
        concepto: formData.concepto,
        descripcion: formData.descripcion,
        monto: Number(formData.monto),
        moneda: venta.moneda,
        fecha: new Date(formData.fecha),
        numeroComprobante: formData.numeroComprobante,
        clienteId: venta.cliente.id,
        pedidoId: venta.id,
        medioPagoId: formData.medioPagoId
      };

      await onSubmit(transaccionData);
      onClose();
    } catch (error) {
      console.error('Error al registrar pago:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Registrar Pago - ${venta?.numero}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Cliente:</span>
              <p className="text-gray-900">{venta?.cliente.nombre}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Obra:</span>
              <p className="text-gray-900">{CurrencyUtils.formatAmount(venta?.total, venta?.moneda)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Ya Cobrado:</span>
              <p className="text-gray-900">{CurrencyUtils.formatAmount(venta?.totalCobrado, venta?.moneda)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Saldo Pendiente:</span>
              <p className="text-lg font-bold text-red-600">
                {CurrencyUtils.formatAmount(venta?.saldoPendiente, venta?.moneda)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Monto a Cobrar *"
            type="number"
            value={formData.monto}
            onChange={(e) => setFormData(prev => ({ ...prev, monto: Number(e.target.value) }))}
            max={venta?.saldoPendiente}
            min="0.01"
            step="0.01"
            required
          />

          <Select
            label="Medio de Pago *"
            value={formData.medioPagoId}
            onChange={(e) => setFormData(prev => ({ ...prev, medioPagoId: e.target.value }))}
            required
          >
            <option value="">Seleccionar medio</option>
            {mediosPago.map(medio => (
              <option key={medio.id} value={medio.id}>{medio.nombre}</option>
            ))}
          </Select>

          <Input
            label="Fecha de Pago"
            type="date"
            value={formData.fecha}
            onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
            required
          />

          <Input
            label="Número de Comprobante"
            value={formData.numeroComprobante}
            onChange={(e) => setFormData(prev => ({ ...prev, numeroComprobante: e.target.value }))}
            placeholder="Número de recibo/factura"
          />
        </div>

        <Input
          label="Concepto"
          value={formData.concepto}
          onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Información adicional del pago..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Registrar Pago
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function VentasPage() {
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [selectedVenta, setSelectedVenta] = useState<any>(null);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { ventas, loading, error, updateEstado, refetch } = useVentas({
    search: search.length >= 2 ? search : undefined,
    estado: estadoFilter || undefined
  });

  const { createTransaccion } = useTransacciones();

  const handleEstadoChange = async (venta: any, nuevoEstado: string) => {
    if (confirm(`¿Cambiar estado a "${ESTADOS_PEDIDO[nuevoEstado as keyof typeof ESTADOS_PEDIDO]?.label}"?`)) {
      await updateEstado(venta.id, nuevoEstado);
      refetch();
    }
  };

  const handleRegistrarPago = async (data: TransaccionFormData) => {
    await createTransaccion(data);
    refetch(); // Actualizar la lista para reflejar los nuevos saldos
  };

  const openPagoModal = (venta: any) => {
    setSelectedVenta(venta);
    setIsPagoModalOpen(true);
  };

  const openDetailModal = (venta: any) => {
    setSelectedVenta(venta);
    setIsDetailModalOpen(true);
  };

  const closeModals = () => {
    setIsPagoModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedVenta(null);
  };

  // Estadísticas
  const stats = {
    total: ventas.length,
    enProceso: ventas.filter(v => ['EN_PROCESO', 'EN_PRODUCCION'].includes(v.estado)).length,
    listos: ventas.filter(v => v.estado === 'LISTO_ENTREGA').length,
    entregados: ventas.filter(v => v.estado === 'ENTREGADO').length,
    cobrados: ventas.filter(v => v.estado === 'COBRADO').length,
    montoTotal: ventas.reduce((acc, v) => acc + Number(v.total), 0),
    saldoPendiente: ventas.reduce((acc, v) => acc + Number(v.saldoPendiente), 0)
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'EN_PROCESO':
      case 'EN_PRODUCCION':
        return <HiOutlineClock className="h-5 w-5" />;
      case 'LISTO_ENTREGA':
        return <HiOutlineCheckCircle className="h-5 w-5" />;
      case 'ENTREGADO':
        return <HiOutlineTruck className="h-5 w-5" />;
      case 'COBRADO':
        return <HiOutlineCheckCircle className="h-5 w-5" />;
      case 'CANCELADO':
        return <HiOutlineXCircle className="h-5 w-5" />;
      default:
        return <HiOutlineClipboardCheck className="h-5 w-5" />;
    }
  };

  const getAvanceColor = (avance: number) => {
    if (avance === 0) return 'bg-gray-200';
    if (avance < 25) return 'bg-red-500';
    if (avance < 50) return 'bg-yellow-500';
    if (avance < 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas y Pedidos</h1>
          <p className="text-gray-600">Gestiona el estado y seguimiento de tus ventas</p>
        </div>
        <Button onClick={() => window.location.href = '/presupuestos'}>
          <HiOutlinePlus className="h-4 w-4 mr-2" />
          Nueva Venta
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <HiOutlineClipboardCheck className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">Total</p>
                <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <HiOutlineClock className="h-6 w-6 text-yellow-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">En Proceso</p>
                <p className="text-lg font-bold text-gray-900">{stats.enProceso}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <HiOutlineCheckCircle className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">Listos</p>
                <p className="text-lg font-bold text-gray-900">{stats.listos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <HiOutlineTruck className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">Entregados</p>
                <p className="text-lg font-bold text-gray-900">{stats.entregados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <HiOutlineCash className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">Cobrados</p>
                <p className="text-lg font-bold text-gray-900">{stats.cobrados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Monto Total</p>
              <p className="text-sm font-bold text-gray-900">
                {CurrencyUtils.formatAmount(stats.montoTotal)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Por Cobrar</p>
              <p className="text-sm font-bold text-red-600">
                {CurrencyUtils.formatAmount(stats.saldoPendiente)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por número, cliente o descripción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <Select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS_PEDIDO).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </Select>
            <Button variant="outline" onClick={refetch}>
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ventas y Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar ventas</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          ) : ventas.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineClipboardCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ventas</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || estadoFilter ? 'No se encontraron ventas con esos criterios' : 'Las ventas aparecerán aquí cuando conviertas presupuestos'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Pedido</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Total / Saldo</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Avance</TableHeaderCell>
                  <TableHeaderCell>Entrega</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((venta) => {
                  const estadoInfo = ESTADOS_PEDIDO[venta.estado as keyof typeof ESTADOS_PEDIDO];
                  const porcentajeCobrado = venta.total > 0 ? ((venta.totalCobrado / venta.total) * 100) : 0;
                  
                  return (
                    <TableRow key={venta.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{venta.numero}</div>
                          <div className="text-sm text-gray-500">
                            {DateUtils.formatDate(venta.fechaPedido)}
                          </div>
                          {venta.presupuesto && (
                            <div className="text-xs text-blue-600">
                              Desde: {venta.presupuesto.numero}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{venta.cliente.nombre}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {venta.descripcionObra}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {CurrencyUtils.formatAmount(venta.total, venta.moneda as Currency)}
                          </div>
                          {venta.saldoPendiente > 0 && (
                            <div className="text-sm text-red-600">
                              Saldo: {CurrencyUtils.formatAmount(venta.saldoPendiente, venta.moneda as Currency)}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            Cobrado: {porcentajeCobrado.toFixed(0)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            estadoInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                            estadoInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            estadoInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            estadoInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                            estadoInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getEstadoIcon(venta.estado)}
                            <span className="ml-1">{estadoInfo.label}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                      <div className="w-full">
  <div className="flex justify-between text-xs text-gray-600 mb-1">
    <span>Avance</span>
    <span>{Number(venta.porcentajeAvance) || 0}%</span>
  </div>
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className={`h-2 rounded-full ${getAvanceColor(Number(venta.porcentajeAvance) || 0)}`}
      style={{ width: `${Number(venta.porcentajeAvance) || 0}%` }}
    />
  </div>
</div>
                      </TableCell>
                      <TableCell>
                        {venta.fechaEntrega ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {DateUtils.formatDate(venta.fechaEntrega)}
                            </div>
                            {venta.fechaEntregaReal && (
                              <div className="text-xs text-green-600">
                                Entregado: {DateUtils.formatDate(venta.fechaEntregaReal)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sin fecha</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailModal(venta)}
                          >
                            <HiOutlineEye className="h-4 w-4" />
                          </Button>
                          {venta.saldoPendiente > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPagoModal(venta)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <HiOutlineCash className="h-4 w-4" />
                            </Button>
                          )}
                          <Select
                            value={venta.estado}
                            onChange={(e) => handleEstadoChange(venta, e.target.value)}
                            className="text-xs"
                          >
                            {Object.entries(ESTADOS_PEDIDO).map(([key, value]) => (
                              <option key={key} value={key}>{value.label}</option>
                            ))}
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de pago */}
      {selectedVenta && (
        <PagoModal
          isOpen={isPagoModalOpen}
          onClose={closeModals}
          venta={selectedVenta}
          onSubmit={handleRegistrarPago}
        />
      )}

      {/* Modal de detalle */}
      {selectedVenta && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeModals}
          title={`Detalle: ${selectedVenta.numero}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <p className="mt-1 text-sm text-gray-900">{selectedVenta.cliente.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  ESTADOS_PEDIDO[selectedVenta.estado as keyof typeof ESTADOS_PEDIDO]?.color === 'green' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {ESTADOS_PEDIDO[selectedVenta.estado as keyof typeof ESTADOS_PEDIDO]?.label}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total</label>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {CurrencyUtils.formatAmount(selectedVenta.total, selectedVenta.moneda)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Saldo Pendiente</label>
                <p className="mt-1 text-lg font-bold text-red-600">
                  {CurrencyUtils.formatAmount(selectedVenta.saldoPendiente, selectedVenta.moneda)}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={closeModals}>
                Cerrar
              </Button>
              {selectedVenta.saldoPendiente > 0 && (
                <Button onClick={() => {
                  closeModals();
                  openPagoModal(selectedVenta);
                }}>
                  Registrar Pago
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}