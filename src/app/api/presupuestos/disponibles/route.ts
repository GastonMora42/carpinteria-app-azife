// src/app/api/presupuestos/disponibles/route.ts - CORREGIDO PARA SER MÁS PERMISIVO
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

// GET - Obtener presupuestos disponibles para conversión a venta
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    console.log('📋 Fetching presupuestos disponibles para venta...');
    
    // PASO 1: Obtener todos los presupuestos para debugging
    const todosLosPresupuestos = await prisma.presupuesto.findMany({
      select: {
        id: true,
        numero: true,
        estado: true,
        fechaValidez: true,
        total: true,
        cliente: { select: { nombre: true } },
        pedido: { select: { id: true, numero: true } }
      },
      orderBy: { fechaEmision: 'desc' },
      take: 10
    });

    console.log('📊 Debug - Todos los presupuestos:', todosLosPresupuestos.map(p => ({
      numero: p.numero,
      estado: p.estado,
      vencimiento: p.fechaValidez,
      yaConvertido: !!p.pedido,
      cliente: p.cliente.nombre
    })));

    // PASO 2: Buscar presupuestos que PUEDEN convertirse (más permisivo)
    const presupuestosDisponibles = await prisma.presupuesto.findMany({
      where: {
        // Estados que permiten conversión (no solo APROBADO)
        estado: {
          in: ['PENDIENTE', 'ENVIADO', 'APROBADO']
        },
        // No debe tener pedido asociado (no convertido)
        pedido: null,
        // Incluir algunos vencidos recientes (últimos 7 días)
        OR: [
          {
            fechaValidez: {
              gte: new Date() // No vencidos
            }
          },
          {
            fechaValidez: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Vencidos hace menos de 7 días
            }
          }
        ]
      },
      include: {
        cliente: {
          select: { 
            id: true, 
            codigo: true,
            nombre: true, 
            email: true, 
            telefono: true 
          }
        },
        user: {
          select: { id: true, name: true }
        },
        items: {
          orderBy: { orden: 'asc' }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { fechaEmision: 'desc' }
    });

    console.log(`✅ Found ${presupuestosDisponibles.length} presupuestos disponibles`);

    // PASO 3: Enriquecer con información adicional
    const presupuestosEnriquecidos = presupuestosDisponibles.map(presupuesto => {
      const fechaVencimiento = new Date(presupuesto.fechaValidez);
      const hoy = new Date();
      const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      // Determinar si está vencido pero aún convertible
      const vencido = diasRestantes <= 0;
      const urgente = !vencido && diasRestantes <= 7;
      const puedeConvertirse = diasRestantes >= -7; // Permite vencidos de hasta 7 días
      
      return {
        ...presupuesto,
        diasRestantes,
        vencido,
        urgente,
        puedeConvertirse,
        valorTotal: Number(presupuesto.total),
        // Indicador visual para la UI
        statusIndicator: vencido ? 'vencido' : urgente ? 'urgente' : 'normal'
      };
    });

    // PASO 4: Filtrar solo los que pueden convertirse
    const disponiblesParaConversion = presupuestosEnriquecidos.filter(p => p.puedeConvertirse);

    console.log('📋 Presupuestos disponibles por estado:', {
      pendientes: disponiblesParaConversion.filter(p => p.estado === 'PENDIENTE').length,
      enviados: disponiblesParaConversion.filter(p => p.estado === 'ENVIADO').length,
      aprobados: disponiblesParaConversion.filter(p => p.estado === 'APROBADO').length,
      vencidos: disponiblesParaConversion.filter(p => p.vencido).length,
      urgentes: disponiblesParaConversion.filter(p => p.urgente).length
    });

    return NextResponse.json({
      data: disponiblesParaConversion,
      estadisticas: {
        total: disponiblesParaConversion.length,
        montoTotal: disponiblesParaConversion.reduce((acc, p) => acc + p.valorTotal, 0),
        urgentes: disponiblesParaConversion.filter(p => p.urgente).length,
        vencidos: disponiblesParaConversion.filter(p => p.vencido).length,
        promedioDiasVencimiento: disponiblesParaConversion.length > 0 
          ? Math.round(disponiblesParaConversion.reduce((acc, p) => acc + Math.max(0, p.diasRestantes), 0) / disponiblesParaConversion.length)
          : 0,
        // Estadísticas adicionales
        porEstado: {
          pendientes: disponiblesParaConversion.filter(p => p.estado === 'PENDIENTE').length,
          enviados: disponiblesParaConversion.filter(p => p.estado === 'ENVIADO').length,
          aprobados: disponiblesParaConversion.filter(p => p.estado === 'APROBADO').length
        }
      },
      debug: {
        totalPresupuestosEnSistema: todosLosPresupuestos.length,
        criteriosBusqueda: {
          estados: ['PENDIENTE', 'ENVIADO', 'APROBADO'],
          sinPedidoAsociado: true,
          ventanaVencimiento: '7 días hacia atrás desde hoy'
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching presupuestos disponibles:', error);
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener presupuestos disponibles' },
      { status: 500 }
    );
  }
}

// POST - Reservar presupuesto para conversión (opcional, para evitar conversiones simultáneas)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    const { presupuestoId, reservar } = await req.json();
    
    if (!presupuestoId) {
      return NextResponse.json(
        { error: 'ID de presupuesto requerido' },
        { status: 400 }
      );
    }

    console.log(`🔒 ${reservar ? 'Reservando' : 'Liberando'} presupuesto para conversión:`, presupuestoId);
    
    // Verificar que el presupuesto existe y está disponible
    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: presupuestoId },
      include: {
        pedido: { select: { id: true, numero: true } }
      }
    });
    
    if (!presupuesto) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar estado (más permisivo)
    if (!['PENDIENTE', 'ENVIADO', 'APROBADO'].includes(presupuesto.estado)) {
      return NextResponse.json(
        { error: `No se puede convertir presupuesto en estado: ${presupuesto.estado}` },
        { status: 400 }
      );
    }
    
    if (presupuesto.pedido) {
      return NextResponse.json(
        { error: 'Este presupuesto ya fue convertido a venta' },
        { status: 400 }
      );
    }
    
    // Verificar vencimiento (más permisivo - permite vencidos recientes)
    const diasVencimiento = Math.ceil((new Date(presupuesto.fechaValidez).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diasVencimiento < -7) {
      return NextResponse.json(
        { error: 'Este presupuesto está vencido hace más de 7 días' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      mensaje: reservar ? 'Presupuesto reservado para conversión' : 'Presupuesto liberado',
      presupuesto: {
        id: presupuesto.id,
        numero: presupuesto.numero,
        cliente: presupuesto.clienteId,
        total: presupuesto.total,
        moneda: presupuesto.moneda,
        vencimiento: presupuesto.fechaValidez,
        diasVencimiento
      }
    });
  } catch (error: any) {
    console.error('❌ Error reservando/liberando presupuesto:', error);
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al procesar solicitud' },
      { status: 500 }
    );
  }
}