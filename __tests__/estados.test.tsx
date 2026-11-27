/** Estados de carga y vacío (D-32): sin pantallas en blanco y sin textos nuevos. */
import { render, screen } from '@testing-library/react-native';

import { LineasCargando, PantallaCargando, Vacio } from '@/componentes/estados';
import '@/i18n';

describe('estados', () => {
  it('el vacío muestra el texto que ya existe junto a un ícono', async () => {
    await render(<Vacio icono="cultivo">Todavía no tenés cultivos.</Vacio>);
    expect(screen.getByText('Todavía no tenés cultivos.')).toBeTruthy();
  });

  it('mientras carga, se anuncia como ocupado y no muestra textos', async () => {
    await render(<PantallaCargando />);
    expect(screen.queryAllByText(/./)).toHaveLength(0);
    expect(JSON.stringify(screen.toJSON())).toContain('"busy":true');
  });

  it('las líneas de carga no tienen texto', async () => {
    await render(<LineasCargando lineas={2} />);
    expect(screen.queryAllByText(/./)).toHaveLength(0);
  });
});
