// src/components/layouts/Sidebar.tsx - ACTUALIZADO CON LOGO
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  HiOutlineHome, 
  HiOutlineUsers, 
  HiOutlineClipboardCheck,
  HiOutlineCash,
  HiOutlineDatabase,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineCreditCard,
  HiOutlineCollection,
  HiOutlineTruck
} from 'react-icons/hi';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HiOutlineHome },
  { 
    name: 'Ventas', 
    href: '/ventas', 
    icon: HiOutlineClipboardCheck,
    submenu: [
      { name: 'Todas las Ventas', href: '/ventas' },
      { name: 'Nueva Venta', href: '/ventas/nueva' },
      { name: 'Por Estado', href: '/ventas/estados' }
    ]
  },
  { 
    name: 'Presupuestos', 
    href: '/presupuestos', 
    icon: HiOutlineDocumentText,
    submenu: [
      { name: 'Todos', href: '/presupuestos' },
      { name: 'Nuevo Presupuesto', href: '/presupuestos/nuevo' },
    ]
  },
  { 
    name: 'Clientes', 
    href: '/clientes', 
    icon: HiOutlineUsers,
    submenu: [
      { name: 'Todos los Clientes', href: '/clientes' },
    ]
  },
  { 
    name: 'Finanzas', 
    href: '/finanzas', 
    icon: HiOutlineCash,
    submenu: [
      { name: 'Resumen', href: '/finanzas' },
      { name: 'Transacciones', href: '/finanzas/transacciones' },
      { name: 'Cheques', href: '/finanzas/cheques' },
      { name: 'Saldos por Cobrar', href: '/finanzas/saldos' },
      { name: 'Gastos Generales', href: '/finanzas/gastos' },
      { name: 'Análisis de Márgenes', href: '/finanzas/margenes' }
    ]
  },
  { 
    name: 'Materiales', 
    href: '/materiales', 
    icon: HiOutlineCollection,
    submenu: [
      { name: 'Catálogo', href: '/materiales' },
      { name: 'Proveedores', href: '/materiales/proveedores' },
      { name: 'Nuevo Material', href: '/materiales/nuevo' }
    ]
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-blue-800 to-blue-900 pt-5 pb-4 overflow-y-auto shadow-lg">
          {/* Logo mejorado */}
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <Link href="/dashboard" className="flex items-center group">
              <div className="bg-white p-2 rounded-xl mr-3 shadow-md group-hover:shadow-lg transition-shadow">
                <Image 
                  src="/alumac.webp" 
                  alt="AlumGestión Logo" 
                  width={32} 
                  height={32}
                  className="rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">AZIFE</h1>
                <p className="text-blue-200 text-xs">Sistema de Gestión</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = isActiveRoute(item.href);
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              
              return (
                <div key={item.name} className="space-y-1">
                  <Link
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-900 text-white border-r-4 border-blue-300 shadow-inner'
                        : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-l-md transition-all duration-200`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'
                      } mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200`}
                      aria-hidden="true"
                    />
                    {item.name}
                    {hasSubmenu && (
                      <svg 
                        className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                          isActive ? 'rotate-90' : ''
                        }`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                  
                  {/* Submenu */}
                  {hasSubmenu && isActive && (
                    <div className="ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {item.submenu?.map((subitem) => (
                        <Link
                          key={subitem.name}
                          href={subitem.href}
                          className={`${
                            pathname === subitem.href
                              ? 'bg-blue-800 text-white'
                              : 'text-blue-200 hover:text-white hover:bg-blue-700'
                          } group flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200`}
                        >
                          <div className="w-1.5 h-1.5 bg-current rounded-full mr-2 opacity-60" />
                          {subitem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer mejorado */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-blue-700">
            <div className="bg-blue-800 rounded-lg p-3 text-center">
              <div className="text-xs text-blue-200 mb-2">
                <p className="font-semibold">AZIFE v1.0</p>
                <p>© 2025 AZIFE</p>
              </div>
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">Sistema Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}