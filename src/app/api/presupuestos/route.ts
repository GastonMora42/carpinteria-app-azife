// src/app/api/presupuestos/route.ts - ACTUALIZACIÓN PARA SOPORTAR FILTRO disponibleParaVenta
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { presupuestoSchema } from '@/lib/validations/presupuesto';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { CalculationUtils } from '@/lib/utils/calculations';

// GET - Listar presupuestos con filtros mejorados
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const estado = searchParams.get('estado');
    const clienteId = searchParams.get('clienteId');
    const search = searchParams.get('search');
    const numero = searchParams.get('numero');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const disponibleParaVenta = searchParams.get('disponibleParaVenta') === 'true'; // NUEVO FILTRO
    
    const skip = (page - 1) * limit;
    
    // Construir filtros
    const where: any = {};
    
    if (estado) {
      where.estado = estado;
    }
    
    if (clienteId) {
      where.clienteId = clienteId;
    }
    
    // NUEVO: Filtro para presupuestos disponibles para venta
    if (disponibleParaVenta) {
      where.estado = 'APROBADO'; // Solo aprobados
      where.pedido = null; // No convertidos
      where.fechaValidez = {
        gte: new Date() // No vencidos
      };
    }
    
    // Búsqueda específica por número de presupuesto
    if (numero) {
      where.numero = {
        contains: numero,
        mode: 'insensitive'
      };
    }
    
    // Filtro por rango de fechas
    if (fechaDesde || fechaHasta) {
      where.fechaEmision = {};
      if (fechaDesde) {
        where.fechaEmision.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.fechaEmision.lte = new Date(fechaHasta + 'T23:59:59');
      }
    }
    
    // Búsqueda general (excluye número si ya se especificó)
    if (search && !numero) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { descripcionObra: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        { observaciones: { contains: search, mode: 'insensitive' } }
      ];
    }

    console.log('🔍 Searching presupuestos with filters:', {
      page, limit, estado, clienteId, numero, search, fechaDesde, fechaHasta, disponibleParaVenta
    });

    const [presupuestos, total] = await Promise.all([
      prisma.presupuesto.findMany({
        where,
        include: {
          cliente: {
            select: { id: true, nombre: true, email: true, telefono: true }
          },
          user: {
            select: { id: true, name: true }
          },
          items: {
            orderBy: { orden: 'asc' }
          },
          // NUEVO: Incluir información del pedido para saber si fue convertido
          pedido: {
            select: { 
              id: true, 
              numero: true, 
              estado: true 
            }
          },
          _count: {
            select: { items: true }
          }
        },
        orderBy: { fechaEmision: 'desc' },
        skip,
        take: limit
      }),
      prisma.presupuesto.count({ where })
    ]);

    console.log(`✅ Found ${presupuestos.length} presupuestos (total: ${total})`);

    // NUEVO: Enriquecer datos con información de disponibilidad para venta
    const presupuestosEnriquecidos = presupuestos.map(presupuesto => {
      const fechaVencimiento = new Date(presupuesto.fechaValidez);
      const hoy = new Date();
      const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...presupuesto,
        // Información adicional para la UI
        diasRestantes,
        vencido: diasRestantes <= 0,
        urgente: diasRestantes > 0 && diasRestantes <= 7,
        puedeConvertirse: presupuesto.estado === 'APROBADO' && !presupuesto.pedido && diasRestantes > 0,
        yaConvertido: !!presupuesto.pedido
      };
    });

    // NUEVO: Calcular estadísticas específicas para disponibles para venta
    let estadisticas = {};
    if (disponibleParaVenta) {
      const disponibles = presupuestosEnriquecidos.filter(p => p.puedeConvertirse);
      estadisticas = {
        total: disponibles.length,
        montoTotal: disponibles.reduce((acc, p) => acc + Number(p.total), 0),
        urgentes: disponibles.filter(p => p.urgente).length,
        promedioDiasVencimiento: disponibles.length > 0 
          ? Math.round(disponibles.reduce((acc, p) => acc + p.diasRestantes, 0) / disponibles.length)
          : 0
      };
    }

    return NextResponse.json({
      data: presupuestosEnriquecidos,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      },
      filters: {
        estado,
        clienteId,
        numero,
        search,
        fechaDesde,
        fechaHasta,
        disponibleParaVenta
      },
      ...(disponibleParaVenta && { estadisticas })
    });
  } catch (error: any) {
    console.error('Error al obtener presupuestos:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener presupuestos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo presupuesto (sin cambios)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const body = await req.json();
    const validatedData = presupuestoSchema.parse(body);
    
    console.log('➕ Creating presupuesto for client:', validatedData.clienteId);
    console.log('📋 Manual number provided:', validatedData.numero || 'No, will auto-generate');
    
    let numero: string;
    
    // Si se proporcionó un número manual, validarlo
    if (validatedData.numero) {
      const isUnique = await validateUniqueNumber(validatedData.numero);
      if (!isUnique) {
        return NextResponse.json(
          { error: `El número "${validatedData.numero}" ya está en uso. Elige otro número.` },
          { status: 409 }
        );
      }
      numero = validatedData.numero;
      console.log('📋 Using manual number:', numero);
    } else {
      // Generar número automáticamente
      numero = await generatePresupuestoNumber();
      console.log('📋 Generated automatic number:', numero);
    }
    
    // Calcular totales usando la utilidad
    const totales = CalculationUtils.calculateOrderTotals(
      validatedData.items,
      validatedData.descuento,
      validatedData.impuestos
    );
    
    console.log('💰 Calculated totals:', totales);
    
    const presupuesto = await prisma.presupuesto.create({
      data: {
        numero,
        clienteId: validatedData.clienteId,
        fechaValidez: validatedData.fechaValidez,
        descripcionObra: validatedData.descripcionObra,
        observaciones: validatedData.observaciones,
        condicionesPago: validatedData.condicionesPago,
        tiempoEntrega: validatedData.tiempoEntrega,
        validezDias: validatedData.validezDias,
        subtotal: totales.subtotal,
        descuento: validatedData.descuento,
        impuestos: validatedData.impuestos,
        total: totales.total,
        moneda: validatedData.moneda,
        userId: user.id,
        items: {
          create: validatedData.items.map((item, index) => ({
            orden: index + 1,
            descripcion: item.descripcion,
            detalle: item.detalle,
            cantidad: item.cantidad,
            unidad: item.unidad,
            precioUnitario: item.precioUnitario,
            descuento: item.descuento,
            total: CalculationUtils.calculateItemTotal(
              item.cantidad, 
              item.precioUnitario, 
              item.descuento
            )
          }))
        }
      },
      include: {
        cliente: true,
        items: {
          orderBy: { orden: 'asc' }
        },
        user: {
          select: { id: true, name: true }
        }
      }
    });
    
    console.log('✅ Presupuesto created successfully:', {
      id: presupuesto.id,
      numero: presupuesto.numero,
      total: presupuesto.total,
      itemsCount: presupuesto.items.length,
      isManualNumber: !!validatedData.numero
    });
    
    return NextResponse.json(presupuesto, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating presupuesto:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    if (error.code === 'P2002' && error.meta?.target?.includes('numero')) {
      console.error('❌ Duplicate presupuesto number');
      return NextResponse.json(
        { error: 'El número de presupuesto ya existe. Elige otro número.' },
        { status: 409 }
      );
    }
    
    if (error.errors) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear presupuesto' },
      { status: 500 }
    );
  }
}

// Función para generar número único de presupuesto (sin cambios)
async function generatePresupuestoNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const maxRetries = 5;
  
  for (let retry = 0; retry < maxRetries; retry++) {
    try {
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
        const match = lastPresupuesto.numero.match(/PRES-\d{4}-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const numero = `PRES-${year}-${String(nextNumber).padStart(3, '0')}`;
      
      const existing = await prisma.presupuesto.findUnique({
        where: { numero },
        select: { id: true }
      });
      
      if (!existing) {
        return numero;
      }
      
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

// Función para validar que un número manual no esté en uso (sin cambios)
async function validateUniqueNumber(numero: string): Promise<boolean> {
  const existing = await prisma.presupuesto.findUnique({
    where: { numero },
    select: { id: true }
  });
  return !existing;
}