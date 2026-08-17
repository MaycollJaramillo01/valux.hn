import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isJunta } from '@/lib/access';
import { parseStaffRole, wouldLeaveNoAdmin } from '@/lib/staff';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import type { CSSProperties } from 'react';

export const metadata = { title: 'Personas - Junta VALUX' };

const field: CSSProperties = {
  padding: '0.75rem',
  border: '1px solid #cbd5e1',
  fontFamily: 'inherit',
};

export default async function AsociadosPage() {
  const session = await auth();
  if (!session?.user || !isJunta((session.user as { role?: string }).role)) redirect('/panel');

  const users = await prisma.user.findMany({
    where: { role: { in: ['ASSOCIATE', 'TEACHER', 'ADMIN'] } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  async function createPerson(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user || !isJunta((session.user as { role?: string }).role)) return;
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const role = parseStaffRole(formData.get('role'));
    if (!name || name.length < 2 || !email.includes('@') || password.length < 8 || !role) return;
    if (role === 'USER') return;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return;
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role,
        emailVerified: new Date(),
      },
    });
    revalidatePath('/panel/junta/asociados');
  }

  async function setRole(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user || !isJunta((session.user as { role?: string }).role)) return;
    const id = String(formData.get('id'));
    const role = parseStaffRole(formData.get('role'));
    if (!role) return;
    if (await wouldLeaveNoAdmin({ targetId: id, nextRole: role })) return;
    await prisma.user.update({ where: { id }, data: { role } });
    revalidatePath('/panel/junta/asociados');
  }

  async function setActive(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user || !isJunta((session.user as { role?: string }).role)) return;
    const id = String(formData.get('id'));
    if (id === session.user.id) return;
    const nextActive = String(formData.get('next')) === '1';
    if (!nextActive && (await wouldLeaveNoAdmin({ targetId: id, nextActive: false }))) return;
    await prisma.user.update({ where: { id }, data: { isActive: nextActive } });
    revalidatePath('/panel/junta/asociados');
  }

  return (
    <div>
      <h1>Personas</h1>
      <p style={{ color: '#475569' }}>Junta, asociados y profesores.</p>

      <form
        action={createPerson}
        style={{
          marginTop: '2rem',
          background: '#fff',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          alignItems: 'end',
        }}
      >
        <p style={{ gridColumn: '1 / -1', margin: 0, fontWeight: 700 }}>Nueva persona</p>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
          Nombre
          <input name="name" required minLength={2} style={field} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
          Email
          <input name="email" type="email" required style={field} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
          Contraseña inicial
          <input name="password" type="password" required minLength={8} autoComplete="new-password" style={field} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
          Rol
          <select name="role" defaultValue="ASSOCIATE" style={field}>
            <option value="ASSOCIATE">Asociado</option>
            <option value="TEACHER">Profesor</option>
            <option value="ADMIN">Junta</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary">
          Crear
        </button>
      </form>

      <table style={{ width: '100%', marginTop: '2rem', background: '#fff', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Nombre</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Rol</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Estado</th>
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
              <td style={{ padding: '0.75rem' }}>
                {user.isActive ? 'Activo' : 'Inactivo'}
                {user.id !== session.user.id ? (
                  <form action={setActive} style={{ display: 'inline', marginLeft: '0.5rem' }}>
                    <input type="hidden" name="id" value={user.id} />
                    <input type="hidden" name="next" value={user.isActive ? '0' : '1'} />
                    <button className="btn btn-ghost btn-sm">{user.isActive ? 'Desactivar' : 'Activar'}</button>
                  </form>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
