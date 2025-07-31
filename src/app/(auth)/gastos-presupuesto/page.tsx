// src/app/(auth)/gastos-presupuesto/page.tsx
'use client';

import { useState } from 'react';
import { usePresupuestos } from '@/hooks/use-presupuestos';
import { GastosPresupuestoComponent } from '@/components/presupuestos/GastosPresupuestoComponent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { ESTADOS_PRESUPUESTO } from '@/lib/utils/validators';
import {
  HiOutlineSearch,
  HiOutlineDocumentText,
  HiOutlineReceiptTax,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineClipboardList,
  HiOutlineCash
} from 'react-icons/hi';
import { EstadoPresupuesto } from '@prisma/client';

interface PresupuestoSeleccionado {
  id: string;
  numero: string;
  cliente: {
    nombre: string;
  };
  total: number;
  moneda: string;
  estado: string;
  fechaEmision: string;
}

export default function GastosPresupuestoPage() {
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<PresupuestoSeleccionado | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showSelector, setShowSelector] = useState(true);

  // Hook para obtener presupuestos con filtros
  const { presupuestos, loading, estadisticas } = usePresupuestos({
    search: searchTerm,
    estado: filtroEstado,
    limit: 20
  });

  const handleSeleccionarPresupuesto = (presupuesto: any) => {
    setPresupuestoSeleccionado({
      id: presupuesto.id,
      numero: presupuesto.numero,
      cliente: presupuesto.cliente,
      total: presupuesto.total,
      moneda: presupuesto.moneda,
      estado: presupuesto.estado,
      fechaEmision: presupuesto.fechaEmision
    });
    setShowSelector(false);
  };

  const handleVolverSelector = () => {
    setPresupuestoSeleccionado(null);
    setShowSelector(true);
  };

  // Filtrar presupuestos que pueden tener gastos (no rechazados)
  const presupuestosDisponibles = presupuestos.filter(p => 
    p.estado !== EstadoPresupuesto.RECHAZADO
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos de Presupuestos</h1>
          <p className="text-gray-600">
            {presupuestoSeleccionado 
              ? `Gestiona los gastos del presupuesto ${presupuestoSeleccionado.numero}`
              : 'Selecciona un presupuesto para gestionar sus gastos asociados'
            }
          </p>
        </div>
        
        {presupuestoSeleccionado && (
          <Button 
            variant="outline" 
            onClick={handleVolverSelector}
            className="flex items-center"
          >
            <HiOutlineX className="h-4 w-4 mr-2" />
            Cambiar Presupuesto
          </Button>
        )}
      </div>

      {/* Selector de Presupuesto */}
      {showSelector && !presupuestoSeleccionado && (
        <div className="space-y-6">
          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <HiOutlineDocumentText className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Presupuestos</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <HiOutlineClipboardList className="h-8 w-8 text-green-600" />
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
                  <HiOutlineReceiptTax className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Convertidos</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.convertidos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <HiOutlineCash className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Monto Total</p>
                    <p className="text-lg font-bold text-gray-900">
                      {CurrencyUtils.formatAmount(estadisticas.montoTotal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros de búsqueda */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar Presupuesto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar por número, cliente o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <Select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(ESTADOS_PRESUPUESTO).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </Select>

                <div className="flex items-center text-sm text-gray-600">
                  {presupuestosDisponibles.length} presupuesto(s) encontrado(s)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de presupuestos */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Cargando presupuestos...</span>
                </div>
              ) : presupuestosDisponibles.length === 0 ? (
                <div className="text-center py-12">
                  <HiOutlineDocumentText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay presupuestos disponibles</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || filtroEstado 
                      ? 'No se encontraron presupuestos con esos criterios'
                      : 'No hay presupuestos para gestionar gastos'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {presupuestosDisponibles.map((presupuesto) => {
                    const estadoInfo = ESTADOS_PRESUPUESTO[presupuesto.estado as keyof typeof ESTADOS_PRESUPUESTO];
                    const dueStatus = DateUtils.getDueStatus(presupuesto.fechaValidez);
                    
                    return (
                      <div
                        key={presupuesto.id}
                        className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSeleccionarPresupuesto(presupuesto)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="font-mono font-bold text-lg text-blue-600">
                                {presupuesto.numero}
                              </div>
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
                            </div>
                            
                            <div className="mt-2">
                              <div className="font-medium text-gray-900">
                                {presupuesto.cliente.nombre}
                              </div>
                              <div className="text-sm text-gray-500 mt-1 max-w-md truncate">
                                {presupuesto.descripcionObra}
                              </div>
                            </div>
                            
                            <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                              <span>
                                Emisión: {DateUtils.formatDate(presupuesto.fechaEmision)}
                              </span>
                              <span className={dueStatus.color}>
                                Validez: {DateUtils.formatDate(presupuesto.fechaValidez)} ({dueStatus.message})
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {CurrencyUtils.formatAmount(presupuesto.total, presupuesto.moneda as any)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {presupuesto.items?.length || 0} item(s)
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <HiOutlineEye className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vista de gastos del presupuesto seleccionado */}
      {presupuestoSeleccionado && (
        <div className="space-y-6">
          {/* Información del presupuesto seleccionado */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-blue-800">
                    Presupuesto Seleccionado: {presupuestoSeleccionado.numero}
                  </CardTitle>
                  <p className="text-blue-600 mt-1">
                    Cliente: {presupuestoSeleccionado.cliente.nombre}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-800">
                    {CurrencyUtils.formatAmount(presupuestoSeleccionado.total, presupuestoSeleccionado.moneda as any)}
                  </div>
                  <div className="text-sm text-blue-600">
                    Estado: {ESTADOS_PRESUPUESTO[presupuestoSeleccionado.estado as keyof typeof ESTADOS_PRESUPUESTO]?.label}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Componente de gastos */}
          <GastosPresupuestoComponent
            presupuestoId={presupuestoSeleccionado.id}
            totalPresupuesto={presupuestoSeleccionado.total}
            monedaPresupuesto={presupuestoSeleccionado.moneda}
            showActions={true}
            compact={false}
          />
        </div>
      )}
    </div>
  );
}