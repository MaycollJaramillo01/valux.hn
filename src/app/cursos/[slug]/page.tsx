import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  const course = await prisma.course.findUnique({
    where: { slug, published: true },
    include: { lessons: { orderBy: { order: 'asc' } } },
  });
  if (!course) notFound();

  const enrollment = session?.user
    ? await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
      })
    : null;

  async function enroll() {
    'use server';
    const session = await auth();
    if (!session?.user) redirect(`/login?callbackUrl=/cursos/${slug}`);
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: session.user.id, courseId: course!.id } },
      update: {},
      create: { userId: session.user.id, courseId: course!.id },
    });
    revalidatePath(`/cursos/${slug}`);
  }

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="bg-soft">
          <div className="container container-narrow">
            <div className="section-head center">
              <span className="eyebrow" data-es="Curso" data-en="Course">Curso</span>
              <h2>{course.title}</h2>
              <p className="lead">{course.description}</p>
            </div>

            {enrollment ? (
              <p style={{ textAlign: 'center', marginBottom: '2rem' }} data-es="Ya estás inscrito en este curso." data-en="You are enrolled in this course.">
                Ya estás inscrito en este curso.
              </p>
            ) : (
              <form action={enroll} style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <button type="submit" className="btn btn-primary">
                  <span data-es="Inscribirme" data-en="Enroll">Inscribirme</span>
                  <span className="arrow">→</span>
                </button>
              </form>
            )}

            <ol className="principle-list">
              {course.lessons.map((lesson, i) => (
                <li key={lesson.id}>
                  <span className="list-index">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{lesson.title}</h3>
                  {enrollment ? (
                    <p>
                      <a href={`/cursos/${course.slug}/${lesson.slug}`} data-es="Ver lección" data-en="View lesson">
                        Ver lección
                      </a>
                    </p>
                  ) : (
                    <p data-es="Inscribite para acceder." data-en="Enroll to access.">Inscribite para acceder.</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
