// prisma/seed.ts

// Importa PrismaClient para interactuar con la base de datos
// y Role (enum generado por Prisma) para asignar roles a los usuarios.
import { PrismaClient, Role } from '@prisma/client';
// Importa bcrypt para encriptar (hashear) contraseñas antes de guardarlas.
import * as bcrypt from 'bcrypt';

// Crea una única instancia de PrismaClient para reutilizarla en todo el script.
const prisma = new PrismaClient();

/**
 * main: función principal del seed.
 * Se encarga de poblar (sembrar) la base de datos con datos iniciales:
 * una sucursal, un admin general, un gerente y un usuario por cada rol restante.
 */
async function main() {
  console.log('🌱 Iniciando el proceso de siembra (seed)...');

  // 1. Limpieza de datos existentes.
  // Se eliminan primero las tablas dependientes (orderItem, order, cashRegister)
  // y después las principales (user, branch) para evitar errores de llaves foráneas.
  // Sirve para que el seed sea idempotente (se pueda correr varias veces sin duplicar).
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // 2. Crea una sucursal principal (branch) con nombre y dirección.
  // branch.id se usará luego para asociar usuarios a esta sucursal.
  const branch = await prisma.branch.create({
    data: {
      name: 'Sucursal Centro',
      address: 'Av. Principal #123, Col. Centro',
    },
  });
  console.log(`✅ Sucursal creada: ${branch.name} (ID: ${branch.id})`);

  // Genera una contraseña encriptada por defecto ("123456") para todos los usuarios.
  // El segundo argumento (10) es el número de rondas de salting de bcrypt.
  const hashedPassword = await bcrypt.hash('123456', 10);

  // 3. Crea el Administrador General.
  // Este rol no pertenece a ninguna sucursal, por eso branchId: null.
  const adminGeneral = await prisma.user.create({
    data: {
      name: 'Administrador General',
      email: 'admin@pizzeria.com',
      password: hashedPassword,
      role: Role.ADMIN_GENERAL,
      branchId: null,
    },
  });
  console.log(`👑 Admin General creado: ${adminGeneral.email}`);

  // 4. Crea el Gerente de la sucursal recién creada.
  // Se le asigna branchId: branch.id para vincularlo a "Sucursal Centro".
  const gerente = await prisma.user.create({
    data: {
      name: 'Gerente Sucursal',
      email: 'gerente.centro@pizzeria.com',
      password: hashedPassword,
      role: Role.GERENTE,
      branchId: branch.id,
    },
  });
  console.log(`👔 Gerente creado: ${gerente.email} para la sucursal ${branch.name}`);

  // 5. Crea un usuario por cada rol restante (CAJERO, COCINA, REPARTIDOR).
  // Se define un arreglo con los roles que faltan por crear.
  const rolesRestantes: Role[] = [Role.CAJERO, Role.COCINA, Role.REPARTIDOR];

  // Itera sobre cada rol y crea un usuario asociado a la sucursal.
  // El email se genera dinámicamente usando el nombre del rol en minúsculas.
  for (const role of rolesRestantes) {
    const user = await prisma.user.create({
      data: {
        name: `Usuario ${role.toLowerCase()}`,
        email: `${role.toLowerCase()}.centro@pizzeria.com`,
        password: hashedPassword,
        role: role,
        branchId: branch.id,
      },
    });
    console.log(`👤 Usuario con rol ${role} creado: ${user.email}`);
  }

  console.log('✨ ¡Base de datos sembrada con éxito!');
}

// Ejecuta la función main.
// .catch captura cualquier error, lo imprime y termina el proceso con código 1 (error).
// .finally se ejecuta siempre al final y cierra la conexión a la base de datos con $disconnect().
main()
  .catch((e) => {
    console.error('❌ Error durante la siembra:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });