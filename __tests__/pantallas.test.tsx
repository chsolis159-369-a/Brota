/**
 * Render de las pantallas de H2 con datos reales (store + SQLite en memoria).
 * Verifica textos del prototipo y acciones principales sin emulador.
 */
import { fireEvent, render, screen } from '@testing-library/react-native';

import DetalleCultivo from '@/app/(tabs)/cultivos/[id]';
import Cultivos from '@/app/(tabs)/cultivos/index';
import Hoy from '@/app/(tabs)/index';
import Onboarding from '@/app/onboarding';
import { inicializarDatos, migrar } from '@/db';
import '@/i18n';
import { useClima } from '@/store/clima';
import { useDatos } from '@/store/datos';

import { abrirBaseDePrueba } from './ayudas/sqlite-node';

// Estas pruebas montan pantallas completas con SQLite real: en una máquina cargada pueden pasar de 5 s.
jest.setTimeout(20000);

const mockRouter = { push: jest.fn(), navigate: jest.fn(), back: jest.fn(), replace: jest.fn(), setParams: jest.fn() };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  useFocusEffect: () => {},
}));
jest.mock('@/servicios/fotos', () => ({ elegirFoto: jest.fn(async () => 'file:///fotos/nueva.jpg'), borrarArchivo: jest.fn() }));

const S = () => useDatos.getState();

beforeEach(async () => {
  mockParams = {};
  jest.clearAllMocks();
  const db = abrirBaseDePrueba();
  await migrar(db);
  await inicializarDatos(db);
  await S().cargar(db);
  useClima.setState({ clima: null, ciudad: 'Buenos Aires' });
});

describe('Onboarding', () => {
  it('recorre los 4 pasos, elige perfil y termina', async () => {
    await render(<Onboarding />);
    expect(screen.getByText('Bienvenido a BROTA')).toBeTruthy();
    for (let i = 0; i < 3; i++) await fireEvent.press(screen.getByText('Siguiente'));
    expect(screen.getByText('¿Qué cultivás?')).toBeTruthy();
    await fireEvent.press(screen.getByText('Interior con LED'));
    await fireEvent.press(screen.getByText('Empezar'));
    expect(S().perfil).toMatchObject({ onboarded: true, perfil: 'interior' });
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });
});

describe('Hoy', () => {
  it('muestra tareas, puntos, cultivos de ejemplo, logros y consejo', async () => {
    await render(<Hoy />);
    expect(screen.getByText('0 de 5')).toBeTruthy();
    expect(screen.getByText('Revisar la humedad de Albahaca 1')).toBeTruthy();
    expect(screen.getByText('Medir luz y temperatura de Albahaca 1')).toBeTruthy();
    expect(screen.getAllByText('+5 · Fácil').length).toBeGreaterThan(0);
    expect(screen.getByText('+10 · Media')).toBeTruthy();
    expect(screen.getByText('Inexperto')).toBeTruthy();
    expect(screen.getByText('Tomates del patio')).toBeTruthy();
    expect(screen.getByText('Primer registro')).toBeTruthy();
    expect(screen.getByText('Pronóstico no disponible sin conexión.')).toBeTruthy();
    expect(screen.getByText('Siguiente módulo para aprobar')).toBeTruthy();
  });

  it('con lluvia mañana suma la tarea difícil de drenaje', async () => {
    useClima.setState({
      clima: {
        hoy: { t: 22, min: 14, max: 27, lluvia: 10, viento: 12, codigo: 2 },
        dias: [{ fecha: '2030-01-02', max: 19, min: 12, lluvia: 70, codigo: 61 }],
        consultado: new Date().toISOString(),
      },
    });
    await render(<Hoy />);
    expect(screen.getByText('Revisar el drenaje de Tomates del patio (mañana hay lluvia)')).toBeTruthy();
    expect(screen.getByText('+15 · Difícil')).toBeTruthy();
    expect(screen.getByText('Hoy en Buenos Aires')).toBeTruthy();
    expect(screen.getByText('Lluvia 10% · viento 12 km/h')).toBeTruthy();
  });

  it('marcar una tarea suma puntos y muestra el tope diario', async () => {
    await render(<Hoy />);
    await fireEvent.press(screen.getByText('Revisar la humedad de Albahaca 1'));
    expect(screen.getByText('1 de 5')).toBeTruthy();
    expect(screen.getByText('Tareas de hoy: 5 de 40 pts posibles por día. Registros, mediciones y estudio suman aparte.')).toBeTruthy();
  });

  it('sin cultivos invita a crear el primero', async () => {
    for (const c of S().cultivos) await S().eliminarCultivo(c.id);
    await render(<Hoy />);
    expect(screen.getByText('Todavía no tenés cultivos. Creá uno para recibir tareas diarias.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Crear mi primer cultivo'));
    expect(mockRouter.navigate).toHaveBeenCalledWith({ pathname: '/cultivos', params: { crear: '1' } });
  });
});

