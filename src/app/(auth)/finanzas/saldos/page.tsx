// src/app/(auth)/finanzas/saldos/page.tsx
'use client';

import { useState } from 'react';
import { useVentas } from '@/hooks/use-ventas';
import { useTransacciones } from '@/hooks/use-transacciones';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Currency, CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { TransaccionFormData } from '@/lib/validations/transaccion';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineClipboardCheck,
  HiOutlineCalendar,
  HiOutlineDownload,
  HiOutlinePhone,
  HiOutlineMail
} from 'react-icons/hi';

interface PagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  venta: any;
  onSubmit: (data: TransaccionFormData) => Promise<void>;
}

interface PagoFormData {
  monto: number;
  concepto: string;
  descripcion: string;
  fecha: string; // Mantener como string en el formulario
  medioPagoId: string;
  numeroComprobante: string;
}


function PagoModal({ isOpen, onClose, venta, onSubmit }: PagoModalProps) {
  const [formData, setFormData] = useState<PagoFormData>({
    monto: venta?.saldoPendiente || 0,
    concepto: `Pago obra ${venta?.numero}`,
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    medioPagoId: '',
    numeroComprobante: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-700">Cliente:</span>
              <p className="text-blue-900">{venta?.cliente.nombre}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Total Obra:</span>
              <p className="text-blue-900">{CurrencyUtils.formatAmount(venta?.total, venta?.moneda)}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Ya Cobrado:</span>
              <p className="text-blue-900">{CurrencyUtils.formatAmount(venta?.totalCobrado, venta?.moneda)}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Saldo Pendiente:</span>
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

export default function SaldosPage() {
  const [search, setSearch] = useState('');
  const [rangoFilter, setRangoFilter] = useState('');
  const [selectedVenta, setSelectedVenta] = useState<any>(null);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);

  // Obtener solo ventas con saldo pendiente
  const { ventas, loading, error, refetch } = useVentas();
  const { createTransaccion } = useTransacciones();

  // Filtrar solo ventas con saldo pendiente
  const ventasConSaldo = ventas.filter(venta => venta.saldoPendiente > 0);

  const handleRegistrarPago = async (data: TransaccionFormData) => {
    await createTransaccion(data);
    refetch(); // Actualizar la lista
  };

  const openPagoModal = (venta: any) => {
    setSelectedVenta(venta);
    setIsPagoModalOpen(true);
  };

  const closeModal = () => {
    setIsPagoModalOpen(false);
    setSelectedVenta(null);
  };

  // Calcular estadísticas
  const totalSaldos = ventasConSaldo.reduce((acc, v) => acc + Number(v.saldoPendiente), 0);
  const promedioSaldo = ventasConSaldo.length > 0 ? totalSaldos / ventasConSaldo.length : 0;
  const saldoMasAntiguo = ventasConSaldo.length > 0 
    ? Math.max(...ventasConSaldo.map(v => Date.now() - new Date(v.fechaPedido).getTime())) / (1000 * 60 * 60 * 24)
    : 0;

  // Clasificar por antigüedad
  const clasificarPorAntiguedad = (fechaPedido: string) => {
    const dias = (Date.now() - new Date(fechaPedido).getTime()) / (1000 * 60 * 60 * 24);
    if (dias <= 30) return { label: 'Reciente', color: 'bg-green-100 text-green-800', value: 'reciente' };
    if (dias <= 60) return { label: '30-60 días', color: 'bg-yellow-100 text-yellow-800', value: 'medio' };
    if (dias <= 90) return { label: '60-90 días', color: 'bg-orange-100 text-orange-800', value: 'antiguo' };
    return { label: '90+ días', color: 'bg-red-100 text-red-800', value: 'muy_antiguo' };
  };

  // Filtrar ventas según criterios
  const filteredVentas = ventasConSaldo.filter(venta => {
    const matchesSearch = venta.cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
                         venta.numero.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (rangoFilter) {
      const clasificacion = clasificarPorAntiguedad(String(venta.fechaPedido));
      return clasificacion.value === rangoFilter;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saldos por Cobrar</h1>
          <p className="text-gray-600">Seguimiento de cobros pendientes</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCash className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total por Cobrar</p>
                <p className="text-lg font-bold text-red-600">
                  {CurrencyUtils.formatAmount(totalSaldos)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClipboardCheck className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Clientes con Deuda</p>
                <p className="text-lg font-bold text-gray-900">{ventasConSaldo.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCalendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Promedio por Cliente</p>
                <p className="text-lg font-bold text-gray-900">
                  {CurrencyUtils.formatAmount(promedioSaldo)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineExclamationCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Saldo Más Antiguo</p>
                <p className="text-lg font-bold text-gray-900">{Math.round(saldoMasAntiguo)} días</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por cliente o número..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <Select
              value={rangoFilter}
              onChange={(e) => setRangoFilter(e.target.value)}
            >
              <option value="">Todas las antigüedades</option>
              <option value="reciente">Recientes (0-30 días)</option>
              <option value="medio">Moderados (30-60 días)</option>
              <option value="antiguo">Antiguos (60-90 días)</option>
              <option value="muy_antiguo">Muy antiguos (90+ días)</option>
            </Select>

            <Button variant="outline" onClick={refetch} className="w-full">
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de saldos */}
      <Card>
        <CardHeader>
          <CardTitle>Saldos Pendientes de Cobro</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredVentas.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineCash className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {ventasConSaldo.length === 0 ? 'No hay saldos pendientes' : 'No se encontraron resultados'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {ventasConSaldo.length === 0 
                  ? '¡Excelente! Todos los cobros están al día' 
                  : 'Intenta cambiar los filtros de búsqueda'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Pedido</TableHeaderCell>
                  <TableHeaderCell>Total / Cobrado</TableHeaderCell>
                  <TableHeaderCell>Saldo Pendiente</TableHeaderCell>
                  <TableHeaderCell>Antigüedad</TableHeaderCell>
                  <TableHeaderCell>Contacto</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVentas.map((venta) => {
                  // Convertimos la fecha a string para clasificarPorAntiguedad
                  const fechaPedidoStr = typeof venta.fechaPedido === 'string'
                    ? venta.fechaPedido
                    : new Date(venta.fechaPedido).toISOString();
                  const antiguedad = clasificarPorAntiguedad(fechaPedidoStr);
                  const diasAntiguedad = Math.round((Date.now() - new Date(venta.fechaPedido).getTime()) / (1000 * 60 * 60 * 24));
                  const porcentajeCobrado = venta.total > 0 ? ((venta.totalCobrado / venta.total) * 100) : 0;
                  
                  return (
                    <TableRow key={venta.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{venta.cliente.nombre}</div>
                          <div className="text-sm text-gray-500">{venta.cliente.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{venta.numero}</div>
                          <div className="text-sm text-gray-500">
                            {DateUtils.formatDate(venta.fechaPedido)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm text-gray-900">
                            Total: {CurrencyUtils.formatAmount(venta.total, venta.moneda as Currency)}
                          </div>
                          <div className="text-sm text-green-600">
                            Cobrado: {CurrencyUtils.formatAmount(venta.totalCobrado, venta.moneda as Currency)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {porcentajeCobrado.toFixed(0)}% cobrado
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-red-600 text-lg">
                          {CurrencyUtils.formatAmount(venta.saldoPendiente, venta.moneda as Currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${antiguedad.color}`}>
                            {antiguedad.label}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {diasAntiguedad} días
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {venta.cliente.telefono && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`tel:${venta.cliente.telefono}`)}
                            >
                              <HiOutlinePhone className="h-4 w-4" />
                            </Button>
                          )}
                          {venta.cliente.email && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`mailto:${venta.cliente.email}`)}
                            >
                              <HiOutlineMail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPagoModal(venta)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <HiOutlineCash className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/ventas/${venta.id}`, '_blank')}
                          >
                            <HiOutlineEye className="h-4 w-4" />
                          </Button>
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
          onClose={closeModal}
          venta={selectedVenta}
          onSubmit={handleRegistrarPago}
        />
      )}
    </div>
  );
}