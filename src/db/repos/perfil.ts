import type { Plan } from '@/reglas/dominio';

import type { BaseDatos, PerfilCultivo } from '../tipos';

export type { Plan };

export type Perfil = {
  onboarded: boolean;
  perfil: PerfilCultivo | null;
  /** Caché local del plan. La fuente de verdad será el entitlement de RevenueCat (H5). */
  plan: Plan;
  /** Cultivos propios creados alguna vez ("creados" del ledger del prototipo): no baja al borrar. */
  cultivosCreados: number;
};

type Fila = { onboarded: number; perfil: PerfilCultivo | null; plan: Plan; cultivos_creados: number };

export async function obtenerPerfil(db: BaseDatos): Promise<Perfil | null> {
  const f = await db.getFirstAsync<Fila>(
    'SELECT onboarded, perfil, plan, cultivos_creados FROM perfil WHERE id = 1',
  );
  if (!f) return null;
  return { onboarded: f.onboarded === 1, perfil: f.perfil, plan: f.plan, cultivosCreados: f.cultivos_creados };
}

export async function actualizarPerfil(
  db: BaseDatos,
  cambios: Partial<Pick<Perfil, 'onboarded' | 'perfil' | 'plan'>>,
  ahora: Date = new Date(),
): Promise<void> {
  const sets: string[] = [];
  const valores: (string | number | null)[] = [];
  if (cambios.onboarded !== undefined) { sets.push('onboarded = ?'); valores.push(cambios.onboarded ? 1 : 0); }
  if (cambios.perfil !== undefined) { sets.push('perfil = ?'); valores.push(cambios.perfil); }
  if (cambios.plan !== undefined) { sets.push('plan = ?'); valores.push(cambios.plan); }
  if (!sets.length) return;
  sets.push('actualizado_en = ?');
  valores.push(ahora.toISOString());
  await db.runAsync(`UPDATE perfil SET ${sets.join(', ')} WHERE id = 1`, valores);
}