describe('Cultivos', () => {
  it('crea un cultivo con el formulario', async () => {
    await render(<Cultivos />);
    expect(screen.getByText('Mis cultivos')).toBeTruthy();
    await fireEvent.press(screen.getByText('+ Nuevo cultivo'));
    await fireEvent.changeText(screen.getByLabelText('Nombre (ej. Albahaca 1)'), 'Rúcula');
    await fireEvent.press(screen.getByText('exterior'));
    await fireEvent.press(screen.getByText('Guardar cultivo'));
    expect(S().cultivos[0]).toMatchObject({ nombre: 'Rúcula', ubicacion: 'exterior', tipo: 'Sin especificar' });
    expect(screen.getByText('Rúcula')).toBeTruthy();
  });

  it('llega con el formulario abierto desde Hoy', async () => {
    mockParams = { crear: '1' };
    await render(<Cultivos />);
    expect(screen.getByText('Guardar cultivo')).toBeTruthy();
  });

  it('con 3 cultivos propios en Gratis muestra el límite (D-34)', async () => {
    for (const nombre of ['A', 'B', 'C']) {
      await S().crearCultivo({ nombre, tipo: '', ubicacion: 'interior', etapa: 'Siembra', fecha: '2026-11-23' });
    }
    await render(<Cultivos />);
    expect(screen.getByText('Llegaste al límite del plan Gratis')).toBeTruthy();
    expect(screen.getByText('Incluye 3 cultivos propios. Pro es ilimitado.')).toBeTruthy();
    expect(screen.queryByText('+ Nuevo cultivo')).toBeNull();
    await fireEvent.press(screen.getByText('Ver planes'));
    expect(mockRouter.navigate).toHaveBeenCalledWith('/plan');
  });

  it('filtra por ubicación y alertas', async () => {
    await render(<Cultivos />);
    await fireEvent.press(screen.getByText('Exterior'));
    expect(screen.queryByText('Albahaca 1')).toBeNull();
    expect(screen.getByText('Tomates del patio')).toBeTruthy();
    await fireEvent.press(screen.getByText('Con alertas'));
    expect(screen.getByText('Ningún cultivo coincide con este filtro.')).toBeTruthy();
  });
});

describe('Detalle de cultivo', () => {
  it('muestra la última medición del ejemplo con PPFD, altura, VPD y evolución', async () => {
    mockParams = { id: 'ejemplo-1' };
    await render(<DetalleCultivo />);
    expect(screen.getByText('Albahaca 1')).toBeTruthy();
    expect(screen.getByText('Intensidad dentro del rango recomendado (300–600).')).toBeTruthy();
    expect(screen.getByText('Altura razonable. Confirmá la recomendación del fabricante.')).toBeTruthy();
    expect(screen.getByText('VPD 1.19 kPa · zona orientativa 0,8 a 1,2 kPa')).toBeTruthy();
    expect(screen.getByText('PPFD registrado (del más viejo al más nuevo): 280 → 420')).toBeTruthy();
    expect(screen.getByText('Riego ligero; tierra seca a 3 cm')).toBeTruthy();
  });

  it('registra, mide y elimina un cultivo propio', async () => {
    const r = await S().crearCultivo({ nombre: 'Mi lechuga', tipo: 'Lechuga', ubicacion: 'interior', etapa: 'Siembra', fecha: '2026-11-23' });
    if (!r.ok) throw new Error();
    mockParams = { id: r.id };
    await render(<DetalleCultivo />);
    expect(screen.getByText('Hacé tu primer registro para empezar la bitácora')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('registro-Riego'));
    expect(screen.getByText('Registro rápido: riego')).toBeTruthy();
    expect(screen.getByText('Cada registro suma 2 pts (hoy 1 de 5). Cada medición de luz suma 4 pts (hoy 0 de 2).')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('PPFD medido (µmol/m²/s)'), '100');
    await fireEvent.press(screen.getByText('Guardar medición'));
    expect(screen.getByText('Poca luz para siembra (recomendado 150–300). Acercá la lámpara o subí la potencia.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Agregar foto'));
    expect(S().cultivos.find((c) => c.id === r.id)?.fotos).toHaveLength(1);
    await fireEvent.press(screen.getByText('Eliminar este cultivo'));
    await fireEvent.press(screen.getByText('Sí, eliminar y perder su bitácora'));
    expect(mockRouter.back).toHaveBeenCalled();
    expect(S().cultivos.some((c) => c.id === r.id)).toBe(false);
  });

  it('un cultivo de exterior no tiene mediciones de luz', async () => {
    mockParams = { id: 'ejemplo-2' };
    await render(<DetalleCultivo />);
    expect(screen.getByText('En exterior, el clima viene del pronóstico. Lo ves en la pestaña Hoy.')).toBeTruthy();
    expect(screen.queryByText('Guardar medición')).toBeNull();
  });
});
