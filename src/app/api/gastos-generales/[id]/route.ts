// src/app/api/gastos-generales/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { z } from 'zod';

const gastoGeneralUpdateSchema = z.object({
  descripcion: z.string().min(1, "La descripción es requerida").optional(),
  categoria: z.string().min(1, "La categoría es requerida").optional(),
  subcategoria: z.string().optional(),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0").optional(),
  moneda: z.enum(['PESOS', 'DOLARES']).optional(),
  fecha: z.date().or(z.string().transform(str => new Date(str))).optional(),
  periodo: z.string().optional(),
  numeroFactura: z.string().optional(),
  proveedor: z.string().optional()
});

// PUT - Actualizar gasto general
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    const body = await req.json();
    
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
    
    // Validar y actualizar
    const validatedData = gastoGeneralUpdateSchema.parse(body);
    
    // Actualizar período automáticamente si cambia la fecha
    if (validatedData.fecha && !validatedData.periodo) {
      const fecha = new Date(validatedData.fecha);
      validatedData.periodo = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    }
    
    const gasto = await prisma.gastoGeneral.update({
      where: { id },
      data: validatedData,
      include: {
        user: { select: { id: true, name: true } }
      }
    });
    
    return NextResponse.json(gasto);
  } catch (error: any) {
    console.error('❌ Error updating gasto general:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar gasto general' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar gasto general
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
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