
// src/app/api/gastos-presupuesto/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { gastoPresupuestoUpdateSchema } from '@/lib/validations/gasto-presupuesto';

// PUT - Actualizar gasto
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    const body = await req.json();
    
    // Verificar que el gasto existe y permisos
    const existingGasto = await prisma.gastoPresupuesto.findUnique({
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
    const validatedData = gastoPresupuestoUpdateSchema.parse(body);
    
    const gasto = await prisma.gastoPresupuesto.update({
      where: { id },
      data: validatedData,
      include: {
        user: { select: { id: true, name: true } },
        presupuesto: { select: { numero: true } }
      }
    });
    
    return NextResponse.json(gasto);
  } catch (error: any) {
    console.error('❌ Error updating gasto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar gasto' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar gasto
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
    // Verificar permisos
    const existingGasto = await prisma.gastoPresupuesto.findUnique({
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
    
    await prisma.gastoPresupuesto.delete({
      where: { id }
    });
    
    return NextResponse.json({ 
      message: 'Gasto eliminado correctamente',
      deletedId: id 
    });
  } catch (error: any) {
    console.error('❌ Error deleting gasto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar gasto' },
      { status: 500 }
    );
  }
}