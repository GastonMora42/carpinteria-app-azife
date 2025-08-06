// src/app/api/presupuestos/[id]/gastos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { gastoPresupuestoSchema } from '@/lib/validations/gasto-presupuesto';
import { DocumentNumbering } from '@/lib/utils/numbering';

// GET - Obtener gastos de un presupuesto específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id: presupuestoId } = await params;
    
    console.log('💰 Fetching gastos for presupuesto:', presupuestoId);
    
    // Verificar que el presupuesto existe
    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: presupuestoId },
      select: {
        id: true,
        numero: true,
        cliente: {
          select: { nombre: true }
        },
        total: true,
        moneda: true
      }
    });

    if (!presupuesto) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }

    // Obtener gastos del presupuesto
    const gastos = await prisma.gastoPresupuesto.findMany({
      where: { presupuestoId },
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

    // Calcular estadísticas
    const estadisticas = {
      totalGastos: gastos.length,
      montoTotal: gastos.reduce((sum, g) => sum + Number(g.monto), 0),
      gastosPorCategoria: gastos.reduce((acc, gasto) => {
        const categoria = gasto.categoria;
        if (!acc[categoria]) {
          acc[categoria] = { categoria, cantidad: 0, monto: 0 };
        }
        acc[categoria].cantidad += 1;
        acc[categoria].monto += Number(gasto.monto);
        return acc;
      }, {} as Record<string, { categoria: string; cantidad: number; monto: number }>)
    };

    console.log('✅ Gastos fetched successfully:', {
      gastos: gastos.length,
      montoTotal: estadisticas.montoTotal
    });

    return NextResponse.json({
      gastos,
      estadisticas: {
        ...estadisticas,
        gastosPorCategoria: Object.values(estadisticas.gastosPorCategoria)
      },
      presupuesto: {
        id: presupuesto.id,
        numero: presupuesto.numero,
        cliente: presupuesto.cliente.nombre,
        total: Number(presupuesto.total),
        moneda: presupuesto.moneda
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching gastos:', error);
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener gastos del presupuesto' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo gasto para un presupuesto
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id: presupuestoId } = await params;
    const body = await req.json();

    console.log('➕ Creating gasto for presupuesto:', presupuestoId);

    // Verificar que el presupuesto existe
    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: presupuestoId }
    });

    if (!presupuesto) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }

    // Validar datos
    const validatedData = gastoPresupuestoSchema.parse({
      ...body,
      presupuestoId
    });

    // Verificar que el medio de pago existe
    const medioPago = await prisma.medioPago.findUnique({
      where: { id: validatedData.medioPagoId },
      select: { id: true, nombre: true, activo: true }
    });

    if (!medioPago) {
      return NextResponse.json(
        { error: 'Medio de pago no encontrado' },
        { status: 400 }
      );
    }

    if (!medioPago.activo) {
      return NextResponse.json(
        { error: 'El medio de pago seleccionado no está activo' },
        { status: 400 }
      );
    }

    // Generar número único
    const count = await prisma.gastoPresupuesto.count({
      where: { presupuestoId }
    });
    const numero = `GAP-${presupuesto.numero}-${String(count + 1).padStart(3, '0')}`;

    // Crear gasto
    const nuevoGasto = await prisma.gastoPresupuesto.create({
      data: {
        numero,
        presupuestoId: validatedData.presupuestoId,
        descripcion: validatedData.descripcion,
        categoria: validatedData.categoria,
        subcategoria: validatedData.subcategoria,
        monto: validatedData.monto,
        moneda: validatedData.moneda,
        fecha: validatedData.fecha,
        comprobante: validatedData.comprobante,
        proveedor: validatedData.proveedor,
        notas: validatedData.notas,
        medioPagoId: validatedData.medioPagoId,
        userId: user.id
      },
      include: {
        medioPago: {
          select: { id: true, nombre: true, descripcion: true }
        },
        user: {
          select: { id: true, name: true }
        }
      }
    });

    console.log('✅ Gasto created successfully:', nuevoGasto.numero);

    return NextResponse.json(nuevoGasto, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating gasto:', error);
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
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
      { error: 'Error al crear gasto' },
      { status: 500 }
    );
  }
}