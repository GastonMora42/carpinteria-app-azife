// src/app/api/presupuestos/[id]/gastos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { gastoPresupuestoSchema } from '@/lib/validations/gasto-presupuesto';
import { z } from 'zod';

// GET - Obtener gastos de un presupuesto
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id: presupuestoId } = await params;
    
    console.log('📋 Fetching gastos for presupuesto:', presupuestoId);
    
    // Verificar que el presupuesto existe
    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: presupuestoId },
      select: { 
        id: true, 
        numero: true, 
        cliente: { select: { nombre: true } }
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
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });
    
    // Calcular estadísticas
    const totalGastos = gastos.reduce((acc, gasto) => acc + Number(gasto.monto), 0);
    const gastosPorCategoria = gastos.reduce((acc, gasto) => {
      const categoria = gasto.categoria;
      if (!acc[categoria]) {
        acc[categoria] = {
          categoria,
          cantidad: 0,
          monto: 0
        };
      }
      acc[categoria].cantidad += 1;
      acc[categoria].monto += Number(gasto.monto);
      return acc;
    }, {} as Record<string, { categoria: string; cantidad: number; monto: number }>);
    
    console.log('✅ Gastos fetched successfully:', gastos.length);
    
    return NextResponse.json({
      gastos,
      estadisticas: {
        totalGastos: gastos.length,
        montoTotal: totalGastos,
        gastosPorCategoria: Object.values(gastosPorCategoria)
      },
      presupuesto: {
        id: presupuesto.id,
        numero: presupuesto.numero,
        cliente: presupuesto.cliente.nombre
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
      { error: 'Error al obtener gastos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo gasto para presupuesto
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
      where: { id: presupuestoId },
      select: { id: true, numero: true }
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
    
    // Generar número único
    const count = await prisma.gastoPresupuesto.count();
    const numero = `GP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    // Crear gasto
    const gasto = await prisma.gastoPresupuesto.create({
      data: {
        numero,
        presupuestoId,
        descripcion: validatedData.descripcion,
        categoria: validatedData.categoria,
        subcategoria: validatedData.subcategoria,
        monto: validatedData.monto,
        moneda: validatedData.moneda,
        fecha: validatedData.fecha,
        comprobante: validatedData.comprobante,
        proveedor: validatedData.proveedor,
        notas: validatedData.notas,
        userId: user.id
      },
      include: {
        user: {
          select: { id: true, name: true }
        },
        presupuesto: {
          select: { numero: true }
        }
      }
    });
    
    console.log('✅ Gasto created successfully:', gasto.numero);
    
    return NextResponse.json(gasto, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating gasto:', error);
    
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
      { error: 'Error al crear gasto' },
      { status: 500 }
    );
  }
}
