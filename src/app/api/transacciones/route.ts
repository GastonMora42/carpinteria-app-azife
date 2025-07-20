// 1. PRIMERO: Verificar y corregir el API de transacciones
// src/app/api/transacciones/route.ts - VERSIÓN CORREGIDA

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transaccionSchema } from '@/lib/validations/transaccion';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tipo = searchParams.get('tipo');
    const clienteId = searchParams.get('clienteId');
    const pedidoId = searchParams.get('pedidoId');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    
    console.log('💰 Fetching transacciones with params:', {
      page, limit, tipo, clienteId, pedidoId, fechaDesde, fechaHasta
    });
    
    const skip = (page - 1) * limit;
    
    // CORREGIDO: Construir filtros más cuidadosamente
    const where: any = {};
    
    if (tipo) {
      where.tipo = tipo;
    }
    
    if (clienteId) {
      where.clienteId = clienteId;
    }
    
    // IMPORTANTE: Verificar que pedidoId sea válido antes de usarlo
    if (pedidoId && pedidoId.length > 0) {
      console.log('🔍 Filtering by pedidoId:', pedidoId);
      where.pedidoId = pedidoId;
    }
    
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) {
        where.fecha.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.fecha.lte = new Date(fechaHasta + 'T23:59:59');
      }
    }

    console.log('📋 Final where clause:', JSON.stringify(where, null, 2));

    // SEPARAR las consultas para mejor debugging
    console.log('🔍 Executing transacciones query...');
    const transacciones = await prisma.transaccion.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nombre: true }
        },
        proveedor: {
          select: { id: true, nombre: true }
        },
        pedido: {
          select: { id: true, numero: true }
        },
        medioPago: {
          select: { id: true, nombre: true }
        },
        user: {
          select: { id: true, name: true }
        },
        cheque: true
      },
      orderBy: { fecha: 'desc' },
      skip,
      take: limit
    });

    console.log('✅ Transacciones query completed, found:', transacciones.length);

    console.log('🔢 Executing count query...');
    const total = await prisma.transaccion.count({ 
      where: where // Usar el mismo where
    });

    console.log('✅ Count query completed, total:', total);

    return NextResponse.json({
      data: transacciones,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error: any) {
    console.error('❌ Error al obtener transacciones:', error);
    console.error('❌ Error stack:', error.stack);
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error al obtener transacciones',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const body = await req.json();
    console.log('📝 Creating transaccion with data:', {
      tipo: body.tipo,
      concepto: body.concepto,
      monto: body.monto,
      pedidoId: body.pedidoId || 'ninguno',
      clienteId: body.clienteId || 'ninguno'
    });
    
    const validatedData = transaccionSchema.parse(body);
    
    // Generar número único
    const count = await prisma.transaccion.count();
    const numero = `TRX-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    console.log('🔢 Generated transaction number:', numero);
    
    const result = await prisma.$transaction(async (tx) => {
      // Crear transacción
      console.log('💾 Creating transaccion in database...');
      const transaccion = await tx.transaccion.create({
        data: {
          numero,
          tipo: validatedData.tipo,
          concepto: validatedData.concepto,
          descripcion: validatedData.descripcion,
          monto: validatedData.monto,
          moneda: validatedData.moneda,
          cotizacion: validatedData.cotizacion,
          fecha: validatedData.fecha,
          fechaVencimiento: validatedData.fechaVencimiento,
          numeroComprobante: validatedData.numeroComprobante,
          tipoComprobante: validatedData.tipoComprobante,
          clienteId: validatedData.clienteId,
          proveedorId: validatedData.proveedorId,
          pedidoId: validatedData.pedidoId,
          medioPagoId: validatedData.medioPagoId,
          userId: user.id
        },
        include: {
          cliente: { select: { id: true, nombre: true } },
          proveedor: { select: { id: true, nombre: true } },
          pedido: { select: { id: true, numero: true } },
          medioPago: { select: { id: true, nombre: true } },
          user: { select: { id: true, name: true } }
        }
      });
      
      console.log('✅ Transaccion created with ID:', transaccion.id);
      
      // Si es un pago relacionado a un pedido, actualizar saldos
      if (validatedData.pedidoId && 
          ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(validatedData.tipo)) {
        
        console.log('🔄 Updating pedido saldos for:', validatedData.pedidoId);
        
        const pedido = await tx.pedido.findUnique({
          where: { id: validatedData.pedidoId },
          select: { 
            id: true, 
            total: true, 
            totalCobrado: true, 
            saldoPendiente: true 
          }
        });
        
        if (pedido) {
          const nuevoTotalCobrado = Number(pedido.totalCobrado) + validatedData.monto;
          const nuevoSaldoPendiente = Number(pedido.total) - nuevoTotalCobrado;
          
          console.log('💰 Updating saldos:', {
            totalAnterior: Number(pedido.totalCobrado),
            pago: validatedData.monto,
            nuevoTotal: nuevoTotalCobrado,
            nuevoSaldo: nuevoSaldoPendiente
          });
          
          await tx.pedido.update({
            where: { id: validatedData.pedidoId },
            data: {
              totalCobrado: nuevoTotalCobrado,
              saldoPendiente: Math.max(0, nuevoSaldoPendiente),
              // Actualizar estado si está completamente pagado
              estado: nuevoSaldoPendiente <= 0 ? 'COBRADO' : undefined
            }
          });
          
          console.log('✅ Pedido saldos updated successfully');
        } else {
          console.warn('⚠️ Pedido not found for ID:', validatedData.pedidoId);
        }
      }
      
      return transaccion;
    });
    
    console.log('🎉 Transaction completed successfully');
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error al crear transacción:', error);
    console.error('❌ Error stack:', error.stack);
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Errores de validación de Zod
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }
    
    // Errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una transacción con ese número' },
        { status: 409 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Referencia inválida - verifique cliente, pedido o medio de pago' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error al crear transacción',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// 2. COMANDOS PARA SOLUCIONAR PROBLEMAS DE PRISMA
// Ejecutar en la terminal del proyecto:

/*
# 1. Regenerar el cliente de Prisma
npx prisma generate

# 2. Verificar el estado de la base de datos
npx prisma db push --preview-feature

# 3. Si hay problemas con la base de datos, resetear y volver a crear
npx prisma migrate reset --force
npx prisma db push

# 4. Verificar que todo esté funcionando
npx prisma studio
*/
