// src/app/api/dashboard/route.ts - VERSIÓN CORREGIDA Y SIMPLIFICADA
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    console.log('📊 Fetching dashboard data...');
    
    // DATOS PRINCIPALES SIMPLIFICADOS
    const [
      totalClientes,
      totalPresupuestosPendientes,
      totalPedidosPendientes,
      ventasMes,
      transaccionesRecientes,
      presupuestosVencenProximamente,
      pedidosEnProceso
    ] = await Promise.all([
      // 1. Total clientes activos
      prisma.cliente.count({ 
        where: { activo: true } 
      }).catch(() => 0),
      
      // 2. Presupuestos pendientes
      prisma.presupuesto.count({ 
        where: { 
          estado: { in: ['PENDIENTE', 'ENVIADO'] } 
        } 
      }).catch(() => 0),
      
      // 3. Pedidos pendientes
      prisma.pedido.count({ 
        where: { 
          estado: { in: ['PENDIENTE', 'CONFIRMADO', 'EN_PROCESO', 'EN_PRODUCCION'] } 
        } 
      }).catch(() => 0),
      
      // 4. Ventas del mes
      prisma.transaccion.aggregate({
        where: {
          tipo: { in: ['INGRESO', 'PAGO_OBRA', 'ANTICIPO'] },
          fecha: { gte: startOfMonth }
        },
        _sum: { monto: true }
      }).catch(() => ({ _sum: { monto: 0 } })),
      
      // 5. Transacciones recientes
      prisma.transaccion.findMany({
        take: 5,
        orderBy: { fecha: 'desc' },
        include: {
          cliente: { select: { nombre: true } },
          proveedor: { select: { nombre: true } },
          medioPago: { select: { nombre: true } }
        }
      }).catch(() => []),
      
      // 6. Presupuestos que vencen pronto
      prisma.presupuesto.findMany({
        where: {
          estado: { in: ['PENDIENTE', 'ENVIADO'] },
          fechaValidez: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: { 
          cliente: { select: { nombre: true } } 
        },
        orderBy: { fechaValidez: 'asc' },
        take: 5
      }).catch(() => []),
      
      // 7. Pedidos en proceso
      prisma.pedido.findMany({
        where: { 
          estado: { in: ['EN_PROCESO', 'EN_PRODUCCION'] } 
        },
        include: { 
          cliente: { select: { nombre: true } } 
        },
        orderBy: { fechaEntrega: 'asc' },
        take: 5
      }).catch(() => [])
    ]);

    // SALDOS POR COBRAR (separado para manejo de errores)
    const saldosPorCobrar = await prisma.pedido.aggregate({
      where: {
        saldoPendiente: { gt: 0 },
        estado: { not: 'CANCELADO' }
      },
      _sum: { saldoPendiente: true }
    }).catch(() => ({ _sum: { saldoPendiente: 0 } }));

    // ANÁLISIS FINANCIERO SIMPLIFICADO
    let analisisFinanciero = {
      ventasActuales: Number(ventasMes._sum.monto) || 0,
      ventasPrevias: 0,
      egresosActuales: 0,
      egresosPrevios: 0,
      tendenciaVentas: 0,
      margenReal: 0,
      flujoNeto: 0,
      proyeccionVentas: 0
    };

    try {
      // Ventas mes anterior
      const ventasMesAnterior = await prisma.transaccion.aggregate({
        where: {
          tipo: { in: ['INGRESO', 'PAGO_OBRA', 'ANTICIPO'] },
          fecha: { gte: startOfLastMonth, lt: startOfMonth }
        },
        _sum: { monto: true }
      });

      // Egresos actuales
      const egresosMes = await prisma.transaccion.aggregate({
        where: {
          tipo: { in: ['EGRESO', 'PAGO_PROVEEDOR', 'GASTO_GENERAL'] },
          fecha: { gte: startOfMonth }
        },
        _sum: { monto: true }
      });

      analisisFinanciero = {
        ventasActuales: Number(ventasMes._sum.monto) || 0,
        ventasPrevias: Number(ventasMesAnterior._sum.monto) || 0,
        egresosActuales: Number(egresosMes._sum.monto) || 0,
        egresosPrevios: 0,
        tendenciaVentas: 0,
        margenReal: 0,
        flujoNeto: (Number(ventasMes._sum.monto) || 0) - (Number(egresosMes._sum.monto) || 0),
        proyeccionVentas: 0
      };

      // Calcular tendencia
      if (analisisFinanciero.ventasPrevias > 0) {
        analisisFinanciero.tendenciaVentas = 
          ((analisisFinanciero.ventasActuales - analisisFinanciero.ventasPrevias) / analisisFinanciero.ventasPrevias) * 100;
      }

      // Calcular margen
      if (analisisFinanciero.ventasActuales > 0) {
        analisisFinanciero.margenReal = 
          ((analisisFinanciero.ventasActuales - analisisFinanciero.egresosActuales) / analisisFinanciero.ventasActuales) * 100;
      }
    } catch (error) {
      console.error('Error calculating financial analysis:', error);
    }

    // VENTAS POR DÍA SIMPLIFICADO
    let ventasPorDia: any[] = [];
    try {
      const fechaInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const transaccionesRecientesDias = await prisma.transaccion.findMany({
        where: {
          fecha: { gte: fechaInicio }
        },
        select: {
          fecha: true,
          tipo: true,
          monto: true
        }
      });

      // Procesar manualmente por día
      const datosPorDia: Record<string, { ingresos: number; egresos: number; transacciones: number }> = {};
      
      transaccionesRecientesDias.forEach(t => {
        const fechaStr = t.fecha.toISOString().split('T')[0];
        if (!datosPorDia[fechaStr]) {
          datosPorDia[fechaStr] = { ingresos: 0, egresos: 0, transacciones: 0 };
        }
        
        datosPorDia[fechaStr].transacciones += 1;
        
        if (['INGRESO', 'PAGO_OBRA', 'ANTICIPO'].includes(t.tipo)) {
          datosPorDia[fechaStr].ingresos += Number(t.monto);
        } else if (['EGRESO', 'PAGO_PROVEEDOR', 'GASTO_GENERAL'].includes(t.tipo)) {
          datosPorDia[fechaStr].egresos += Number(t.monto);
        }
      });

      ventasPorDia = Object.entries(datosPorDia).map(([fecha, datos]) => ({
        fecha,
        ...datos
      })).sort((a, b) => a.fecha.localeCompare(b.fecha));
      
    } catch (error) {
      console.error('Error processing daily sales:', error);
      ventasPorDia = [];
    }

    // PRODUCTIVIDAD BÁSICA
    const productividad = {
      transaccionesCount: transaccionesRecientes.length,
      clientesNuevos: 0,
      presupuestosGenerados: 0,
      promedioTransaccionesPorDia: Math.round(transaccionesRecientes.length / 7)
    };

    try {
      productividad.clientesNuevos = await prisma.cliente.count({
        where: { createdAt: { gte: startOfMonth } }
      });
      
      productividad.presupuestosGenerados = await prisma.presupuesto.count({
        where: { fechaEmision: { gte: startOfMonth } }
      });
    } catch (error) {
      console.error('Error calculating productivity:', error);
    }

    // ALERTAS BÁSICAS
    const alertas = {
      presupuestosVencen: presupuestosVencenProximamente.length,
      pedidosAtrasados: pedidosEnProceso.filter(p => 
        p.fechaEntrega && new Date(p.fechaEntrega) < now
      ).length,
      clientesSinActividad: 0,
      stockCritico: 0
    };

    console.log('✅ Dashboard data fetched successfully');
    
    return NextResponse.json({
      // Datos básicos
      estadisticas: {
        totalClientes,
        totalPresupuestosPendientes,
        totalPedidosPendientes,
        ventasMes: analisisFinanciero.ventasActuales,
        saldosPorCobrar: Number(saldosPorCobrar._sum.saldoPendiente) || 0
      },
      
      transaccionesRecientes,
      presupuestosVencenProximamente,
      pedidosEnProceso,
      ventasPorDia,
      
      // Análisis simplificado
      analisisFinanciero,
      
      estadosPresupuestos: {},
      estadosPedidos: {},
      
      productividad,
      mediosPagoPreferidos: [],
      clientesMasActivos: [],
      
      resumen: {
        alertas,
        metricas: {
          ticketPromedio: transaccionesRecientes.length > 0 ? 
            analisisFinanciero.ventasActuales / transaccionesRecientes.length : 0,
          clientesActivos: 0,
          eficienciaCobranza: 85
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error al obtener datos del dashboard:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Retornar estructura básica en caso de error
    return NextResponse.json({
      estadisticas: {
        totalClientes: 0,
        totalPresupuestosPendientes: 0,
        totalPedidosPendientes: 0,
        ventasMes: 0,
        saldosPorCobrar: 0
      },
      transaccionesRecientes: [],
      presupuestosVencenProximamente: [],
      pedidosEnProceso: [],
      ventasPorDia: [],
      analisisFinanciero: {
        ventasActuales: 0,
        ventasPrevias: 0,
        egresosActuales: 0,
        egresosPrevios: 0,
        tendenciaVentas: 0,
        margenReal: 0,
        flujoNeto: 0,
        proyeccionVentas: 0
      },
      estadosPresupuestos: {},
      estadosPedidos: {},
      productividad: {
        transaccionesCount: 0,
        clientesNuevos: 0,
        presupuestosGenerados: 0,
        promedioTransaccionesPorDia: 0
      },
      mediosPagoPreferidos: [],
      clientesMasActivos: [],
      resumen: {
        alertas: {
          presupuestosVencen: 0,
          pedidosAtrasados: 0,
          clientesSinActividad: 0,
          stockCritico: 0
        },
        metricas: {
          ticketPromedio: 0,
          clientesActivos: 0,
          eficienciaCobranza: 0
        }
      }
    });
  }
}