// src/app/api/gastos-generales/route.ts - VERSIÓN ACTUALIZADA CON MEDIOS DE PAGO
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { gastoGeneralSchema } from '@/lib/validations/gasto-presupuesto';
import { DocumentNumbering } from '@/lib/utils/numbering';

// GET - Listar gastos generales
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const categoria = searchParams.get('categoria');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const periodo = searchParams.get('periodo');
    const medioPagoId = searchParams.get('medioPagoId');
    
    const skip = (page - 1) * limit;
    
    console.log('💰 Fetching gastos generales with params:', {
      page, limit, categoria, fechaDesde, fechaHasta, periodo, medioPagoId
    });
    
    const where: any = {};
    
    if (categoria) {
      where.categoria = categoria;
    }
    
    if (medioPagoId) {
      where.medioPagoId = medioPagoId;
    }
    
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) {
        where.fecha.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.fecha.lte = new Date(fechaHasta);
      }
    }
    
    if (periodo) {
      where.periodo = periodo;
    }

    const [gastos, total] = await Promise.all([
      prisma.gastoGeneral.findMany({
        where,
        include: {
          medioPago: {
            select: { id: true, nombre: true, descripcion: true }
          },
          user: {
            select: { id: true, name: true }
          }
        },
        orderBy: { fecha: 'desc' },
        skip,
        take: limit
      }),
      prisma.gastoGeneral.count({ where })
    ]);

    // Calcular estadísticas
    const estadisticas = await prisma.gastoGeneral.aggregate({
      where,
      _sum: { monto: true },
      _count: { id: true }
    });

    // Estadísticas por categoría
    const porCategoria = await prisma.gastoGeneral.groupBy({
      by: ['categoria'],
      where,
      _sum: { monto: true },
      _count: { id: true }
    });

    // Estadísticas por medio de pago
    const porMedioPago = await prisma.gastoGeneral.groupBy({
      by: ['medioPagoId'],
      where,
      _sum: { monto: true },
      _count: { id: true },
      orderBy: { _sum: { monto: 'desc' } }
    });

    // Enriquecer estadísticas por medio de pago con nombres
    const mediosPagoInfo = await prisma.medioPago.findMany({
      where: { id: { in: porMedioPago.map(p => p.medioPagoId) } },
      select: { id: true, nombre: true }
    });

    const estadisticasPorMedioPago = porMedioPago.map(stat => {
      const medioInfo = mediosPagoInfo.find(m => m.id === stat.medioPagoId);
      return {
        medioPago: {
          id: stat.medioPagoId,
          nombre: medioInfo?.nombre || 'Sin especificar'
        },
        cantidad: stat._count.id,
        monto: Number(stat._sum.monto || 0)
      };
    });

    console.log('✅ Gastos generales fetched successfully:', {
      gastos: gastos.length,
      total,
      montoTotal: estadisticas._sum.monto
    });

    return NextResponse.json({
      data: gastos,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      },
      estadisticas: {
        totalGastos: estadisticas._count.id || 0,
        montoTotal: Number(estadisticas._sum.monto || 0),
        gastosPorCategoria: porCategoria.map(cat => ({
          categoria: cat.categoria,
          cantidad: cat._count.id,
          monto: Number(cat._sum.monto || 0)
        })),
        gastosPorMedioPago: estadisticasPorMedioPago
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching gastos generales:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener gastos generales' },
      { status: 500 }
    );
  }
}

// POST - Crear gasto general
export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const body = await req.json();
    console.log('➕ Creating gasto general:', {
      descripcion: body.descripcion,
      categoria: body.categoria,
      monto: body.monto,
      medioPagoId: body.medioPagoId
    });
    
    // Validar datos
    const validatedData = gastoGeneralSchema.parse(body);
    
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
    
    // Generar número único para el gasto
    const count = await prisma.gastoGeneral.count();
    const numero = `GAG-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    const gasto = await prisma.gastoGeneral.create({
      data: {
        numero,
        descripcion: validatedData.descripcion,
        categoria: validatedData.categoria,
        subcategoria: validatedData.subcategoria,
        monto: validatedData.monto,
        moneda: validatedData.moneda,
        fecha: validatedData.fecha,
        periodo: validatedData.periodo,
        numeroFactura: validatedData.numeroFactura,
        proveedor: validatedData.proveedor,
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
    
    console.log('✅ Gasto general created successfully:', {
      id: gasto.id,
      numero: gasto.numero,
      medioPago: gasto.medioPago.nombre
    });
    
    return NextResponse.json(gasto, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating gasto general:', error);
    
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
      { error: 'Error al crear gasto general' },
      { status: 500 }
    );
  }
}

// src/app/api/gastos-generales/[id]/route.ts - ACTUALIZAR Y ELIMINAR
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    const body = await req.json();
    
    console.log('✏️ Updating gasto general:', id);
    
    // Verificar que el gasto existe y permisos
    const existingGasto = await prisma.gastoGeneral.findUnique({
      where: { id },
      select: { userId: true }
    });
    
    if (!existingGasto) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      );
    }
    
    if (existingGasto.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este gasto' },
        { status: 403 }
      );
    }
    
    // Validar datos (partial update)
    const validatedData = gastoGeneralSchema.partial().parse(body);
    
    // Si se actualiza el medio de pago, verificar que existe
    if (validatedData.medioPagoId) {
      const medioPago = await prisma.medioPago.findUnique({
        where: { id: validatedData.medioPagoId },
        select: { activo: true }
      });
      
      if (!medioPago || !medioPago.activo) {
        return NextResponse.json(
          { error: 'Medio de pago inválido o inactivo' },
          { status: 400 }
        );
      }
    }
    
    const gasto = await prisma.gastoGeneral.update({
      where: { id },
      data: validatedData,
      include: {
        medioPago: {
          select: { id: true, nombre: true, descripcion: true }
        },
        user: {
          select: { id: true, name: true }
        }
      }
    });
    
    console.log('✅ Gasto general updated successfully:', gasto.id);
    
    return NextResponse.json(gasto);
  } catch (error: any) {
    console.error('❌ Error updating gasto general:', error);
    return NextResponse.json(
      { error: 'Error al actualizar gasto general' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
    console.log('🗑️ Deleting gasto general:', id);
    
    // Verificar permisos
    const existingGasto = await prisma.gastoGeneral.findUnique({
      where: { id },
      select: { userId: true }
    });
    
    if (!existingGasto) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      );
    }
    
    if (existingGasto.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este gasto' },
        { status: 403 }
      );
    }
    
    await prisma.gastoGeneral.delete({
      where: { id }
    });
    
    console.log('✅ Gasto general deleted successfully:', id);
    
    return NextResponse.json({ 
      message: 'Gasto eliminado correctamente',
      deletedId: id 
    });
  } catch (error: any) {
    console.error('❌ Error deleting gasto general:', error);
    return NextResponse.json(
      { error: 'Error al eliminar gasto general' },
      { status: 500 }
    );
  }
}