/* Datos de ejemplo: un curso publicado con tres lecciones.
   Ejecutar con: npm run db:seed */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.course.upsert({
    where: { slug: 'creacion-de-contenido-101' },
    update: {},
    create: {
      slug: 'creacion-de-contenido-101',
      title: 'Creación de contenido 101',
      description:
        'Fundamentos para crear contenido con identidad hondureña: narrativa, formato y consistencia.',
      published: true,
      lessons: {
        create: [
          {
            slug: 'encontrar-tu-voz',
            title: 'Encontrar tu voz',
            content:
              'En esta lección exploramos cómo definir una voz propia que no suene importada: referencias locales, tono y punto de vista.',
            order: 1,
          },
          {
            slug: 'narrativa-y-formato',
            title: 'Narrativa y formato',
            content:
              'Estructura de una pieza de contenido: gancho, desarrollo y cierre. Cómo adaptar la misma historia a video corto, podcast y blog.',
            order: 2,
          },
          {
            slug: 'consistencia-y-comunidad',
            title: 'Consistencia y comunidad',
            content:
              'Publicar con criterio y constancia, medir lo que importa y construir comunidad en lugar de perseguir likes sueltos.',
            order: 3,
          },
        ],
      },
    },
  });
  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
