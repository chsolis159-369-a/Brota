/**
 * Configuración (D-35): idioma, tamaño de letra, modo de pantalla, perfil con el borrado de la cuenta,
 * privacidad y términos. Con datos reales (store + SQLite en memoria).
 */
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Appearance } from 'react-native';

import PantallaConfiguracion from '@/app/configuracion';
import { Texto } from '@/componentes/Texto';
import { inicializarDatos, migrar } from '@/db';
import i18n from '@/i18n';
import { useApp } from '@/store/app';
import { useDatos } from '@/store/datos';
import { ESCALA_LETRA, usePreferencias } from '@/store/preferencias';
import { TEXTO } from '@/tema/tipografia';

import { abrirBaseDePrueba } from './ayudas/sqlite-node';

jest.setTimeout(20000);

const mockRouter = { push: jest.fn(), navigate: jest.fn(), back: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, router: { push: jest.fn() } }));
jest.mock('@/servicios/fotos', () => ({ elegirFoto: jest.fn(), borrarArchivo: jest.fn() }));

const S = () => useDatos.getState();

beforeEach(async () => {
  jest.clearAllMocks();
  const db = abrirBaseDePrueba();
  await migrar(db);
  await inicializarDatos(db);
  await S().cargar(db);
  useApp.setState({ plan: 'gratis' });
  await act(async () => {
    usePreferencias.getState().setTamanoLetra('normal');
    usePreferencias.getState().setTema('sistema');
  });
});

describe('Configuración', () => {
  it('muestra las secciones y vuelve con el botón de arriba', async () => {
    await render(<PantallaConfiguracion />);
    for (const titulo of ['Configuración', 'Idioma', 'Tamaño de letra', 'Modo de pantalla', 'Perfil', 'Privacidad y términos']) {
      expect(screen.getByText(titulo)).toBeTruthy();
    }
    expect(screen.getByText('Tu plan: Gratis')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('volver-configuracion'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('el tamaño de letra agranda el texto de la app', async () => {
    await render(<Texto variante="cuerpo">Hola</Texto>);
    const tamano = () => [screen.getByText('Hola').props.style].flat(3).filter(Boolean).reduce((t, x) => x.fontSize ?? t, 0);
    expect(tamano()).toBe(TEXTO.cuerpo.fontSize);
    await act(async () => usePreferencias.getState().setTamanoLetra('muyGrande'));
    expect(tamano()).toBeCloseTo(TEXTO.cuerpo.fontSize * ESCALA_LETRA.muyGrande);
  });

  it('elegir el modo de pantalla lo aplica a toda la app', async () => {
    const aplicar = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
    await render(<PantallaConfiguracion />);
    await fireEvent.press(screen.getByTestId('tema-oscuro'));
    expect(aplicar).toHaveBeenLastCalledWith('dark');
    await fireEvent.press(screen.getByTestId('tema-sistema'));
    expect(aplicar).toHaveBeenLastCalledWith('auto');
    expect(usePreferencias.getState().tema).toBe('sistema');
    aplicar.mockRestore();
  });

  it('cambiar la forma de cultivar actualiza el perfil', async () => {
    await render(<PantallaConfiguracion />);
    await fireEvent.press(screen.getByText('Hidroponía'));
    expect(S().perfil.perfil).toBe('hidro');
  });

  it('privacidad y términos se despliegan y se ocultan', async () => {
    await render(<PantallaConfiguracion />);
    await fireEvent.press(screen.getByText('Ver cómo tratamos tus datos'));
    expect(screen.getByText('Podés borrar tu cuenta y todos los datos desde Configuración > Perfil.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('ver-terminos'));
    expect(screen.getByText('Términos y condiciones')).toBeTruthy();
    expect(screen.getByText(/^El guía usa inteligencia artificial y puede equivocarse/)).toBeTruthy();
    for (const boton of screen.getAllByText('Ocultar')) await fireEvent.press(boton);
    expect(screen.queryByText('Términos y condiciones')).toBeNull();
    expect(screen.queryByText('Tus datos')).toBeNull();
  });

  it('borrar la cuenta es un enlace chico que pide confirmación, borra todo y vuelve', async () => {
    await render(<PantallaConfiguracion />);
    await fireEvent.press(screen.getByTestId('borrar-cuenta'));
    expect(screen.getByText('Se eliminan cultivos, bitácora, progreso, exámenes y tareas de este dispositivo. No se puede deshacer.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Cancelar'));
    expect(S().cultivos).toHaveLength(2);
    await fireEvent.press(screen.getByTestId('borrar-cuenta'));
    await fireEvent.press(screen.getByTestId('confirmar-borrado'));
    expect(S().cultivos).toEqual([]);
    expect(S().perfil.plan).toBe('gratis');
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('el idioma por defecto es español y se puede elegir', async () => {
    expect(i18n.language).toBe('es-AR');
    await render(<PantallaConfiguracion />);
    expect(screen.getByTestId('idioma-es-AR')).toBeTruthy();
    expect(screen.queryByText('Las lecciones, las preguntas y el glosario están en español por ahora.')).toBeNull();
  });
});
