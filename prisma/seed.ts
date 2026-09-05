import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la carga de datos iniciales (Seed)...');

  // 1. Encriptar contraseña para el gerente inicial
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 2. Crear o verificar la sucursal inicial
  const branch = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Sucursal Central',
      address: 'Av. Principal #123',
    },
  });

  // 3. Crear o verificar el primer usuario GERENTE
  const gerente = await prisma.user.upsert({
    where: { email: 'gerente@pizzeria.com' },
    update: {},
    create: {
      name: 'Gerente Principal',
      email: 'gerente@pizzeria.com',
      password: hashedPassword,
      role: Role.GERENTE,
      branchId: branch.id,
    },
  });

  console.log('✅ Sucursal creada:', branch.name);
  console.log(`✅ Gerente creado con éxito: ${gerente.email} (Password: admin123)`);
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });