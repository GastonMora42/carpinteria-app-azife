// src/app/api/gastos-generales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { z } from 'zod';

const gastoGeneralSchema = z.object({
  descripcion: z.string().min(1, "La descripción es requerida"),
  categoria: z.string().min(1, "La categoría es requerida"),
  subcategoria: z.string().optional(),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  moneda: z.enum(['PESOS', 'DOLARES']).default('PESOS'),
  fecha: z.date().or(z.string().transform(str => new Date(str))),
  periodo: z.string().optional(),
  numeroFactura: z.string().optional(),
  proveedor: z.string().optional()
});

// GET - Listar gastos generales
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get('categoria');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const periodo = searchParams.get('periodo');
    
    const where: any = {};
    
    if (categoria) {
      where.categoria = categoria;
    }
    
    if (periodo) {
      where.periodo = periodo;
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

    const gastos = await prisma.gastoGeneral.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });

    return NextResponse.json({
      data: gastos,
      count: gastos.length
    });
  } catch (error: any) {
    console.error('❌ Error fetching gastos generales:', error);
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
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
    const validatedData = gastoGeneralSchema.parse(body);
    
    // Generar número único
    const count = await prisma.gastoGeneral.count();
    const numero = `GG-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    // Generar período automáticamente si no se proporciona
    const fecha = new Date(validatedData.fecha);
    const periodo = validatedData.periodo || `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    
    const gasto = await prisma.gastoGeneral.create({
      data: {
        numero,
        descripcion: validatedData.descripcion,
        categoria: validatedData.categoria,
        subcategoria: validatedData.subcategoria,
        monto: validatedData.monto,
        moneda: validatedData.moneda,
        fecha: validatedData.fecha,
        periodo,
        numeroFactura: validatedData.numeroFactura,
        proveedor: validatedData.proveedor,
        userId: user.id
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });
    
    console.log('✅ Gasto general created successfully:', gasto.numero);
    
    return NextResponse.json(gasto, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating gasto general:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear gasto general' },
      { status: 500 }
    );
  }
}