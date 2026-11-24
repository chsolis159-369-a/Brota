import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Storage from 'expo-sqlite/kv-store';

/**
 * Cliente de Supabase. Solo existe si la app se compiló con EXPO_PUBLIC_SUPABASE_URL y
 * EXPO_PUBLIC_SUPABASE_ANON_KEY (ver README); si no, la app funciona sin servidor (D-09).
 * La sesión se guarda en el almacén clave-valor de expo-sqlite.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const claveAnonima = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && claveAnonima
    ? createClient(url, claveAnonima, {
        auth: { storage: Storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
      })
    : null;

/** Asegura una sesión: si no hay, crea una anónima (sin pedir datos al usuario). */
export async function asegurarSesion(cliente: SupabaseClient): Promise<void> {
  const { data } = await cliente.auth.getSession();
  if (data.session) return;
  const { error } = await cliente.auth.signInAnonymously();
  if (error) throw error;
}
