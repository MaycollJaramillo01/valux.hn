import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isJunta } from '@/lib/access';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export const metadata = { title: 'Asociados - Junta VALUX' };

export default async function AsociadosPage() {
  const session = await auth();
  if (!session?.user || !isJunta((session.user as { role?: string }).role)) redirect('/panel');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true },
  });

  async function setRole(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user || !isJunta((session.user as { role?: string }).role)) return;
    const id = String(formData.get('id'));
    const role = String(formData.get('role')) as 'USER' | 'ASSOCIATE' | 'TEACHER' | 'ADMIN';
    if (!['USER', 'ASSOCIATE', 'TEACHER', 'ADMIN'].includes(role)) return;
    await prisma.user.update({ where: { id }, data: { role } });
    revalidatePath('/panel/junta/asociados');
  }

  return (
    <div>
      <h1>Personas</h1>
      <p style={{ color: '#475569' }}>
        Los asociados se marcan a mano. No es lo mismo que quien paga suscripción: el asociado pertenece a la asociación y puede publicar (con revisión).
      </p>
      <table style={{ width: '100%', marginTop: '1.5rem', background: '#fff', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Nombre</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Rol</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderTop: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem' }}>{user.name}</td>
              <td style={{ padding: '0.75rem' }}>{user.email}</td>
              <td style={{ padding: '0.75rem' }}>
                <form action={setRole} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="hidden" name="id" value={user.id} />
                  <select name="role" defaultValue={user.role} style={{ padding: '0.4rem' }}>
                    <option value="USER">Usuario</option>
                    <option value="ASSOCIATE">Asociado</option>
                    <option value="TEACHER">Profesor</option>
                    <option value="ADMIN">Junta</option>
                  </select>
                  <button className="btn btn-ghost btn-sm">Guardar</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
