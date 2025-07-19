// src/app/api/ventas/route.ts - VERSIÓN MEJORADA Y PROFESIONALIZADA
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ventaSchema } from '@/lib/validations/venta';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { CalculationUtils } from '@/lib/utils/calculations';
import { ZodError } from 'zod';

// GET - Listar ventas/pedidos
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const estado = searchParams.get('estado');
    const clienteId = searchParams.get('clienteId');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (estado) {
      where.estado = estado;
    }
    
    if (clienteId) {
      where.clienteId = clienteId;
    }
    
    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { descripcionObra: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: {
          cliente: {
            select: { id: true, nombre: true, email: true, telefono: true }
          },
          presupuesto: {
            select: { id: true, numero: true }
          },
          user: {
            select: { id: true, name: true }
          },
          items: {
            orderBy: { orden: 'asc' }
          },
          _count: {
            select: { 
              transacciones: true,
              materiales: true,
              items: true
            }
          }
        },
        orderBy: { fechaPedido: 'desc' },
        skip,
        take: limit
      }),
      prisma.pedido.count({ where })
    ]);

    console.log(`✅ Ventas fetched successfully: ${pedidos.length} (total: ${total})`);

    return NextResponse.json({
      data: pedidos,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error: any) {
    console.error('❌ Error al obtener ventas:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener ventas' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva venta
export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const body = await req.json();
    console.log('📝 Datos recibidos para crear venta:', {
      clienteId: body.clienteId,
      presupuestoId: body.presupuestoId || 'ninguno',
      fechaEntrega: body.fechaEntrega,
      tipoVenta: body.presupuestoId ? 'desde presupuesto' : 'directa',
      itemsCount: body.items?.length || 0
    });
    
    // Validar datos con el schema corregido
    let validatedData;
    try {
      validatedData = ventaSchema.parse(body);
      console.log('✅ Datos validados exitosamente');
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        console.error('❌ Error de validación:', validationError.errors);
        return NextResponse.json(
          { 
            error: 'Datos inválidos', 
            details: validationError.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              received: err.code === 'invalid_type' ? `Received: ${(err as any).received}, Expected: ${(err as any).expected}` : undefined
            }))
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
    
    // Generar número único para la venta
    const count = await prisma.pedido.count();
    const numero = `VEN-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    console.log('🔢 Número generado para venta:', numero);
    
    let subtotal = 0;
    let total = 0;
    let descuentoTotal = 0;
    let impuestosTotal = 0;

    // CASO 1: Venta desde presupuesto
    if (validatedData.presupuestoId) {
      console.log('🔄 Procesando venta desde presupuesto:', validatedData.presupuestoId);
      
      const presupuestoData = await prisma.presupuesto.findUnique({
        where: { id: validatedData.presupuestoId },
        include: { 
          items: true,
          cliente: { select: { nombre: true } }
        }
      });

      if (!presupuestoData) {
        console.error('❌ Presupuesto no encontrado:', validatedData.presupuestoId);
        return NextResponse.json(
          { error: 'Presupuesto no encontrado' },
          { status: 404 }
        );
      }

      // Verificar que el presupuesto esté en estado válido para conversión
      if (!['PENDIENTE', 'ENVIADO', 'APROBADO'].includes(presupuestoData.estado)) {
        console.error('❌ Estado de presupuesto inválido para conversión:', presupuestoData.estado);
        return NextResponse.json(
          { error: `No se puede convertir presupuesto en estado: ${presupuestoData.estado}` },
          { status: 400 }
        );
      }

      // Verificar que no esté ya convertido
      const existingPedido = await prisma.pedido.findFirst({
        where: { presupuestoId: validatedData.presupuestoId }
      });

      if (existingPedido) {
        console.error('❌ Presupuesto ya convertido:', existingPedido.numero);
        return NextResponse.json(
          { error: `Este presupuesto ya fue convertido a la venta ${existingPedido.numero}` },
          { status: 400 }
        );
      }

      subtotal = Number(presupuestoData.subtotal);
      descuentoTotal = Number(presupuestoData.descuento) || 0;
      impuestosTotal = Number(presupuestoData.impuestos) || 0;
      total = Number(presupuestoData.total);

      console.log(`💰 Totales desde presupuesto "${presupuestoData.numero}":`, {
        subtotal,
        descuentoTotal,
        impuestosTotal,
        total,
        itemsCount: presupuestoData.items.length
      });
    } 
    // CASO 2: Venta directa con items
    else if (validatedData.items && validatedData.items.length > 0) {
      console.log('🧮 Procesando venta directa con', validatedData.items.length, 'items');
      
      const totales = CalculationUtils.calculateOrderTotals(
        validatedData.items,
        validatedData.descuento || 0,
        validatedData.impuestos || 0
      );

      subtotal = totales.subtotal;
      descuentoTotal = totales.descuentoTotal;
      impuestosTotal = totales.impuestos;
      total = totales.total;

      console.log(`💰 Totales calculados para venta directa:`, totales);
    } else {
      console.error('❌ Venta sin presupuesto ni items');
      return NextResponse.json(
        { error: 'Se requiere un presupuesto o items para crear la venta' },
        { status: 400 }
      );
    }

    // Crear la venta en una transacción de base de datos
    const pedido = await prisma.$transaction(async (tx) => {
      console.log('🔄 Iniciando transacción de base de datos...');
      
      // Crear el pedido principal
      const nuevoPedido = await tx.pedido.create({
        data: {
          numero,
          clienteId: validatedData.clienteId,
          presupuestoId: validatedData.presupuestoId,
          fechaEntrega: validatedData.fechaEntrega,
          prioridad: validatedData.prioridad,
          descripcionObra: validatedData.descripcionObra,
          observaciones: validatedData.observaciones,
          condicionesPago: validatedData.condicionesPago,
          lugarEntrega: validatedData.lugarEntrega,
          subtotal,
          descuento: descuentoTotal,
          impuestos: impuestosTotal,
          total,
          saldoPendiente: total,
          moneda: validatedData.moneda,
          userId: user.id
        },
        include: {
          cliente: { select: { nombre: true } },
          presupuesto: { select: { numero: true } }
        }
      });

      console.log('✅ Pedido creado en BD:', nuevoPedido.id);

      // Si es venta directa, crear los items del pedido
      if (validatedData.items && validatedData.items.length > 0 && !validatedData.presupuestoId) {
        console.log('📦 Creando', validatedData.items.length, 'items de pedido...');
        
        for (let i = 0; i < validatedData.items.length; i++) {
          const item = validatedData.items[i];
          
          await tx.itemPedido.create({
            data: {
              pedidoId: nuevoPedido.id,
              orden: i + 1,
              descripcion: item.descripcion,
              detalle: item.detalle,
              cantidad: item.cantidad,
              unidad: item.unidad,
              precioUnitario: item.precioUnitario,
              descuento: item.descuento || 0,
              total: CalculationUtils.calculateItemTotal(
                item.cantidad, 
                item.precioUnitario, 
                item.descuento || 0
              )
            }
          });
        }
        console.log('✅ Items de pedido creados exitosamente');
      }

      // Si viene de presupuesto, actualizar el estado del presupuesto
      if (validatedData.presupuestoId) {
        await tx.presupuesto.update({
          where: { id: validatedData.presupuestoId },
          data: { estado: 'CONVERTIDO' }
        });
        console.log('✅ Estado de presupuesto actualizado a CONVERTIDO');
      }

      return nuevoPedido;
    });
    
    console.log('🎉 Venta creada exitosamente:', {
      id: pedido.id,
      numero: pedido.numero,
      cliente: pedido.cliente.nombre,
      total: pedido.total,
      origenPresupuesto: pedido.presupuesto?.numero || 'Venta directa',
      estado: 'PENDIENTE'
    });
    
    return NextResponse.json(pedido, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error crítico al crear venta:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      type: error.constructor.name
    });
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Errores de base de datos
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una venta con ese número' },
        { status: 409 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Referencia inválida (cliente o presupuesto no encontrado)' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor al crear la venta',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}