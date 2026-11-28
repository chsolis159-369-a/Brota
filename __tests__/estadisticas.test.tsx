/** Grilla de datos: con la letra del sistema agrandada, los recuadros se ensanchan y bajan de línea. */
import { act, render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { ANCHO_MINIMO_DATO, Estadisticas } from '@/componentes/controles';
import '@/i18n';

const ITEMS = [
  { valor: 2, etiqueta: 'cultivos', icono: 'cultivo' as const },
  { valor: 0, etiqueta: 'en cosecha', icono: 'cosecha' as const },
];

/** Cambia la letra del sistema simulada (cada prueba elige la suya). */
async function letraDelSistema(fontScale: number) {
  const ventana = { width: 411, height: 914, scale: 2.625, fontScale };
  await act(async () => {
    Dimensions.set({ window: ventana, screen: ventana });
  });
}

/** Anchos mínimos de los recuadros que quedaron en el árbol. */
const anchosMinimos = () => [...JSON.stringify(screen.toJSON()).matchAll(/"minWidth":([\d.]+)/g)].map((m) => Number(m[1]));

describe('Estadisticas', () => {
  it('con la letra normal, cada recuadro pide el ancho mínimo de siempre', async () => {
    await letraDelSistema(1);
    await render(<Estadisticas items={ITEMS} />);
    expect(screen.getByText('cultivos')).toBeTruthy();
    expect(anchosMinimos()).toEqual([ANCHO_MINIMO_DATO, ANCHO_MINIMO_DATO]);
  });

  it('con la letra al doble, cada recuadro pide el doble y no parte las palabras', async () => {
    await letraDelSistema(2);
    await render(<Estadisticas items={ITEMS} />);
    expect(anchosMinimos()).toEqual([ANCHO_MINIMO_DATO * 2, ANCHO_MINIMO_DATO * 2]);
  });

  it('con la letra achicada, no baja del ancho mínimo', async () => {
    await letraDelSistema(0.85);
    await render(<Estadisticas items={ITEMS} />);
    expect(anchosMinimos()).toEqual([ANCHO_MINIMO_DATO, ANCHO_MINIMO_DATO]);
  });
});
