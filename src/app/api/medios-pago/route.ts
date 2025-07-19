// src/app/api/medios-pago/route.ts - VERSIÓN CORREGIDA CON MEJOR MANEJO DE ERRORES

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const user = await verifyCognitoAuth(req);
    
    console.log('🏦 Fetching medios de pago...');
    
    // Buscar medios de pago activos
    const mediosPago = await prisma.medioPago.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: { 
        id: true, 
        nombre: true, 
        descripcion: true 
      }
    });
    
    console.log('✅ Medios de pago fetched:', mediosPago.length);
    
    // Si no hay medios de pago, crearlos automáticamente
    if (mediosPago.length === 0) {
      console.log('⚠️ No hay medios de pago, creando los básicos...');
      
      const mediosBasicos = [
        { nombre: 'Efectivo', descripcion: 'Pago en efectivo' },
        { nombre: 'Transferencia Bancaria', descripcion: 'Transferencia bancaria' },
        { nombre: 'Cheque', descripcion: 'Pago con cheque' },
        { nombre: 'Tarjeta de Débito', descripcion: 'Pago con tarjeta de débito' },
        { nombre: 'Tarjeta de Crédito', descripcion: 'Pago con tarjeta de crédito' },
      ];
      
      // Crear medios de pago básicos
      const mediosCreados = await Promise.all(
        mediosBasicos.map(medio => 
          prisma.medioPago.create({
            data: medio,
            select: { id: true, nombre: true, descripcion: true }
          })
        )
      );
      
      console.log('✅ Medios de pago básicos creados:', mediosCreados.length);
      
      return NextResponse.json({
        success: true,
        data: mediosCreados,
        message: 'Medios de pago creados automáticamente'
      });
    }
    
    return NextResponse.json({
      success: true,
      data: mediosPago,
      count: mediosPago.length
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching medios de pago:', error);
    
    // Manejo específico de errores de autenticación
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No autorizado',
          message: 'Sesión expirada, por favor inicie sesión nuevamente'
        },
        { status: 401 }
      );
    }
    
    // Manejo de errores de base de datos
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Conflicto en base de datos',
          message: 'Ya existe un medio de pago con ese nombre'
        },
        { status: 409 }
      );
    }
    
    // Error genérico
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        message: 'Error al obtener medios de pago',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo medio de pago (opcional, para administradores)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    // Verificar que el usuario tenga permisos de administrador
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Permisos insuficientes',
          message: 'Solo los administradores pueden crear medios de pago'
        },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validación básica
    if (!body.nombre || body.nombre.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Datos inválidos',
          message: 'El nombre del medio de pago es requerido'
        },
        { status: 400 }
      );
    }
    
    // Crear medio de pago
    const nuevoMedio = await prisma.medioPago.create({
      data: {
        nombre: body.nombre.trim(),
        descripcion: body.descripcion?.trim() || null,
        activo: true
      },
      select: { id: true, nombre: true, descripcion: true }
    });
    
    console.log('✅ Nuevo medio de pago creado:', nuevoMedio.nombre);
    
    return NextResponse.json({
      success: true,
      data: nuevoMedio,
      message: 'Medio de pago creado exitosamente'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Error creating medio de pago:', error);
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Ya existe un medio de pago con ese nombre'
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear medio de pago',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}