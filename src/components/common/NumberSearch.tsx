// src/components/common/NumberSearch.tsx - COMPONENTE REUTILIZABLE PARA BÚSQUEDA POR NÚMERO
'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import {
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineCash,
  HiOutlineExternalLink
} from 'react-icons/hi';

interface NumberSearchProps {
  placeholder?: string;
  onSelect?: (item: any) => void;
  onSearch?: (query: string) => void;
  type: 'presupuesto' | 'pedido' | 'transaccion';
  className?: string;
  showResults?: boolean;
  maxResults?: number;
}

interface SearchResult {
  id: string;
  numero: string;
  cliente?: { nombre: string };
  proveedor?: { nombre: string };
  total?: number;
  moneda?: string;
  fecha?: string;
  estado?: string;
  descripcionObra?: string;
}

export function NumberSearch({
  placeholder = "Buscar por número...",
  onSelect,
  onSearch,
  type,
  className = "",
  showResults = true,
  maxResults = 8
}: NumberSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Función para buscar
  const searchNumbers = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const endpoint = `/api/${type === 'pedido' ? 'ventas' : type + 's'}`;
      const response = await fetch(
        `${endpoint}?numero=${encodeURIComponent(searchQuery)}&limit=${maxResults}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.data || []);
        setShowDropdown(data.data?.length > 0);
        setSelectedIndex(-1);
      } else {
        console.error('Error searching:', response.statusText);
        setResults([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('Error searching numbers:', error);
      setResults([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchNumbers(query);
      if (onSearch) {
        onSearch(query);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  // Manejar selección con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Manejar selección de resultado
  const handleSelect = (item: SearchResult) => {
    setQuery(item.numero);
    setShowDropdown(false);
    setSelectedIndex(-1);
    
    if (onSelect) {
      onSelect(item);
    }
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Obtener icono según el tipo
  const getIcon = () => {
    switch (type) {
      case 'presupuesto':
        return <HiOutlineDocumentText className="h-4 w-4" />;
      case 'pedido':
        return <HiOutlineClipboardCheck className="h-4 w-4" />;
      case 'transaccion':
        return <HiOutlineCash className="h-4 w-4" />;
      default:
        return <HiOutlineSearch className="h-4 w-4" />;
    }
  };

  // Obtener URL para navegación
  const getItemUrl = (item: SearchResult) => {
    switch (type) {
      case 'presupuesto':
        return `/presupuestos/${item.id}`;
      case 'pedido':
        return `/ventas/${item.id}`;
      case 'transaccion':
        return `/finanzas/transacciones/${item.id}`;
      default:
        return '#';
    }
  };

  // Formatear título del resultado
  const formatResultTitle = (item: SearchResult) => {
    const clienteNombre = item.cliente?.nombre || item.proveedor?.nombre || '';
    return clienteNombre;
  };

  // Formatear subtítulo del resultado
  const formatResultSubtitle = (item: SearchResult) => {
    if (item.descripcionObra) {
      return item.descripcionObra.length > 50 
        ? item.descripcionObra.substring(0, 50) + '...'
        : item.descripcionObra;
    }
    
    if (item.fecha) {
      return DateUtils.formatDate(item.fecha);
    }
    
    return '';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {getIcon()}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />

        {/* Indicador de carga */}
        {loading && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Botón limpiar */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <HiOutlineX className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {showResults && showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto"
        >
          {/* Header del dropdown */}
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">
                {results.length} resultado(s) encontrado(s)
              </span>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiOutlineX className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Lista de resultados */}
          <div className="py-1">
            {results.map((item, index) => (
              <div
                key={item.id}
                className={`px-3 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                  index === selectedIndex 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="font-mono font-bold text-blue-600 text-sm">
                        {item.numero}
                      </span>
                      {item.estado && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {item.estado}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {formatResultTitle(item)}
                    </div>
                    
                    {formatResultSubtitle(item) && (
                      <div className="text-xs text-gray-500 truncate">
                        {formatResultSubtitle(item)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {item.total && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {CurrencyUtils.formatAmount(item.total, item.moneda as any)}
                        </div>
                        {item.fecha && (
                          <div className="text-xs text-gray-500">
                            {DateUtils.formatDate(item.fecha)}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <a
                      href={getItemUrl(item)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <HiOutlineExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer con información adicional */}
          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              Usa las flechas ↑↓ para navegar, Enter para seleccionar
            </div>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay resultados */}
      {showDropdown && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-3 py-4 text-center text-gray-500 text-sm">
            No se encontraron {type}s con el número "{query}"
          </div>
        </div>
      )}
    </div>
  );
}

// Hook personalizado para usar la búsqueda
export function useNumberSearch(type: 'presupuesto' | 'pedido' | 'transaccion') {
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (item: SearchResult) => {
    setSelectedItem(item);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSelection = () => {
    setSelectedItem(null);
    setSearchQuery('');
  };

  return {
    selectedItem,
    searchQuery,
    handleSelect,
    handleSearch,
    clearSelection
  };
}