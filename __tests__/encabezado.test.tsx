import { act, render, screen } from '@testing-library/react-native';

import { Encabezado } from '@/componentes/Encabezado';
import '@/i18n';
import { useApp } from '@/store/app';

describe('Encabezado', () => {
  afterEach(() => act(() => useApp.getState().setPlan('gratis')));

  it('muestra la marca, el plan gratis y la etiqueta Prueba', async () => {
    await render(<Encabezado />);
    expect(screen.getByText('BROTA')).toBeTruthy();
    expect(screen.getByText('Plan gratis')).toBeTruthy();
    expect(screen.getByText('Prueba')).toBeTruthy();
  });

  it('muestra Pro cuando el plan es Pro', async () => {
    await act(() => useApp.getState().setPlan('pro'));
    await render(<Encabezado />);
    expect(screen.getByText('Pro')).toBeTruthy();
    expect(screen.queryByText('Plan gratis')).toBeNull();
  });

  it('la marca se anuncia como encabezado', async () => {
    await render(<Encabezado />);
    expect(screen.getByRole('header', { name: 'BROTA' })).toBeTruthy();
  });
});
