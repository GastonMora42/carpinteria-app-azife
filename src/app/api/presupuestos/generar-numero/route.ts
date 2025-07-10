// src/app/api/presupuestos/generar-numero/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

// Función para generar número único de presupuesto
async function generatePresupuestoNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const maxRetries = 5;
  
  for (let retry = 0; retry < maxRetries; retry++) {
    try {
      // Obtener el último número del año actual
      const lastPresupuesto = await prisma.presupuesto.findFirst({
        where: {
          numero: {
            startsWith: `PRES-${year}-`
          }
        },
        orderBy: {
          numero: 'desc'
        },
        select: {
          numero: true
        }
      });

      let nextNumber = 1;
      
      if (lastPresupuesto) {
        // Extraer el número del formato PRES-YYYY-XXX
        const match = lastPresupuesto.numero.match(/PRES-\d{4}-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const numero = `PRES-${year}-${String(nextNumber).padStart(3, '0')}`;
      
      // Verificar que no existe (por si acaso)
      const existing = await prisma.presupuesto.findUnique({
        where: { numero },
        select: { id: true }
      });
      
      if (!existing) {
        return numero;
      }
      
      // Si existe, incrementar y reintentar
      nextNumber++;
    } catch (error) {
      console.error(`Error generating presupuesto number (retry ${retry + 1}):`, error);
      if (retry === maxRetries - 1) {
        throw new Error('No se pudo generar número de presupuesto único');
      }
    }
  }
  
  throw new Error('No se pudo generar número de presupuesto después de varios intentos');
}

// GET - Generar número sugerido para presupuesto
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    console.log('🔢 Generating suggested presupuesto number...');
    
    const numero = await generatePresupuestoNumber();
    
    console.log('✅ Generated suggested number:', numero);
    
    return NextResponse.json({
      numero,
      message: 'Número generado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error generating presupuesto number:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al generar número de presupuesto' },
      { status: 500 }
    );
  }
}

// POST - Validar si un número está disponible
export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { numero } = await req.json();
    
    if (!numero || typeof numero !== 'string') {
      return NextResponse.json(
        { error: 'Número requerido' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Validating presupuesto number:', numero);
    
    // Verificar que no existe
    const existing = await prisma.presupuesto.findUnique({
      where: { numero: numero.trim() },
      select: { id: true, numero: true }
    });
    
    const isAvailable = !existing;
    
    console.log(`${isAvailable ? '✅' : '❌'} Number ${numero} is ${isAvailable ? 'available' : 'taken'}`);
    
    return NextResponse.json({
      numero: numero.trim(),
      available: isAvailable,
      message: isAvailable 
        ? 'Número disponible' 
        : 'Número ya en uso'
    });
  } catch (error: any) {
    console.error('❌ Error validating presupuesto number:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al validar número' },
      { status: 500 }
    );
  }
}