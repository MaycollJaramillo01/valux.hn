import { z } from 'zod';

const text = (min: number, max: number, message: string) =>
  z.string({ required_error: message }).trim().min(min, message).max(max);

const optionalText = z
  .string()
  .trim()
  .max(400)
  .optional()
  .transform((value) => (value ? value : undefined));

export const GENDERS = ['Masculino', 'Femenino', 'Prefiero no decir'] as const;
export const MARITAL_STATUSES = ['Soltero/a', 'Casado/a', 'Unión libre', 'Divorciado/a', 'Viudo/a'] as const;
export const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'No lo sé'] as const;

export const applicationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo inválido').max(180),
  fullName: text(2, 120, 'Escribí tu nombre completo'),
  birthDate: text(4, 40, 'Indicá tu fecha de nacimiento'),
  birthPlace: text(2, 180, 'Indicá tu lugar de nacimiento'),
  nationality: text(2, 80, 'Indicá tu nacionalidad'),
  identityNumber: text(6, 40, 'Indicá tu número de identidad'),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: 'Elegí un género' }) }),
  maritalStatus: z.enum(MARITAL_STATUSES, { errorMap: () => ({ message: 'Elegí estado civil' }) }),
  address: text(8, 500, 'Escribí tu dirección de residencia'),
  phone: text(7, 40, 'Indicá un teléfono de contacto'),
  bloodType: z.enum(BLOOD_TYPES, { errorMap: () => ({ message: 'Elegí tipo de sangre' }) }),
  heightWeight: optionalText,
  altContact: text(8, 300, 'Indicá nombre, relación y teléfono del contacto alternativo'),
  favoriteColors: text(2, 200, 'Indicá tus colores favoritos'),
  favoriteFood: text(2, 200, 'Indicá tu comida favorita'),
  favoriteDessert: text(2, 200, 'Indicá tu postre favorito'),
  hobby: text(2, 200, 'Indicá tu hobby o pasatiempo'),
  occupation: text(2, 180, 'Indicá tu ocupación actual'),
  workplace: text(2, 180, 'Indicá tu lugar de trabajo'),
  educationLevel: text(2, 180, 'Indicá tu nivel de educación'),
  profession: text(2, 180, 'Indicá tu profesión'),
  orgValue: text(12, 2000, 'Contá cómo podés aportar valor a VALUX'),
  skills: text(12, 2000, 'Contá tus habilidades o experiencias'),
  socialMedia: text(4, 500, 'Indicá tu presencia en redes'),
  medicalCondition: text(2, 500, 'Indicá si tenés alguna condición médica relevante'),
  allergies: text(2, 500, 'Indicá si tenés alergias o restricciones alimentarias'),
  signature: text(2, 120, 'Escribí tu firma (nombre completo)'),
  declarationDate: text(4, 40, 'Indicá la fecha de la declaración'),
  consent: z.preprocess(
    (value) => value === true || value === 'true' || value === 'on',
    z.literal(true, { errorMap: () => ({ message: 'Tenés que aceptar la declaración' }) })
  ),
  website: z.string().max(200).optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
export type ApplicationAnswerKey = Exclude<keyof ApplicationInput, 'consent' | 'website'>;

export const applicationFieldLabels: { key: ApplicationAnswerKey | 'photoUrl'; label: string }[] = [
  { key: 'fullName', label: 'Nombre completo' },
  { key: 'email', label: 'Correo electrónico' },
  { key: 'photoUrl', label: 'Foto' },
  { key: 'birthDate', label: 'Fecha de nacimiento' },
  { key: 'birthPlace', label: 'Lugar de nacimiento' },
  { key: 'nationality', label: 'Nacionalidad' },
  { key: 'identityNumber', label: 'Número de identidad' },
  { key: 'gender', label: 'Género' },
  { key: 'maritalStatus', label: 'Estado civil' },
  { key: 'address', label: 'Dirección de residencia' },
  { key: 'phone', label: 'Teléfono de contacto' },
  { key: 'bloodType', label: 'Tipo de sangre' },
  { key: 'heightWeight', label: 'Peso y estatura' },
  { key: 'altContact', label: 'Contacto alternativo' },
  { key: 'favoriteColors', label: 'Colores favoritos' },
  { key: 'favoriteFood', label: 'Comida favorita' },
  { key: 'favoriteDessert', label: 'Postre favorito' },
  { key: 'hobby', label: 'Hobby o pasatiempo favorito' },
  { key: 'occupation', label: 'Ocupación actual' },
  { key: 'workplace', label: 'Lugar de trabajo' },
  { key: 'educationLevel', label: 'Nivel de educación' },
  { key: 'profession', label: 'Profesión' },
  { key: 'orgValue', label: 'Cómo puede aportar valor' },
  { key: 'skills', label: 'Habilidades o experiencias' },
  { key: 'socialMedia', label: 'Presencia en social media' },
  { key: 'medicalCondition', label: 'Discapacidad o condición médica' },
  { key: 'allergies', label: 'Alergia o restricción alimentaria' },
  { key: 'signature', label: 'Firma' },
  { key: 'declarationDate', label: 'Fecha de declaración' },
];

export function applicationStatusLabel(status: string) {
  switch (status) {
    case 'REVIEWING':
      return 'En revisión';
    case 'ACCEPTED':
      return 'Aceptada';
    case 'REJECTED':
      return 'Rechazada';
    default:
      return 'Nueva';
  }
}
