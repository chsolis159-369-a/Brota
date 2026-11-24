import { create } from 'zustand';

import type { Plan } from '@/db/repos/perfil';

export type { Plan };

type EstadoApp = {
  /** Plan vigente. En H5 lo decide el entitlement `pro` de RevenueCat; mientras tanto, el perfil local. */
  plan: Plan;
  /** Hay un examen en curso: se bloquean las otras pestañas. */
  examenEnCurso: boolean;
  setPlan: (plan: Plan) => void;
  setExamenEnCurso: (v: boolean) => void;
};

export const useApp = create<EstadoApp>()((set) => ({
  plan: 'gratis',
  examenEnCurso: false,
  setPlan: (plan) => set({ plan }),
  setExamenEnCurso: (examenEnCurso) => set({ examenEnCurso }),
}));
