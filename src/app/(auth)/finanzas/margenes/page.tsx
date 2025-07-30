// src/app/(auth)/finanzas/margenes/page.tsx - NUEVO DASHBOARD DE MÁRGENES
'use client';

import { useState, useEffect } from 'react';
import { usePresupuestos } from '@/hooks/use-presupuestos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { api } from '@/lib/utils/http';
import Link from 'next/link';
import {
  HiOutlineChartBar,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineExclamationCircle,
  HiOutlineEye,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineDocumentReport,
  HiOutlineCash,
  HiOutlineReceiptTax
} from 'react-icons/hi';

interface MargenPresupuesto {
  presupuestoId: string;
  numero: string;
  cliente: string;
  fechaEmision: string;
  estado: string;
  presupuestoTotal: number;
  ventasTotal: number;
  gastosTotal: number;
  margenBruto: number;
  porcentajeMargen: number;
  estadoMargen: 'positivo' | 'negativo' | 'equilibrio';
  moneda: string;
}

export default function MargenesPage() {
  const [margenes, setMargenes] = useState<MargenPresupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    estado: '',
    estadoMargen: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  // Estadísticas generales
  const [estadisticas, setEstadisticas] = useState({
    totalPresupuestos: 0,
    presupuestosConGastos: 0,
    presupuestosRentables: 0,
    presupuestosPerdida: 0,
    margenPromedioGeneral: 0,
    montoTotalPresupuestos: 0,
    montoTotalGastos: 0,
    margenBrutoTotal: 0
  });

  const fetchMargenes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching márgenes data...');
      
      // Obtener todos los presupuestos
      const presupuestosResponse = await api.get('/api/presupuestos?limit=100');
      const presupuestos = presupuestosResponse.data || [];
      
      // Obtener gastos y ventas para cada presupuesto
      const margenesData: MargenPresupuesto[] = [];
      
      for (const presupuesto of presupuestos) {
        try {
          // Obtener gastos del presupuesto
          const gastosResponse = await api.get(`/api/presupuestos/${presupuesto.id}/gastos`);
          const gastosTotal = gastosResponse.estadisticas?.montoTotal || 0;
          
          // Obtener ventas relacionadas al presupuesto
          const ventasResponse = await api.get(`/api/ventas?presupuestoId=${presupuesto.id}`);
          const venta = ventasResponse.data?.[0];
          const ventasTotal = venta ? Number(venta.total) : 0;
          
          // Calcular margen
          const margenBruto = ventasTotal - gastosTotal;
          const porcentajeMargen = ventasTotal > 0 ? (margenBruto / ventasTotal) * 100 : 0;
          const estadoMargen: 'positivo' | 'negativo' | 'equilibrio' = 
            margenBruto > 0 ? 'positivo' : margenBruto < 0 ? 'negativo' : 'equilibrio';
          
          margenesData.push({
            presupuestoId: presupuesto.id,
            numero: presupuesto.numero,
            cliente: presupuesto.cliente.nombre,
            fechaEmision: presupuesto.fechaEmision,
            estado: presupuesto.estado,
            presupuestoTotal: Number(presupuesto.total),
            ventasTotal,
            gastosTotal,
            margenBruto,
            porcentajeMargen,
            estadoMargen,
            moneda: presupuesto.moneda
          });
        } catch (err) {
          console.warn(`Error fetching data for presupuesto ${presupuesto.numero}:`, err);
          // Agregar presupuesto sin datos de gastos/ventas
          margenesData.push({
            presupuestoId: presupuesto.id,
            numero: presupuesto.numero,
            cliente: presupuesto.cliente.nombre,
            fechaEmision: presupuesto.fechaEmision,
            estado: presupuesto.estado,
            presupuestoTotal: Number(presupuesto.total),
            ventasTotal: 0,
            gastosTotal: 0,
            margenBruto: 0,
            porcentajeMargen: 0,
            estadoMargen: 'equilibrio',
            moneda: presupuesto.moneda
          });
        }
      }
      
      // Filtrar datos según filtros aplicados
      const datosFiltrados = margenesData.filter(margen => {
        if (filters.search && !margen.numero.toLowerCase().includes(filters.search.toLowerCase()) && 
            !margen.cliente.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
        if (filters.estado && margen.estado !== filters.estado) return false;
        if (filters.estadoMargen && margen.estadoMargen !== filters.estadoMargen) return false;
        if (filters.fechaDesde) {
          const fechaMargen = new Date(margen.fechaEmision);
          const fechaFiltro = new Date(filters.fechaDesde);
          if (fechaMargen < fechaFiltro) return false;
        }
        if (filters.fechaHasta) {
          const fechaMargen = new Date(margen.fechaEmision);
          const fechaFiltro = new Date(filters.fechaHasta);
          if (fechaMargen > fechaFiltro) return false;
        }
        return true;
      });
      
      // Calcular estadísticas
      const stats = {
        totalPresupuestos: datosFiltrados.length,
        presupuestosConGastos: datosFiltrados.filter(m => m.gastosTotal > 0).length,
        presupuestosRentables: datosFiltrados.filter(m => m.estadoMargen === 'positivo').length,
        presupuestosPerdida: datosFiltrados.filter(m => m.estadoMargen === 'negativo').length,
        margenPromedioGeneral: datosFiltrados.length > 0 
          ? datosFiltrados.reduce((acc, m) => acc + m.porcentajeMargen, 0) / datosFiltrados.length 
          : 0,
        montoTotalPresupuestos: datosFiltrados.reduce((acc, m) => acc + m.presupuestoTotal, 0),
        montoTotalGastos: datosFiltrados.reduce((acc, m) => acc + m.gastosTotal, 0),
        margenBrutoTotal: datosFiltrados.reduce((acc, m) => acc + m.margenBruto, 0)
      };
      
      setMargenes(datosFiltrados);
      setEstadisticas(stats);
      
      console.log('✅ Márgenes data loaded successfully:', datosFiltrados.length);
    } catch (err: any) {
      console.error('❌ Error fetching márgenes:', err);
      setError(err.message || 'Error al cargar datos de márgenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMargenes();
  }, [JSON.stringify(filters)]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      estado: '',
      estadoMargen: '',
      fechaDesde: '',
      fechaHasta: ''
    });
  };

  const getMargenColor = (estadoMargen: string) => {
    switch (estadoMargen) {
      case 'positivo':
        return 'text-green-600';
      case 'negativo':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getMargenBadge = (estadoMargen: string) => {
    switch (estadoMargen) {
      case 'positivo':
        return 'bg-green-100 text-green-800';
      case 'negativo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando análisis de márgenes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análisis de Márgenes</h1>
          <p className="text-gray-600">
            Control de rentabilidad por presupuesto
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={fetchMargenes}>
            <HiOutlineDocumentReport className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineChartBar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Presupuestos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalPresupuestos}</p>
                <p className="text-xs text-gray-500">
                  {estadisticas.presupuestosConGastos} con gastos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineTrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rentables</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.presupuestosRentables}</p>
                <p className="text-xs text-gray-500">
                  {estadisticas.totalPresupuestos > 0 
                    ? ((estadisticas.presupuestosRentables / estadisticas.totalPresupuestos) * 100).toFixed(1)
                    : 0}% del total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineTrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Con Pérdida</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.presupuestosPerdida}</p>
                <p className="text-xs text-gray-500">
                  {estadisticas.totalPresupuestos > 0 
                    ? ((estadisticas.presupuestosPerdida / estadisticas.totalPresupuestos) * 100).toFixed(1)
                    : 0}% del total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCash className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Margen Promedio</p>
                <p className={`text-2xl font-bold ${
                  estadisticas.margenPromedioGeneral > 0 ? 'text-green-600' :
                  estadisticas.margenPromedioGeneral < 0 ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {estadisticas.margenPromedioGeneral.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  {CurrencyUtils.formatAmount(estadisticas.margenBrutoTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <HiOutlineFilter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar presupuesto o cliente"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <Select
              value={filters.estado}
              onChange={(e) => handleFilterChange('estado', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="APROBADO">Aprobado</option>
              <option value="CONVERTIDO">Convertido</option>
              <option value="RECHAZADO">Rechazado</option>
            </Select>

            <Select
              value={filters.estadoMargen}
              onChange={(e) => handleFilterChange('estadoMargen', e.target.value)}
            >
              <option value="">Todos los márgenes</option>
              <option value="positivo">Rentables</option>
              <option value="negativo">Con Pérdida</option>
              <option value="equilibrio">En Equilibrio</option>
            </Select>

            <Input
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
              placeholder="Fecha desde"
            />

            <Input
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
              placeholder="Fecha hasta"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de márgenes */}
      <Card>
        <CardHeader>
          <CardTitle>Márgenes por Presupuesto</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="text-center py-12">
              <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar datos</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          ) : margenes.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineChartBar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron presupuestos con los filtros aplicados
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Presupuesto</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell className="text-right">Presupuestado</TableHeaderCell>
                  <TableHeaderCell className="text-right">Gastos</TableHeaderCell>
                  <TableHeaderCell className="text-right">Ventas</TableHeaderCell>
                  <TableHeaderCell className="text-right">Margen</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {margenes.map((margen) => (
                  <TableRow key={margen.presupuestoId}>
                    <TableCell>
                      <div>
                        <div className="font-mono font-bold text-blue-600">
                          {margen.numero}
                        </div>
                        <div className="text-sm text-gray-500">
                          {DateUtils.formatDate(margen.fechaEmision)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {margen.cliente}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-gray-900">
                        {CurrencyUtils.formatAmount(margen.presupuestoTotal, margen.moneda as any)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${margen.gastosTotal > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {margen.gastosTotal > 0 
                          ? CurrencyUtils.formatAmount(margen.gastosTotal, margen.moneda as any)
                          : '-'
                        }
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${margen.ventasTotal > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                        {margen.ventasTotal > 0 
                          ? CurrencyUtils.formatAmount(margen.ventasTotal, margen.moneda as any)
                          : '-'
                        }
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <span className={`font-bold ${getMargenColor(margen.estadoMargen)}`}>
                          {CurrencyUtils.formatAmount(margen.margenBruto, margen.moneda as any)}
                        </span>
                        <div className={`text-sm font-medium ${getMargenColor(margen.estadoMargen)}`}>
                          {margen.porcentajeMargen.toFixed(1)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMargenBadge(margen.estadoMargen)}`}>
                        {margen.estadoMargen === 'positivo' ? 'Rentable' :
                         margen.estadoMargen === 'negativo' ? 'Pérdida' :
                         'Equilibrio'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link href={`/presupuestos/${margen.presupuestoId}`}>
                          <Button variant="ghost" size="sm">
                            <HiOutlineEye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}