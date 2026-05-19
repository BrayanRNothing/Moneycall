import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.vendedor.update({
    where: { id: 1 },
    data: { nombre: 'Gerente Admin', username: 'admin', password: '123', isAdmin: true, rolCanal: 'Gerencia' }
  })
  
  await prisma.vendedor.upsert({
    where: { username: 'laura' },
    update: {},
    create: { nombre: 'Laura Acosta', username: 'laura', password: '123', isAdmin: false, rolCanal: 'Moneycall' }
  })
  
  console.log('Seed completed: users "admin" and "laura" created/updated with password "123"')
}

main().catch(console.error).finally(() => prisma.$disconnect())
