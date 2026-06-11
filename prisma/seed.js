/* Datos de ejemplo: profesor demo y un curso publicado con secciones,
   lecciones con recursos y puntajes.
   Ejecutar con: npm run db:seed */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Profesor demo (login: profe@valux.hn / profesor123)
  const teacher = await prisma.user.upsert({
    where: { email: 'profe@valux.hn' },
    update: { role: 'TEACHER' },
    create: {
      name: 'Profesor VALUX',
      email: 'profe@valux.hn',
      passwordHash: await bcrypt.hash('profesor123', 12),
      role: 'TEACHER',
      emailVerified: new Date(),
    },
  });

  // Curso de ejemplo (se recrea limpio en cada seed)
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

  console.log('Seed completado. Profesor demo: profe@valux.hn / profesor123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
