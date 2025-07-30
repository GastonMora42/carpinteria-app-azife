// src/app/api/dashboard/route.ts - VERSIÓN MEJORADA CON ANÁLISIS COMPLETO
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
    
    console.log('📊 Fetching comprehensive dashboard data...');
    
    // DATOS PRINCIPALES (sin cambios)
    const [
      totalClientes,
      totalPresupuestosPendientes,
      totalPedidosPendientes,
      ventasMes,
      transaccionesRecientes,
      presupuestosVencenProximamente,
      pedidosEnProceso,
      saldosPorCobrar
    ] = await Promise.all([
      prisma.cliente.count({ where: { activo: true } }),
      prisma.presupuesto.count({ where: { estado: { in: ['PENDIENTE', 'ENVIADO'] } } }),
      prisma.pedido.count({ where: { estado: { in: ['PENDIENTE', 'CONFIRMADO', 'EN_PROCESO', 'EN_PRODUCCION'] } } }),
      prisma.transaccion.aggregate({
        where: {
          tipo: { in: ['INGRESO', 'PAGO_OBRA', 'ANTICIPO'] },
          fecha: { gte: startOfMonth }
        },
        _sum: { monto: true }
      }),
      prisma.transaccion.findMany({
        take: 10,
        orderBy: { fecha: 'desc' },
        include: {
          cliente: { select: { nombre: true } },
          proveedor: { select: { nombre: true } },
          medioPago: { select: { nombre: true } }
        }
      }),
      prisma.presupuesto.findMany({
        where: {
          estado: { in: ['PENDIENTE', 'ENVIADO'] },
          fechaValidez: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: { cliente: { select: { nombre: true } } },
        orderBy: { fechaValidez: 'asc' }
      }),
      prisma.pedido.findMany({
        where: { estado: { in: ['EN_PROCESO', 'EN_PRODUCCION'] } },
        include: { cliente: { select: { nombre: true } } },
        orderBy: { fechaEntrega: 'asc' },
        take: 10
      }),
      prisma.pedido.aggregate({
        where: {
          saldoPendiente: { gt: 0 },
          estado: { not: 'CANCELADO' }
        },
        _sum: { saldoPendiente: true }
      })
    ]);

    // NUEVAS MÉTRICAS CALCULADAS CON DATOS REALES
    console.log('🔢 Calculating advanced metrics...');

    // 1. Análisis de presupuestos por estado (REAL)
    const presupuestosPorEstado = await prisma.presupuesto.groupBy({
      by: ['estado'],
      _count: { id: true },
      _sum: { total: true }
    });

    const estadosPresupuestos = presupuestosPorEstado.map(grupo => ({
      estado: grupo.estado,
      cantidad: grupo._count.id,
      monto: Number(grupo._sum.total) || 0
    }));

    // 2. Análisis de pedidos por estado (REAL)
    const pedidosPorEstado = await prisma.pedido.groupBy({
      by: ['estado'],
      _count: { id: true },
      _sum: { total: true }
    });

    const estadosPedidos = pedidosPorEstado.map(grupo => ({
      estado: grupo.estado,
      cantidad: grupo._count.id,
      monto: Number(grupo._sum.total) || 0
    }));

    // 3. Análisis financiero del mes vs mes anterior (REAL)
    const [ventasMesAnterior, egresosMes, egresosMesAnterior] = await Promise.all([
      prisma.transaccion.aggregate({
        where: {
          tipo: { in: ['INGRESO', 'PAGO_OBRA', 'ANTICIPO'] },
          fecha: { gte: startOfLastMonth, lt: startOfMonth }
        },
        _sum: { monto: true }
      }),
      prisma.transaccion.aggregate({
        where: {
          tipo: { in: ['EGRESO', 'PAGO_PROVEEDOR', 'GASTO_GENERAL'] },
          fecha: { gte: startOfMonth }
        },
        _sum: { monto: true }
      }),
      prisma.transaccion.aggregate({
        where: {
          tipo: { in: ['EGRESO', 'PAGO_PROVEEDOR', 'GASTO_GENERAL'] },
          fecha: { gte: startOfLastMonth, lt: startOfMonth }
        },
        _sum: { monto: true }
      })
    ]);

    const ventasActuales = Number(ventasMes._sum.monto) || 0;
    const ventasPrevias = Number(ventasMesAnterior._sum.monto) || 0;
    const egresosActuales = Number(egresosMes._sum.monto) || 0;
    const egresosPrevios = Number(egresosMesAnterior._sum.monto) || 0;

    const tendenciaVentas = ventasPrevias > 0 ? ((ventasActuales - ventasPrevias) / ventasPrevias) * 100 : 0;
    const margenReal = ventasActuales > 0 ? ((ventasActuales - egresosActuales) / ventasActuales) * 100 : 0;

    // 4. Análisis de productividad (REAL)
    const [transaccionesCount, clientesNuevos, presupuestosGenerados] = await Promise.all([
      prisma.transaccion.count({
        where: { fecha: { gte: startOfMonth } }
      }),
      prisma.cliente.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      prisma.presupuesto.count({
        where: { fechaEmision: { gte: startOfMonth } }
      })
    ]);

    // 5. Ventas por día de la última semana (MEJORADO)
    const ventasPorDia = await prisma.$queryRaw`
      SELECT 
        DATE(fecha) as fecha,
        SUM(CASE WHEN tipo IN ('INGRESO', 'PAGO_OBRA', 'ANTICIPO') THEN monto ELSE 0 END) as ingresos,
        SUM(CASE WHEN tipo IN ('EGRESO', 'PAGO_PROVEEDOR', 'GASTO_GENERAL') THEN monto ELSE 0 END) as egresos,
        COUNT(*) as transacciones
      FROM "transacciones"
      WHERE fecha >= ${new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE(fecha)
      ORDER BY fecha ASC
    `;

    // 6. Análisis de medios de pago más utilizados (REAL)
    const mediosPagoStats = await prisma.transaccion.groupBy({
      by: ['medioPagoId'],
      _count: { id: true },
      _sum: { monto: true },
      where: {
        fecha: { gte: startOfMonth }
      },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const mediosPagoConNombres = await Promise.all(
      mediosPagoStats.map(async (stat) => {
        const medioPago = await prisma.medioPago.findUnique({
          where: { id: stat.medioPagoId },
          select: { nombre: true }
        });
        return {
          nombre: medioPago?.nombre || 'Sin especificar',
          cantidad: stat._count.id,
          monto: Number(stat._sum.monto) || 0
        };
      })
    );

    // 7. Clientes más activos del mes (REAL)
    const clientesMasActivos = await prisma.transaccion.groupBy({
      by: ['clienteId'],
      _count: { id: true },
      _sum: { monto: true },
      where: {
        clienteId: { not: null },
        fecha: { gte: startOfMonth }
      },
      orderBy: { _sum: { monto: 'desc' } },
      take: 5
    });

    const clientesConNombres = await Promise.all(
      clientesMasActivos.map(async (stat) => {
        const cliente = await prisma.cliente.findUnique({
          where: { id: stat.clienteId! },
          select: { nombre: true, codigo: true }
        });
        return {
          cliente: cliente?.nombre || 'Cliente eliminado',
          codigo: cliente?.codigo || '',
          transacciones: stat._count.id,
          monto: Number(stat._sum.monto) || 0
        };
      })
    );

    // 8. Proyección basada en tendencia (CALCULADO)
    const diasDelMes = now.getDate();
    const diasTotalesMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const proyeccionVentas = diasDelMes > 0 ? (ventasActuales / diasDelMes) * diasTotalesMes : 0;

    // 9. Alertas inteligentes (CALCULADAS)
    const alertasInteligentes = {
      presupuestosVencen: presupuestosVencenProximamente.length,
      pedidosAtrasados: pedidosEnProceso.filter(p => 
        p.fechaEntrega && new Date(p.fechaEntrega) < now
      ).length,
      clientesSinActividad: await prisma.cliente.count({
        where: {
          activo: true,
          transacciones: {
            none: {
              fecha: { gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) } // 60 días
            }
          }
        }
      }),
      stockCritico: await prisma.material.count({
        where: {
          activo: true,
          stockActual: { lte: prisma.material.fields.stockMinimo }
        }
      })
    };

    console.log('✅ Dashboard data calculated successfully');
    
    return NextResponse.json({
      // Datos básicos (sin cambios)
      estadisticas: {
        totalClientes,
        totalPresupuestosPendientes,
        totalPedidosPendientes,
        ventasMes: ventasActuales,
        saldosPorCobrar: Number(saldosPorCobrar._sum.saldoPendiente) || 0
      },
      transaccionesRecientes,
      presupuestosVencenProximamente,
      pedidosEnProceso,
      ventasPorDia,
      
      // NUEVOS DATOS REALES
      analisisFinanciero: {
        ventasActuales,
        ventasPrevias,
        egresosActuales,
        egresosPrevios,
        tendenciaVentas,
        margenReal,
        flujoNeto: ventasActuales - egresosActuales,
        proyeccionVentas
      },
      
      estadosPresupuestos: estadosPresupuestos.reduce((acc, estado) => {
        acc[estado.estado] = {
          cantidad: estado.cantidad,
          monto: estado.monto
        };
        return acc;
      }, {} as Record<string, { cantidad: number; monto: number }>),
      
      estadosPedidos: estadosPedidos.reduce((acc, estado) => {
        acc[estado.estado] = {
          cantidad: estado.cantidad,
          monto: estado.monto
        };
        return acc;
      }, {} as Record<string, { cantidad: number; monto: number }>),
      
      productividad: {
        transaccionesCount,
        clientesNuevos,
        presupuestosGenerados,
        promedioTransaccionesPorDia: Math.round(transaccionesCount / diasDelMes)
      },
      
      mediosPagoPreferidos: mediosPagoConNombres,
      clientesMasActivos: clientesConNombres,
      
      resumen: {
        alertas: alertasInteligentes,
        metricas: {
          ticketPromedio: transaccionesCount > 0 ? ventasActuales / transaccionesCount : 0,
          clientesActivos: clientesConNombres.length,
          eficienciaCobranza: saldosPorCobrar._sum.saldoPendiente && ventasActuales > 0 ? 
            (1 - (Number(saldosPorCobrar._sum.saldoPendiente) / ventasActuales)) * 100 : 100
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error al obtener datos del dashboard:', error);
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    );
  }
}