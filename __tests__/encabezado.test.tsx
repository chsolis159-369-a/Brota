import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { Encabezado } from '@/componentes/Encabezado';
import '@/i18n';
import { useApp } from '@/store/app';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) } }));

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

  it('el engranaje abre Configuración y se desactiva durante un examen (D-35)', async () => {
    await render(<Encabezado />);
    await fireEvent.press(screen.getByLabelText('Abrir configuración'));
    expect(mockPush).toHaveBeenCalledWith('/configuracion');
    await act(() => useApp.getState().setExamenEnCurso(true));
    expect(screen.getByTestId('abrir-configuracion').props.accessibilityState).toMatchObject({ disabled: true });
    await act(() => useApp.getState().setExamenEnCurso(false));
  });

  it('la marca se anuncia como encabezado', async () => {
    await render(<Encabezado />);
    expect(screen.getByRole('header', { name: 'BROTA' })).toBeTruthy();
  });
});
