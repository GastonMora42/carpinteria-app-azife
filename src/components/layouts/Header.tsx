// src/components/layouts/Header.tsx - ACTUALIZADO CON BÚSQUEDA GLOBAL
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NumberSearch } from '@/components/common/NumberSearch';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { 
  HiOutlineBell, 
  HiOutlineSearch, 
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineMenu,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineCash,
  HiOutlineX,
  HiOutlineExternalLink
} from 'react-icons/hi';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuToggle?: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface GlobalSearchResult {
  id: string;
  type: 'presupuesto' | 'pedido' | 'transaccion';
  numero: string;
  titulo: string;
  subtitulo: string;
  total?: number;
  moneda?: string;
  fecha: string;
  estado?: string;
  url: string;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<GlobalSearchResult[]>([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  
  const { unreadCount } = useNotifications();
  const globalSearchRef = useRef<HTMLDivElement>(null);

  // Obtener información del usuario al cargar
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error obteniendo información del usuario:', error);
      }
    };

    fetchUser();
  }, []);

  // Búsqueda global
  const performGlobalSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setGlobalSearchResults([]);
      return;
    }

    setGlobalSearchLoading(true);
    try {
      const searchPromises = [
        // Buscar presupuestos
        fetch(`/api/presupuestos?search=${encodeURIComponent(query)}&limit=5`, {
          credentials: 'include'
        }).then(res => res.ok ? res.json() : { data: [] }),
        
        // Buscar ventas/pedidos
        fetch(`/api/ventas?search=${encodeURIComponent(query)}&limit=5`, {
          credentials: 'include'
        }).then(res => res.ok ? res.json() : { data: [] }),
        
        // Buscar transacciones
        fetch(`/api/transacciones?search=${encodeURIComponent(query)}&limit=5`, {
          credentials: 'include'
        }).then(res => res.ok ? res.json() : { data: [] })
      ];

      const [presupuestos, ventas, transacciones] = await Promise.all(searchPromises);

      const results: GlobalSearchResult[] = [];

      // Procesar presupuestos
      (presupuestos.data || []).forEach((item: any) => {
        results.push({
          id: item.id,
          type: 'presupuesto',
          numero: item.numero,
          titulo: item.cliente?.nombre || 'Cliente no especificado',
          subtitulo: item.descripcionObra || 'Sin descripción',
          total: item.total,
          moneda: item.moneda,
          fecha: item.fechaEmision,
          estado: item.estado,
          url: `/presupuestos/${item.id}`
        });
      });

      // Procesar ventas
      (ventas.data || []).forEach((item: any) => {
        results.push({
          id: item.id,
          type: 'pedido',
          numero: item.numero,
          titulo: item.cliente?.nombre || 'Cliente no especificado',
          subtitulo: item.descripcionObra || 'Sin descripción',
          total: item.total,
          moneda: item.moneda,
          fecha: item.fechaPedido,
          estado: item.estado,
          url: `/ventas/${item.id}`
        });
      });

      // Procesar transacciones
      (transacciones.data || []).forEach((item: any) => {
        results.push({
          id: item.id,
          type: 'transaccion',
          numero: item.numero,
          titulo: item.cliente?.nombre || item.proveedor?.nombre || 'Sin asociar',
          subtitulo: item.concepto || 'Sin concepto',
          total: item.monto,
          moneda: item.moneda,
          fecha: item.fecha,
          url: `/finanzas/transacciones/${item.id}`
        });
      });

      // Ordenar por relevancia y fecha
      results.sort((a, b) => {
        // Priorizar coincidencias exactas en el número
        const aExactMatch = a.numero.toLowerCase().includes(query.toLowerCase());
        const bExactMatch = b.numero.toLowerCase().includes(query.toLowerCase());
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // Luego por fecha (más recientes primero)
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });

      setGlobalSearchResults(results.slice(0, 15)); // Máximo 15 resultados
    } catch (error) {
      console.error('Error en búsqueda global:', error);
      setGlobalSearchResults([]);
    } finally {
      setGlobalSearchLoading(false);
    }
  };

  // Debounced search para búsqueda global
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isGlobalSearchOpen) {
        performGlobalSearch(globalSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [globalSearchQuery, isGlobalSearchOpen]);

  // Manejar clic fuera del dropdown de búsqueda
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (globalSearchRef.current && !globalSearchRef.current.contains(event.target as Node)) {
        setIsGlobalSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        window.location.href = '/login';
      } else {
        console.error('Error en logout');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error en logout:', error);
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      'ADMIN': 'Administrador',
      'MANAGER': 'Gerente',
      'USER': 'Usuario'
    };
    return roleLabels[role] || role;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'presupuesto':
        return <HiOutlineDocumentText className="h-4 w-4 text-blue-600" />;
      case 'pedido':
        return <HiOutlineClipboardCheck className="h-4 w-4 text-green-600" />;
      case 'transaccion':
        return <HiOutlineCash className="h-4 w-4 text-purple-600" />;
      default:
        return <HiOutlineDocumentText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'presupuesto':
        return 'Presupuesto';
      case 'pedido':
        return 'Venta';
      case 'transaccion':
        return 'Transacción';
      default:
        return 'Documento';
    }
  };

  if (!user) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onMenuToggle}
            >
              <HiOutlineMenu className="h-5 w-5" />
            </Button>

            {/* Búsqueda global mejorada */}
            <div className="hidden md:block relative" ref={globalSearchRef}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar presupuestos, ventas, transacciones..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  onFocus={() => setIsGlobalSearchOpen(true)}
                  className="block w-80 pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                
                {globalSearchLoading && (
                  <div className="absolute inset-y-0 right-8 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {globalSearchQuery && (
                  <button
                    onClick={() => {
                      setGlobalSearchQuery('');
                      setGlobalSearchResults([]);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <HiOutlineX className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Dropdown de resultados de búsqueda global */}
              {isGlobalSearchOpen && globalSearchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
                  <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">
                        {globalSearchResults.length} resultado(s) encontrado(s)
                      </span>
                      <span className="text-xs text-gray-500">
                        Presiona Enter para ver todos
                      </span>
                    </div>
                  </div>
                  
                  <div className="py-1">
                    {globalSearchResults.map((result) => (
                      <a
                        key={`${result.type}-${result.id}`}
                        href={result.url}
                        className="block px-3 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        onClick={() => setIsGlobalSearchOpen(false)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            {getTypeIcon(result.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-sm text-blue-600">
                                  {result.numero}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                  {getTypeLabel(result.type)}
                                </span>
                                {result.estado && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                    {result.estado}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {result.titulo}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {result.subtitulo}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {result.total && (
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {CurrencyUtils.formatAmount(result.total, result.moneda as any)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {DateUtils.formatDate(result.fecha)}
                                </div>
                              </div>
                            )}
                            <HiOutlineExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>

                  <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
                    <div className="text-xs text-gray-500 text-center">
                      Mostrando primeros {globalSearchResults.length} resultados
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje cuando no hay resultados */}
              {isGlobalSearchOpen && globalSearchResults.length === 0 && globalSearchQuery.length >= 2 && !globalSearchLoading && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    No se encontraron resultados para "{globalSearchQuery}"
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Búsqueda móvil */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => {
                // Implementar modal de búsqueda para móvil
                console.log('Abrir búsqueda móvil');
              }}
            >
              <HiOutlineSearch className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative"
              >
                <HiOutlineBell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>

            {/* User profile */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2"
              >
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getInitials(user.name)}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700">{user.name}</p>
                  <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                </div>
              </Button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-blue-600">{getRoleLabel(user.role)}</p>
                    </div>
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <HiOutlineUser className="mr-3 h-4 w-4" />
                      Mi Perfil
                    </button>
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <HiOutlineCog className="mr-3 h-4 w-4" />
                      Configuración
                    </button>
                    <div className="border-t border-gray-200">
                      <button 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <HiOutlineLogout className="mr-3 h-4 w-4" />
                        {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Overlay para cerrar dropdown */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsProfileOpen(false)}
        />
      )}
    </>
  );
}