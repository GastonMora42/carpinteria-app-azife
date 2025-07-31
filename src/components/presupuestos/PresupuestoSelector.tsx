// src/components/presupuestos/PresupuestoSelector.tsx

'use client';

import { useState } from 'react';
import { usePresupuestos } from '@/hooks/use-presupuestos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { ESTADOS_PRESUPUESTO } from '@/lib/utils/validators';
import {
  HiOutlineSearch,
  HiOutlineDocumentText,
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineX
} from 'react-icons/hi';

interface PresupuestoSelectorProps {
  onSeleccionar: (presupuesto: any) => void;
  onCancelar?: () => void;
  titulo?: string;
  descripcion?: string;
  filtroEstados?: string[];
  mostrarTodos?: boolean;
  compacto?: boolean;
}

export function PresupuestoSelector({
  onSeleccionar,
  onCancelar,
  titulo = "Seleccionar Presupuesto",
  descripcion = "Elige un presupuesto de la lista",
  filtroEstados,
  mostrarTodos = false,
  compacto = false
}: PresupuestoSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Hook para obtener presupuestos con filtros
  const { presupuestos, loading, estadisticas } = usePresupuestos({
    search: searchTerm,
    estado: filtroEstado,
    limit: compacto ? 10 : 20
  });

  // Filtrar presupuestos según los estados permitidos
  let presupuestosFiltrados = presupuestos;
  
  if (filtroEstados && filtroEstados.length > 0) {
    presupuestosFiltrados = presupuestos.filter(p => 
      filtroEstados.includes(p.estado)
    );
  } else if (!mostrarTodos) {
    // Por defecto, excluir cancelados y rechazados
    presupuestosFiltrados = presupuestos.filter(p => 
      !['CANCELADO', 'RECHAZADO'].includes(p.estado)
    );
  }

  const handleSeleccionar = (presupuesto: any) => {
    onSeleccionar(presupuesto);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{titulo}</h2>
          <p className="text-gray-600">{descripcion}</p>
        </div>
        
        {onCancelar && (
          <Button variant="outline" onClick={onCancelar}>
            <HiOutlineX className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        )}
      </div>

      {/* Estadísticas (solo si no es compacto) */}
      {!compacto && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <HiOutlineDocumentText className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-900">{estadisticas.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-500">Pendientes</p>
                  <p className="text-lg font-bold text-gray-900">{estadisticas.pendientes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-500">Aprobados</p>
                  <p className="text-lg font-bold text-gray-900">{estadisticas.aprobados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-500">Convertidos</p>
                  <p className="text-lg font-bold text-gray-900">{estadisticas.convertidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros de búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por número, cliente..."
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
              {presupuestosFiltrados.length} presupuesto(s) disponible(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de presupuestos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Presupuestos Disponibles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando presupuestos...</span>
            </div>
          ) : presupuestosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <HiOutlineDocumentText className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay presupuestos disponibles</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filtroEstado 
                  ? 'No se encontraron presupuestos con esos criterios'
                  : 'No hay presupuestos que cumplan los filtros'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {presupuestosFiltrados.map((presupuesto) => {
                const estadoInfo = ESTADOS_PRESUPUESTO[presupuesto.estado as keyof typeof ESTADOS_PRESUPUESTO];
                const dueStatus = DateUtils.getDueStatus(presupuesto.fechaValidez);
                
                return (
                  <div
                    key={presupuesto.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      compacto ? 'py-3' : 'py-4'
                    }`}
                    onClick={() => handleSeleccionar(presupuesto)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`font-mono font-bold ${compacto ? 'text-sm' : 'text-base'} text-blue-600`}>
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
                        
                        <div className="mt-1">
                          <div className={`font-medium text-gray-900 ${compacto ? 'text-sm' : ''}`}>
                            {presupuesto.cliente.nombre}
                          </div>
                          {!compacto && (
                            <div className="text-sm text-gray-500 mt-1 max-w-md truncate">
                              {presupuesto.descripcionObra}
                            </div>
                          )}
                        </div>
                        
                        <div className={`mt-2 flex items-center space-x-4 text-xs text-gray-500 ${
                          compacto ? 'text-xs' : 'text-sm'
                        }`}>
                          <span>
                            {DateUtils.formatDate(presupuesto.fechaEmision)}
                          </span>
                          {!compacto && (
                            <span className={dueStatus.color}>
                              Vence: {DateUtils.formatDate(presupuesto.fechaValidez)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`font-bold text-gray-900 ${compacto ? 'text-sm' : 'text-base'}`}>
                            {CurrencyUtils.formatAmount(presupuesto.total, presupuesto.moneda as any)}
                          </div>
                          {!compacto && (
                            <div className="text-xs text-gray-500">
                              {presupuesto.items?.length || 0} item(s)
                            </div>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <HiOutlineCheck className="h-4 w-4" />
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
  );
}