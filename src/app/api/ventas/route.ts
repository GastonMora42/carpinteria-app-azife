// src/app/api/ventas/route.ts - ACTUALIZADO PARA MANEJAR ITEMS
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ventaSchema } from '@/lib/validations/venta';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { CalculationUtils } from '@/lib/utils/calculations';

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
    console.error('Error al obtener ventas:', error);
    
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
    console.log('📝 Datos recibidos para crear venta:', body);
    
    const validatedData = ventaSchema.parse(body);
    
    // Generar número único
    const count = await prisma.pedido.count();
    const numero = `VEN-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    
    let subtotal = 0;
    let total = 0;
    let descuentoTotal = 0;
    let impuestosTotal = 0;

    // Si viene de presupuesto, obtener datos
    if (validatedData.presupuestoId) {
      console.log('🔄 Creando venta desde presupuesto:', validatedData.presupuestoId);
      
      const presupuestoData = await prisma.presupuesto.findUnique({
        where: { id: validatedData.presupuestoId },
        include: { items: true }
      });

      if (!presupuestoData) {
        throw new Error('Presupuesto no encontrado');
      }

      subtotal = Number(presupuestoData.subtotal);
      descuentoTotal = Number(presupuestoData.descuento) || 0;
      impuestosTotal = Number(presupuestoData.impuestos) || 0;
      total = Number(presupuestoData.total);

      console.log(`💰 Totales desde presupuesto: Subtotal: ${subtotal}, Total: ${total}`);
    } 
    // Si es venta directa, calcular totales desde items
    else if (validatedData.items && validatedData.items.length > 0) {
      console.log('🧮 Calculando totales desde items:', validatedData.items.length);
      
      const totales = CalculationUtils.calculateOrderTotals(
        validatedData.items,
        validatedData.descuento || 0,
        validatedData.impuestos || 0
      );

      subtotal = totales.subtotal;
      descuentoTotal = totales.descuentoTotal;
      impuestosTotal = totales.impuestos;
      total = totales.total;

      console.log(`💰 Totales calculados: Subtotal: ${subtotal}, Total: ${total}`);
    } else {
      throw new Error('Se requieren items para venta directa');
    }

    // Crear la venta en una transacción
    const pedido = await prisma.$transaction(async (tx) => {
      // Crear el pedido
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
          cliente: true,
          presupuesto: true
        }
      });

      // Si es venta directa, crear los items del pedido
      if (validatedData.items && validatedData.items.length > 0 && !validatedData.presupuestoId) {
        console.log('📦 Creando items de pedido...');
        
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
      }

      return nuevoPedido;
    });
    
    console.log('✅ Venta creada exitosamente:', pedido.id);
    
    return NextResponse.json(pedido, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error al crear venta:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    if (error.errors) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al crear venta' },
      { status: 500 }
    );
  }
}