// src/app/api/transacciones/[id]/route.ts - NUEVO ARCHIVO
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { z } from 'zod';

const transaccionUpdateSchema = z.object({
  concepto: z.string().optional(),
  descripcion: z.string().optional(),
  monto: z.number().min(0.01).optional(),
  fecha: z.date().optional(),
  numeroComprobante: z.string().optional(),
  tipoComprobante: z.string().optional()
});

// GET - Obtener transacción por ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
    const transaccion = await prisma.transaccion.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { 
            id: true, 
            nombre: true, 
            email: true,
            telefono: true 
          }
        },
        proveedor: {
          select: { 
            id: true, 
            nombre: true, 
            email: true,
            telefono: true 
          }
        },
        pedido: {
          select: { 
            id: true, 
            numero: true,
            estado: true,
            total: true,
            totalCobrado: true,
            saldoPendiente: true
          }
        },
        medioPago: {
          select: { 
            id: true, 
            nombre: true 
          }
        },
        user: {
          select: { 
            id: true, 
            name: true 
          }
        },
        cheque: true
      }
    });

    if (!transaccion) {
      return NextResponse.json(
        { error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaccion);
  } catch (error: any) {
    console.error('Error al obtener transacción:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener transacción' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar transacción
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    const body = await req.json();
    
    const validatedData = transaccionUpdateSchema.parse(body);
    
    // Verificar que la transacción existe y que el usuario puede editarla
    const existingTransaccion = await prisma.transaccion.findUnique({
      where: { id },
      select: { 
        id: true, 
        userId: true, 
        tipo: true,
        pedidoId: true,
        monto: true 
      }
    });
    
    if (!existingTransaccion) {
      return NextResponse.json(
        { error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar permisos
    if (existingTransaccion.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para editar esta transacción' },
        { status: 403 }
      );
    }
    
    const transaccion = await prisma.transaccion.update({
      where: { id },
      data: validatedData,
      include: {
        cliente: { select: { id: true, nombre: true } },
        proveedor: { select: { id: true, nombre: true } },
        pedido: { select: { id: true, numero: true } },
        medioPago: { select: { id: true, nombre: true } },
        user: { select: { id: true, name: true } }
      }
    });
    
    return NextResponse.json(transaccion);
  } catch (error: any) {
    console.error('Error al actualizar transacción:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar transacción' },
      { status: 500 }
    );
  }
}

// DELETE - Anular/eliminar transacción
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
    // Obtener la transacción con todos los datos necesarios
    const existingTransaccion = await prisma.transaccion.findUnique({
      where: { id },
      include: {
        pedido: {
          select: { 
            id: true, 
            total: true, 
            totalCobrado: true, 
            saldoPendiente: true 
          }
        }
      }
    });
    
    if (!existingTransaccion) {
      return NextResponse.json(
        { error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar permisos
    if (existingTransaccion.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta transacción' },
        { status: 403 }
      );
    }
    
    // Si es un pago relacionado a un pedido, actualizar saldos
    if (existingTransaccion.pedidoId && 
        ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(existingTransaccion.tipo) &&
        existingTransaccion.pedido) {
      
      const nuevoTotalCobrado = existingTransaccion.pedido.totalCobrado.toNumber() - existingTransaccion.monto.toNumber();
      const nuevoSaldoPendiente = existingTransaccion.pedido.total.toNumber() - nuevoTotalCobrado;
      
      // Usar transacción de base de datos para mantener consistencia
      await prisma.$transaction(async (tx) => {
        // Eliminar la transacción
        await tx.transaccion.delete({
          where: { id }
        });
        
        // Actualizar el pedido
        await tx.pedido.update({
          where: { id: existingTransaccion.pedidoId! },
          data: {
            totalCobrado: Math.max(0, nuevoTotalCobrado),
            saldoPendiente: Math.max(0, nuevoSaldoPendiente),
            // Si el saldo vuelve a ser mayor que 0, cambiar estado si estaba cobrado
            ...(nuevoSaldoPendiente > 0 && { estado: 'ENTREGADO' })
          }
        });
      });
    } else {
      // Si no afecta pedidos, simplemente eliminar
      await prisma.transaccion.delete({
        where: { id }
      });
    }
    
    console.log('✅ Transacción eliminada exitosamente:', id);
    
    return NextResponse.json({ 
      message: 'Transacción eliminada correctamente',
      deletedId: id 
    });
  } catch (error: any) {
    console.error('❌ Error al eliminar transacción:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Error de constraint (relaciones existentes)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'No se puede eliminar la transacción porque tiene elementos relacionados' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al eliminar transacción' },
      { status: 500 }
    );
  }
}