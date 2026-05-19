import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando la siembra de datos (Seed)...')

  // 1. Limpiar base de datos para evitar duplicados
  await prisma.cotizacion.deleteMany()
  await prisma.llamada.deleteMany()
  await prisma.cliente.deleteMany()
  await prisma.vendedor.deleteMany()

  // 2. Crear Vendedor (Laura Acosta)
  const laura = await prisma.vendedor.create({
    data: {
      nombre: 'Laura Acosta',
      email: 'laura.acosta@latamsupply.com',
      rolCanal: 'Moneycall',
      limiteCuentas: 100,
      certificaciones: {
        juegoDeRoles: true,
        crmCertificado: true,
        scriptsMoneycall: true
      }
    }
  })
  console.log(`👤 Vendedor creado: ${laura.nombre}`)

  // 3. Crear Clientes del portafolio 80/20 asignados a Laura
  const cliente1 = await prisma.cliente.create({
    data: {
      vendedorId: laura.id,
      nombreEmpresa: 'Boca Cooling Solutions',
      contactoPrincipal: 'Carlos Rivera',
      telefono: '+1 561-555-0192',
      segmentoPareto: 'Marginal 80%',
      respuestas5Q: {
        q1: 'La rapidez en el despacho Will Call.',
        q2: 'El crédito flexible que da el competidor A.',
        q3: '35% con nosotros, 65% con competidores.',
        q4: 'Motores monofásicos de 1.5 HP.',
        q5: 'Reemplazo residencial de alta eficiencia en Delray.'
      }
    }
  })

  const cliente2 = await prisma.cliente.create({
    data: {
      vendedorId: laura.id,
      nombreEmpresa: 'Jones Plumbing & HVAC',
      contactoPrincipal: 'David Jones',
      telefono: '+1 561-555-0185',
      segmentoPareto: 'Marginal 80%',
      respuestas5Q: {
        q1: 'El soporte técnico telefónico de Laura.',
        q2: 'La variedad de marcas de equipos.',
        q3: '50% con nosotros, 50% con competidores.',
        q4: 'Tubería de cobre de 7/8 pulgadas.',
        q5: 'Contratos comerciales con colegios.'
      }
    }
  })

  const cliente3 = await prisma.cliente.create({
    data: {
      vendedorId: laura.id,
      nombreEmpresa: 'Delray Comfort Experts',
      contactoPrincipal: 'Mark Wilson',
      telefono: '+1 561-555-0245',
      segmentoPareto: 'Marginal 80%',
      respuestas5Q: {
        q1: 'El trato personal.',
        q2: 'Precios en herramientas.',
        q3: '40% con nosotros, 60% competencia.',
        q4: 'Válvulas de expansión térmica.',
        q5: 'Instalaciones geotérmicas.'
      }
    }
  })

  const cliente4 = await prisma.cliente.create({
    data: {
      vendedorId: laura.id,
      nombreEmpresa: 'Broward Mechanical Contractors',
      contactoPrincipal: 'Sandra Smith',
      telefono: '+1 954-555-0143',
      segmentoPareto: 'Marginal 80%',
      respuestas5Q: null
    }
  })

  const cliente5 = await prisma.cliente.create({
    data: {
      vendedorId: laura.id,
      nombreEmpresa: 'Acme Air Conditioning',
      contactoPrincipal: 'Thomas Jenkins',
      telefono: '+1 561-555-0231',
      segmentoPareto: 'Top 20%',
      respuestas5Q: {
        q1: 'El OTD (On-Time Delivery) es excelente.',
        q2: 'Tienen un portal web más intuitivo.',
        q3: '80% con nosotros, 20% competencia.',
        q4: 'Nada por ahora.',
        q5: 'Equipos VRF industriales.'
      }
    }
  })

  console.log('🏢 Clientes creados con éxito')

  // 4. Crear llamadas proactivas S1/S2/DC
  await prisma.llamada.createMany({
    data: [
      { clienteId: cliente1.id, tipoLlamada: 'S1', direccion: 'Saliente', comentarios: 'Llamada de alerta por tubería sin comprar.' },
      { clienteId: cliente1.id, tipoLlamada: 'S2', direccion: 'Saliente', comentarios: 'Se ofreció el kit de instalación.' },
      { clienteId: cliente1.id, tipoLlamada: 'DC', direccion: 'Saliente', satisfaccionDc: true, comentarios: 'Minisplit entregado conforme.' },
      { clienteId: cliente2.id, tipoLlamada: 'S1', direccion: 'Saliente', comentarios: 'Reactiva de recuperación.' },
      { clienteId: cliente2.id, tipoLlamada: 'PT', direccion: 'Saliente', comentarios: 'Llamada trimestral para saludar.' },
      { clienteId: cliente3.id, tipoLlamada: 'DC', direccion: 'Saliente', satisfaccionDc: true },
      { clienteId: cliente4.id, tipoLlamada: 'S1', direccion: 'Saliente', comentarios: 'Intento de reactivación de cuenta.' }
    ]
  })
  console.log('📞 Llamadas de prueba registradas')

  // 5. Crear cotizaciones de prueba con seguimiento F1/F2
  await prisma.cotizacion.createMany({
    data: [
      { clienteId: cliente1.id, monto: 8450.00, estado: 'Pendiente', seguimientoF1: true, fechaDecisionF1: new Date('2026-05-20') },
      { clienteId: cliente2.id, monto: 14200.00, estado: 'Ganada', seguimientoF1: true, seguimientoF2: true },
      { clienteId: cliente3.id, monto: 19800.00, estado: 'Pendiente', seguimientoF1: true, fechaDecisionF1: new Date('2026-05-19') },
      { clienteId: cliente4.id, monto: 4800.00, estado: 'Pendiente', seguimientoF1: false }
    ]
  })
  console.log('💵 Cotizaciones de prueba creadas')

  console.log('🌱 ¡Siembra de datos completada exitosamente!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
