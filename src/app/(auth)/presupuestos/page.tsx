// src/app/(auth)/presupuestos/page.tsx - MEJORADO CON FILTROS AVANZADOS
'use client';

import { useState, useEffect } from 'react';
import { usePresupuestos, usePresupuestoSearch } from '@/hooks/use-presupuestos';
import { useClients } from '@/hooks/use-clients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { PresupuestoFormData, ItemPresupuestoFormData, presupuestoSchema } from '@/lib/validations/presupuesto';
import { CurrencyUtils, DateUtils, CalculationUtils, Currency } from '@/lib/utils/calculations';
import { ESTADOS_PRESUPUESTO } from '@/lib/utils/validators';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineFilter,
  HiOutlineX,
  HiOutlineRefresh
} from 'react-icons/hi';

// Componente de filtros avanzados
function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  clients 
}: {
  filters: any;
  onFiltersChange: (filters: any) => void;
  clients: any[];
}) {
  const [showFilters, setShowFilters] = useState(false);

  function onClear(event: React.MouseEvent<HTMLButtonElement>): void {
    // Aquí puedes limpiar los filtros, por ejemplo:
    onFiltersChange({});
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <HiOutlineFilter className="h-5 w-5 mr-2" />
            Filtros de Búsqueda
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </Button>
        </div>
      </CardHeader>
      {showFilters && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda por número específico */}
            <Input
              label="Número de Presupuesto"
              placeholder="PRES-2025-001"
              value={filters.numero || ''}
              onChange={(e) => onFiltersChange({ ...filters, numero: e.target.value })}
            />

            {/* Cliente */}
            <Select
              label="Cliente"
              value={filters.clienteId || ''}
              onChange={(e) => onFiltersChange({ ...filters, clienteId: e.target.value })}
            >
              <option value="">Todos los clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nombre}
                </option>
              ))}
            </Select>

            {/* Estado */}
            <Select
              label="Estado"
              value={filters.estado || ''}
              onChange={(e) => onFiltersChange({ ...filters, estado: e.target.value })}
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS_PRESUPUESTO).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </Select>

            {/* Fecha desde */}
            <Input
              label="Fecha Desde"
              type="date"
              value={filters.fechaDesde || ''}
              onChange={(e) => onFiltersChange({ ...filters, fechaDesde: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fecha hasta */}
            <Input
              label="Fecha Hasta"
              type="date"
              value={filters.fechaHasta || ''}
              onChange={(e) => onFiltersChange({ ...filters, fechaHasta: e.target.value })}
            />

            {/* Búsqueda general */}
            <Input
              label="Búsqueda General"
              placeholder="Buscar en descripción, observaciones..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClear}>
              <HiOutlineX className="h-4 w-4 mr-2" />
              Limpiar Filtros
            </Button>
            <Button onClick={() => setShowFilters(false)}>
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Componente de búsqueda rápida
function QuickSearch() {
  const { searchTerm, setSearchTerm, searchResults, searching, clearResults } = usePresupuestoSearch();
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchResults.length > 0) {
      setShowResults(true);
    }
  }, [searchResults]);

  return (
    <div className="relative">
      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Búsqueda rápida por número (ej: PRES-2025-001)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Resultados de búsqueda rápida */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">
                {searchResults.length} resultado(s) encontrado(s)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResults(false);
                  clearResults();
                  setSearchTerm('');
                }}
              >
                <HiOutlineX className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {searchResults.map((presupuesto) => (
            <div
              key={presupuesto.id}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => {
                window.location.href = `/presupuestos/${presupuesto.id}`;
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">{presupuesto.numero}</div>
                  <div className="text-sm text-gray-600">{presupuesto.cliente.nombre}</div>
                  <div className="text-xs text-gray-500 truncate max-w-xs">
                    {presupuesto.descripcionObra}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {CurrencyUtils.formatAmount(presupuesto.total, presupuesto.moneda as Currency)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {DateUtils.formatDate(presupuesto.fechaEmision)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PresupuestosPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    numero: '',
    estado: '',
    clienteId: '',
    search: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  const { clients } = useClients();
  const { presupuestos, loading, error, pagination, estadisticas, convertirAVenta, refetch } = usePresupuestos(filters);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      numero: '',
      estado: '',
      clienteId: '',
      search: '',
      fechaDesde: '',
      fechaHasta: ''
    });
  };

  const handleConvertToSale = async (presupuesto: any) => {
    if (confirm(`¿Convertir el presupuesto "${presupuesto.numero}" a venta/pedido?`)) {
      try {
        await convertirAVenta(presupuesto.id);
        refetch();
      } catch (error) {
        console.error('Error converting presupuesto:', error);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'page' && key !== 'limit' && value !== ''
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-gray-600">
            Gestiona los presupuestos de tus proyectos
            {hasActiveFilters && (
              <span className="ml-2 text-blue-600 text-sm">
                (filtros aplicados)
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={refetch}>
            <HiOutlineRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => window.location.href = '/presupuestos/nuevo'}>
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Nuevo Presupuesto
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineDocumentText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.pendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Aprobados</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.aprobados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClipboardCheck className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Convertidos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.convertidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Monto Total</p>
              <p className="text-lg font-bold text-gray-900">
                {CurrencyUtils.formatAmount(estadisticas.montoTotal)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Tasa Conversión</p>
              <p className="text-lg font-bold text-blue-600">
                {estadisticas.tasaConversion.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda rápida */}
      <Card>
        <CardContent className="p-6">
          <QuickSearch />
        </CardContent>
      </Card>

      {/* Filtros avanzados */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        clients={clients}
      />

        {/* Tabla de presupuestos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Presupuestos</CardTitle>
            <div className="text-sm text-gray-500">
              Página {pagination.page} de {pagination.pages} ({pagination.total} total)
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar presupuestos</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          ) : presupuestos.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineDocumentText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay presupuestos</h3>
              <p className="mt-1 text-sm text-gray-500">
                {hasActiveFilters ? 'No se encontraron presupuestos con esos criterios' : 'Comienza creando tu primer presupuesto'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Número</TableHeaderCell>
                    <TableHeaderCell>Cliente</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell>Validez</TableHeaderCell>
                    <TableHeaderCell>Acciones</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presupuestos.map((presupuesto) => {
                    const estadoInfo = ESTADOS_PRESUPUESTO[presupuesto.estado as keyof typeof ESTADOS_PRESUPUESTO];
                    const dueStatus = DateUtils.getDueStatus(presupuesto.fechaValidez);
                    
                    return (
                      <TableRow key={presupuesto.id}>
                        <TableCell>
                          <div>
                            <div className="font-bold text-blue-600">{presupuesto.numero}</div>
                            <div className="text-sm text-gray-500">
                              {DateUtils.formatDate(presupuesto.fechaEmision)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{presupuesto.cliente.nombre}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {presupuesto.descripcionObra}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-900">
                            {CurrencyUtils.formatAmount(presupuesto.total, presupuesto.moneda as Currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            estadoInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                            estadoInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            estadoInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            estadoInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                            estadoInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {estadoInfo.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm text-gray-900">
                              {DateUtils.formatDate(presupuesto.fechaValidez)}
                            </div>
                            <div className={`text-xs ${dueStatus.color}`}>
                              {dueStatus.message}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.location.href = `/presupuestos/${presupuesto.id}`}
                            >
                              <HiOutlineEye className="h-4 w-4" />
                            </Button>
                            {presupuesto.estado !== 'CONVERTIDO' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.location.href = `/presupuestos/${presupuesto.id}/editar`}
                              >
                                <HiOutlinePencil className="h-4 w-4" />
                              </Button>
                            )}
                            {presupuesto.estado === 'APROBADO' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConvertToSale(presupuesto)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <HiOutlineClipboardCheck className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Paginación */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = pagination.page - 2 + i;
                      if (pageNum > 0 && pageNum <= pagination.pages) {
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.page ? "primary" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                      return null;
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}