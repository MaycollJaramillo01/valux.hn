import { prisma } from '@/lib/prisma';
import { sendBlogUpdateEmail } from '@/lib/email';

export async function notifyBlogSubscribers(post: {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  notifySentAt: Date | null;
}) {
  if (post.notifySentAt) return;
  if (!process.env.RESEND_API_KEY) {
    await prisma.blogPost.update({ where: { id: post.id }, data: { notifySentAt: new Date() } });
    return;
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { unsubscribedAt: null },
    select: { email: true },
  });

  for (const subscriber of subscribers) {
    try {
      await sendBlogUpdateEmail(subscriber.email, post);
    } catch (err) {
      console.error('Newsletter blog:', subscriber.email, err);
    }
  }

  await prisma.blogPost.update({ where: { id: post.id }, data: { notifySentAt: new Date() } });
}
