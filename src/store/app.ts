import { create } from 'zustand';

import type { Plan } from '@/db/repos/perfil';
import type { Reconocimiento } from '@/servicios/agenteIA';

export type { Plan };

/**
 * Mensaje del chat con el Agente. `foto`: URI local de la foto que mandó el usuario (D-30).
 * `reco`: candidatos, pregunta y avisos del reconocimiento con fotos y preguntas (D-31).
 */
export type MensajeChat = { de: 'agente' | 'vos'; t: string; foto?: string; reco?: Reconocimiento };

type EstadoApp = {
  /** Plan vigente. En H5 lo decide el entitlement `pro` de RevenueCat; mientras tanto, el perfil local. */
  plan: Plan;
  /** Ciclo elegido para Pro (solo para la opinión de la prueba, como el prototipo). */
  ciclo: 'mensual' | 'anual';
  /** Hay un examen en curso: se bloquean las otras pestañas. */
  examenEnCurso: boolean;
  /** Conversación con el Agente durante la sesión (como el prototipo: no se guarda). */
  chat: MensajeChat[];
  setPlan: (plan: Plan) => void;
  setCiclo: (ciclo: 'mensual' | 'anual') => void;
  setExamenEnCurso: (v: boolean) => void;
  agregarAlChat: (...mensajes: MensajeChat[]) => void;
  reiniciarChat: (saludo: string) => void;
};

export const useApp = create<EstadoApp>()((set, get) => ({
  plan: 'gratis',
  ciclo: 'mensual',
  examenEnCurso: false,
  chat: [],
  setPlan: (plan) => set({ plan }),
  setCiclo: (ciclo) => set({ ciclo }),
  setExamenEnCurso: (examenEnCurso) => set({ examenEnCurso }),
  agregarAlChat: (...mensajes) => set({ chat: [...get().chat, ...mensajes] }),
  reiniciarChat: (saludo) => set({ chat: [{ de: 'agente', t: saludo }] }),
}));
