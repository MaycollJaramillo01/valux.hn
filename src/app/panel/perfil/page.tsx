import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Mi Perfil - VALUX' };

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const existingProfile = await prisma.creatorProfile.findUnique({
    where: { userId: session.user.id }
  });

  async function saveProfile(formData: FormData) {
    'use server';
    
    const session = await auth();
    if (!session?.user?.id) return;

    const bio = formData.get('bio') as string;
    const niche = formData.get('niche') as string;
    const instagramUrl = formData.get('instagram') as string; 

    await prisma.creatorProfile.upsert({
      where: { userId: session.user.id },
      update: { bio, niche, instagramUrl },
      create: { 
        userId: session.user.id,
        bio, 
        niche, 
        instagramUrl
      }
    });

    redirect('/panel');
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Perfil de Creador
        </h1>
        <p style={{ color: '#475569', fontSize: '1.125rem' }}>
          Completa tu información. Estos datos serán visibles en el directorio público de Sinergias para conectar con marcas y otros creadores.
        </p>
      </header>

      <form action={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#fff', padding: '2rem', border: '1px solid #e2e8f0' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="bio" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
            Biografía (Pitch de ascensor)
          </label>
          <textarea 
            id="bio" 
            name="bio" 
            rows={4} 
            defaultValue={existingProfile?.bio || ''}
            placeholder="Soy un creador enfocado en..."
            style={{ padding: '0.75rem', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit' }}
            required
          ></textarea>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="niche" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
            Nicho principal
          </label>
          <select 
            id="niche" 
            name="niche"
            defaultValue={existingProfile?.niche || ''}
            style={{ padding: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontFamily: 'inherit' }}
            required
          >
            <option value="">Selecciona una categoría...</option>
            <option value="tecnologia">Tecnología y Software</option>
            <option value="entretenimiento">Entretenimiento y Comedia</option>
            <option value="educacion">Educación y Divulgación</option>
            <option value="lifestyle">Lifestyle y Vlogs</option>
            <option value="negocios">Negocios y Finanzas</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="instagram" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
            Enlace de Instagram
          </label>
          <input 
            type="url" 
            id="instagram" 
            name="instagram" 
            defaultValue={existingProfile?.instagramUrl || ''} 
            placeholder="https://instagram.com/tuusuario"
            style={{ padding: '0.75rem', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="btn btn-primary">
            Guardar Perfil
          </button>
        </div>
      </form>
    </div>
  );
}