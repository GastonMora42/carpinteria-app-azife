// src/app/api/finanzas/balance-medios-pago/route.ts - NUEVA API PARA BALANCE GENERAL
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { z } from 'zod';

const balanceQuerySchema = z.object({
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  incluirGastos: z.string().optional().transform(val => val === 'true'),
  incluirIngresos: z.string().optional().transform(val => val !== 'false'), // por defecto true
  medioId: z.string().optional()
});

// GET - Obtener balance general por medios de pago
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    const { searchParams } = new URL(req.url);
    
    // Validar y parsear parámetros
    const params = balanceQuerySchema.parse({
      fechaDesde: searchParams.get('fechaDesde'),
      fechaHasta: searchParams.get('fechaHasta'),
      incluirGastos: searchParams.get('incluirGastos'),
      incluirIngresos: searchParams.get('incluirIngresos'),
      medioId: searchParams.get('medioId')
    });
    
    console.log('💰 Fetching balance general with params:', params);

    // Construir filtros de fecha
    const dateFilter: any = {};
    if (params.fechaDesde) {
      dateFilter.gte = new Date(params.fechaDesde);
    }
    if (params.fechaHasta) {
      dateFilter.lte = new Date(params.fechaHasta);
    }

    // Construir filtros de medio de pago
    const medioFilter = params.medioId ? { medioPagoId: params.medioId } : {};

    // 1. INGRESOS - Transacciones de tipo ingreso/pago
    let ingresos: any[] = [];
    if (params.incluirIngresos) {
      ingresos = await prisma.transaccion.findMany({
        where: {
          tipo: {
            in: ['INGRESO', 'PAGO_OBRA', 'ANTICIPO']
          },
          ...(Object.keys(dateFilter).length > 0 && { fecha: dateFilter }),
          ...medioFilter
        },
        include: {
          medioPago: {
            select: { id: true, nombre: true, descripcion: true }
          },
          cliente: { select: { nombre: true } },
          pedido: { select: { numero: true } }
        },
        orderBy: { fecha: 'desc' }
      });
    }

    // 2. GASTOS - Gastos de presupuesto + gastos generales
    let gastos: any[] = [];
    if (params.incluirGastos) {
      // Gastos de presupuesto
      const gastosPresupuesto = await prisma.gastoPresupuesto.findMany({
        where: {
          ...(Object.keys(dateFilter).length > 0 && { fecha: dateFilter }),
          ...medioFilter
        },
        include: {
          medioPago: {
            select: { id: true, nombre: true, descripcion: true }
          },
          presupuesto: {
            select: { numero: true, cliente: { select: { nombre: true } } }
          }
        }
      });

      // Gastos generales
      const gastosGenerales = await prisma.gastoGeneral.findMany({
        where: {
          ...(Object.keys(dateFilter).length > 0 && { fecha: dateFilter }),
          ...medioFilter
        },
        include: {
          medioPago: {
            select: { id: true, nombre: true, descripcion: true }
          }
        }
      });

      // Combinar gastos normalizando la estructura
      gastos = [
        ...gastosPresupuesto.map(g => ({
          ...g,
          tipo: 'GASTO_PRESUPUESTO',
          origen: `Presupuesto ${g.presupuesto.numero} - ${g.presupuesto.cliente.nombre}`,
          monto: -Number(g.monto) // Negativo para gastos
        })),
        ...gastosGenerales.map(g => ({
          ...g,
          tipo: 'GASTO_GENERAL',
          origen: 'Gasto General',
          monto: -Number(g.monto) // Negativo para gastos
        }))
      ];
    }

    // 3. CONSOLIDAR POR MEDIO DE PAGO
    const balancePorMedio = new Map();

    // Procesar ingresos
    ingresos.forEach(transaccion => {
      const medioId = transaccion.medioPago.id;
      const medioNombre = transaccion.medioPago.nombre;

      if (!balancePorMedio.has(medioId)) {
        balancePorMedio.set(medioId, {
          medioPago: {
            id: medioId,
            nombre: medioNombre,
            descripcion: transaccion.medioPago.descripcion
          },
          ingresos: {
            total: 0,
            cantidad: 0,
            transacciones: []
          },
          gastos: {
            total: 0,
            cantidad: 0,
            transacciones: []
          },
          balance: 0,
          ultimaTransaccion: null
        });
      }

      const medio = balancePorMedio.get(medioId);
      medio.ingresos.total += Number(transaccion.monto);
      medio.ingresos.cantidad += 1;
      medio.ingresos.transacciones.push({
        id: transaccion.id,
        fecha: transaccion.fecha,
        concepto: transaccion.concepto,
        monto: Number(transaccion.monto),
        origen: transaccion.cliente?.nombre || 'N/A',
        referencia: transaccion.pedido?.numero
      });

      // Actualizar última transacción
      if (!medio.ultimaTransaccion || new Date(transaccion.fecha) > new Date(medio.ultimaTransaccion)) {
        medio.ultimaTransaccion = transaccion.fecha;
      }
    });

    // Procesar gastos
    gastos.forEach(gasto => {
      const medioId = gasto.medioPago.id;
      const medioNombre = gasto.medioPago.nombre;

      if (!balancePorMedio.has(medioId)) {
        balancePorMedio.set(medioId, {
          medioPago: {
            id: medioId,
            nombre: medioNombre,
            descripcion: gasto.medioPago.descripcion
          },
          ingresos: {
            total: 0,
            cantidad: 0,
            transacciones: []
          },
          gastos: {
            total: 0,
            cantidad: 0,
            transacciones: []
          },
          balance: 0,
          ultimaTransaccion: null
        });
      }

      const medio = balancePorMedio.get(medioId);
      medio.gastos.total += Math.abs(gasto.monto); // Usar valor absoluto
      medio.gastos.cantidad += 1;
      medio.gastos.transacciones.push({
        id: gasto.id,
        fecha: gasto.fecha,
        concepto: gasto.descripcion,
        monto: Math.abs(gasto.monto),
        origen: gasto.origen,
        categoria: gasto.categoria
      });

      // Actualizar última transacción
      if (!medio.ultimaTransaccion || new Date(gasto.fecha) > new Date(medio.ultimaTransaccion)) {
        medio.ultimaTransaccion = gasto.fecha;
      }
    });

    // 4. CALCULAR BALANCES FINALES
    const balanceArray = Array.from(balancePorMedio.values()).map(medio => {
      medio.balance = medio.ingresos.total - medio.gastos.total;
      
      // Determinar estado del balance
      medio.estado = medio.balance > 0 ? 'positivo' : medio.balance < 0 ? 'negativo' : 'neutro';
      
      // Calcular ratios
      medio.ratioIngresoGasto = medio.gastos.total > 0 ? medio.ingresos.total / medio.gastos.total : null;
      
      return medio;
    });

    // Ordenar por balance descendente
    balanceArray.sort((a, b) => b.balance - a.balance);

    // 5. CALCULAR TOTALES Y ESTADÍSTICAS GENERALES
    const totales = {
      ingresosTotales: balanceArray.reduce((sum, m) => sum + m.ingresos.total, 0),
      gastosTotales: balanceArray.reduce((sum, m) => sum + m.gastos.total, 0),
      balanceTotal: 0,
      cantidadMedios: balanceArray.length,
      cantidadTransacciones: balanceArray.reduce((sum, m) => sum + m.ingresos.cantidad + m.gastos.cantidad, 0)
    };
    totales.balanceTotal = totales.ingresosTotales - totales.gastosTotales;

    // 6. ANÁLISIS ADICIONAL
    const analisis = {
      medioMayorBalance: balanceArray.length > 0 ? balanceArray[0] : null,
      medioMenorBalance: balanceArray.length > 0 ? balanceArray[balanceArray.length - 1] : null,
      medioMasActivo: balanceArray.reduce((prev, current) => 
        (prev.ingresos.cantidad + prev.gastos.cantidad) > (current.ingresos.cantidad + current.gastos.cantidad) 
          ? prev : current, balanceArray[0] || null
      ),
      distribucionPorcentual: balanceArray.map(medio => ({
        medio: medio.medioPago.nombre,
        porcentajeIngresos: totales.ingresosTotales > 0 ? (medio.ingresos.total / totales.ingresosTotales) * 100 : 0,
        porcentajeGastos: totales.gastosTotales > 0 ? (medio.gastos.total / totales.gastosTotales) * 100 : 0,
        balance: medio.balance
      })),
      alertas: {
        mediosEnRojo: balanceArray.filter(m => m.balance < 0).length,
        concentracionExcesiva: balanceArray.length > 0 && 
          (balanceArray[0].ingresos.total / totales.ingresosTotales) > 0.8,
        sinMovimiento: balanceArray.filter(m => 
          m.ingresos.cantidad === 0 && m.gastos.cantidad === 0
        ).length
      }
    };

    const response = {
      balance: balanceArray,
      totales,
      analisis,
      parametros: params,
      generadoEn: new Date().toISOString()
    };

    console.log('✅ Balance general calculated successfully:', {
      medios: balanceArray.length,
      ingresosTotales: totales.ingresosTotales,
      gastosTotales: totales.gastosTotales,
      balanceTotal: totales.balanceTotal
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error calculating general balance:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al calcular balance general' },
      { status: 500 }
    );
  }
}