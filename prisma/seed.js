/* Seed de contenido de ejemplo.
   NUNCA pongas contraseñas acá: el repo no debe poder usarse para entrar.
   Cuentas (junta / profesor) solo si existen en .env, que no se sube a GitHub:
     SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME
     SEED_TEACHER_EMAIL, SEED_TEACHER_PASSWORD, SEED_TEACHER_NAME */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function upsertStaffFromEnv(role, emailKey, passwordKey, nameKey, fallbackName) {
  const email = (process.env[emailKey] || '').trim().toLowerCase();
  const password = process.env[passwordKey] || '';
  const name = (process.env[nameKey] || '').trim() || fallbackName;
  if (!email) return null;
  if (password.length < 12) {
    throw new Error(`${passwordKey} debe tener al menos 12 caracteres (no se guardan claves en el repo).`);
  }
  return prisma.user.upsert({
    where: { email },
    update: { role, name, passwordHash: await bcrypt.hash(password, 12), emailVerified: new Date() },
    create: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      emailVerified: new Date(),
    },
  });
}

async function main() {
  await prisma.platformSettings.upsert({
    where: { id: 'valux' },
    update: {},
    create: { id: 'valux', commissionPercent: 30, subscriptionPrice: 19 },
  });

  const admin = await upsertStaffFromEnv(
    'ADMIN',
    'SEED_ADMIN_EMAIL',
    'SEED_ADMIN_PASSWORD',
    'SEED_ADMIN_NAME',
    'Junta VALUX'
  );

  let teacher = await upsertStaffFromEnv(
    'TEACHER',
    'SEED_TEACHER_EMAIL',
    'SEED_TEACHER_PASSWORD',
    'SEED_TEACHER_NAME',
    'Profesor VALUX'
  );
  if (!teacher) {
    teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' }, orderBy: { createdAt: 'asc' } });
  }

  if (!teacher) {
    console.log(
      'Seed: ajustes de plataforma listos. Sin profesor en base ni SEED_TEACHER_*; se omite el curso de ejemplo.'
    );
    if (admin) console.log('Seed: cuenta junta creada/actualizada desde .env (sin imprimir clave).');
    return;
  }

  await prisma.course.deleteMany({ where: { slug: 'creacion-de-contenido-101' } });
  const course = await prisma.course.create({
    data: {
      slug: 'creacion-de-contenido-101',
      title: 'Creación de contenido 101',
      description:
        'Fundamentos para crear contenido con identidad hondureña: narrativa, formato y consistencia.',
      published: true,
      teacherId: teacher.id,
    },
  });

  const intro = await prisma.section.create({
    data: { courseId: course.id, title: 'Introducción', order: 1 },
  });
  const comunidad = await prisma.section.create({
    data: { courseId: course.id, title: 'Comunidad y constancia', order: 2 },
  });

  await prisma.lesson.create({
    data: {
      courseId: course.id,
      sectionId: intro.id,
      slug: 'encontrar-tu-voz',
      title: 'Encontrar tu voz',
      content:
        'En esta lección exploramos cómo definir una voz propia que no suene importada: referencias locales, tono y punto de vista.',
      points: 10,
      duration: 8,
      order: 1,
      resources: {
        create: [
          { type: 'VIDEO', title: 'Clase: la voz propia', url: '/Assets/Videos/web/orlando.mp4', order: 1 },
          {
            type: 'TEXT',
            title: 'Ejercicio práctico',
            content:
              'Escribí tres ideas de contenido que solo alguien de tu ciudad podría contar. Identificá qué las hace únicas.',
            order: 2,
          },
        ],
      },
    },
  });

  await prisma.lesson.create({
    data: {
      courseId: course.id,
      sectionId: intro.id,
      slug: 'narrativa-y-formato',
      title: 'Narrativa y formato',
      content:
        'Estructura de una pieza de contenido: gancho, desarrollo y cierre. Cómo adaptar la misma historia a video corto, podcast y blog.',
      points: 15,
      duration: 12,
      order: 2,
      resources: {
        create: [{ type: 'LINK', title: 'Lectura recomendada', url: 'https://valux.hn/blog', order: 1 }],
      },
    },
  });

  await prisma.lesson.create({
    data: {
      courseId: course.id,
      sectionId: comunidad.id,
      slug: 'consistencia-y-comunidad',
      title: 'Consistencia y comunidad',
      content:
        'Publicar con criterio y constancia, medir lo que importa y construir comunidad en lugar de perseguir likes sueltos.',
      points: 25,
      duration: 15,
      order: 1,
      resources: {
        create: [
          { type: 'VIDEO', title: 'Clase: comunidad real', url: '/Assets/Videos/web/alma-pinto.mp4', order: 1 },
        ],
      },
    },
  });

  console.log('Seed completado (curso de ejemplo). Cuentas solo si vinieron por .env; no se imprimen claves.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
