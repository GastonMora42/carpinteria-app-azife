// src/app/api/ventas/[id]/balance/route.ts - NUEVA API PARA BALANCE POR MEDIO DE PAGO
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

// GET - Obtener balance detallado de una venta por medio de pago
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
    console.log('💰 Fetching balance for venta:', id);

    // Obtener información básica de la venta
    const venta = await prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, nombre: true }
        }
      }
    });

    if (!venta) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      );
    }

    // Obtener todos los pagos de esta venta agrupados por medio de pago
    const pagosRaw = await prisma.transaccion.findMany({
      where: {
        pedidoId: id,
        tipo: 'PAGO_OBRA'
      },
      include: {
        medioPago: {
          select: { id: true, nombre: true, descripcion: true }
        },
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });

    // Agrupar pagos por medio de pago
    const pagosPorMedio = pagosRaw.reduce((acc: any, pago) => {
      const medioId = pago.medioPago.id;
      const medioNombre = pago.medioPago.nombre;

      if (!acc[medioId]) {
        acc[medioId] = {
          medioPago: {
            id: medioId,
            nombre: medioNombre,
            descripcion: pago.medioPago.descripcion
          },
          transacciones: [],
          totalCobrado: 0,
          cantidadPagos: 0,
          ultimoPago: null,
          primerPago: null
        };
      }

      acc[medioId].transacciones.push(pago);
      acc[medioId].totalCobrado += Number(pago.monto);
      acc[medioId].cantidadPagos += 1;

      // Actualizar fechas de primer y último pago
      const fechaPago = new Date(pago.fecha);
      if (!acc[medioId].ultimoPago || fechaPago > new Date(acc[medioId].ultimoPago)) {
        acc[medioId].ultimoPago = pago.fecha;
      }
      if (!acc[medioId].primerPago || fechaPago < new Date(acc[medioId].primerPago)) {
        acc[medioId].primerPago = pago.fecha;
      }

      return acc;
    }, {});

    // Convertir a array y calcular estadísticas
    const balancePorMedio = Object.values(pagosPorMedio).map((medio: any) => ({
      ...medio,
      porcentajeDelTotal: Number(venta.total) > 0 ? (medio.totalCobrado / Number(venta.total)) * 100 : 0,
      pagoPromedio: medio.cantidadPagos > 0 ? medio.totalCobrado / medio.cantidadPagos : 0
    }));
    // Calcular totales generales
    const totalCobrado = balancePorMedio.reduce((sum, medio) => sum + medio.totalCobrado, 0);
    const saldoPendiente = Number(venta.total) - totalCobrado;
    const porcentajeCobrado = Number(venta.total) > 0 ? (totalCobrado / Number(venta.total)) * 100 : 0;

    // Obtener el medio de pago más usado
    const medioMasUsado = balancePorMedio.length > 0 
      ? balancePorMedio.reduce((prev, current) => 
          prev.cantidadPagos > current.cantidadPagos ? prev : current
        )
      : null;

    const response = {
      venta: {
        id: venta.id,
        numero: venta.numero,
        cliente: venta.cliente,
        total: Number(venta.total),
        moneda: venta.moneda,
        fechaPedido: venta.fechaPedido
      },
      balance: {
        totalCobrado,
        saldoPendiente,
        porcentajeCobrado,
        cantidadMediosPago: balancePorMedio.length,
        cantidadTransacciones: pagosRaw.length
      },
      balancePorMedio,
      estadisticas: {
        medioMasUsado: medioMasUsado ? {
          nombre: medioMasUsado.medioPago.nombre,
          cantidad: medioMasUsado.cantidadPagos,
          monto: medioMasUsado.totalCobrado
        } : null,
        distribucion: balancePorMedio.map(medio => ({
          medio: medio.medioPago.nombre,
          porcentaje: medio.porcentajeDelTotal,
          monto: medio.totalCobrado
        }))
      },
      ultimaActualizacion: new Date().toISOString()
    };

    console.log('✅ Balance calculated successfully:', {
      totalCobrado,
      mediosUsados: balancePorMedio.length,
      transacciones: pagosRaw.length
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error calculating balance:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al calcular balance' },
      { status: 500 }
    );
  }
}