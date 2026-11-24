/** Pantalla del Agente con servidor: respuesta con IA, negativa local, límite y caída a reglas (D-27). */
import { fireEvent, render, screen } from '@testing-library/react-native';

import Agente from '@/app/(tabs)/agente';
import { inicializarDatos, migrar } from '@/db';
import '@/i18n';
import { ErrorAgente } from '@/servicios/agenteIA';
import { useApp } from '@/store/app';
import { useClima } from '@/store/clima';
import { useDatos } from '@/store/datos';

import { abrirBaseDePrueba } from './ayudas/sqlite-node';

jest.setTimeout(20000);

const mockPreguntar = jest.fn();
jest.mock('@/servicios/agenteIA', () => {
  const real = jest.requireActual('@/servicios/agenteIA');
  return { ...real, hayAgenteIA: () => true, preguntarAgenteIA: (...a: unknown[]) => mockPreguntar(...a) };
});
jest.mock('expo-router', () => ({ useRouter: () => ({}), useLocalSearchParams: () => ({}), useFocusEffect: () => {} }));

beforeEach(async () => {
  mockPreguntar.mockReset();
  const db = abrirBaseDePrueba();
  await migrar(db);
  await inicializarDatos(db);
  await useDatos.getState().cargar(db);
  useApp.setState({ plan: 'gratis', chat: [] });
  useClima.setState({ clima: null, ciudad: 'Buenos Aires' });
});

async function preguntar(texto: string) {
  await fireEvent.changeText(screen.getByLabelText('Escribí tu pregunta'), texto);
  await fireEvent.press(screen.getByText('Enviar'));
}

describe('Agente con IA', () => {
  it('responde con la IA y muestra el aviso de IA', async () => {
    mockPreguntar.mockResolvedValue('Regá cuando los primeros centímetros estén secos. Así la raíz respira.');
    await render(<Agente />);
    expect(screen.getByText(/^El guía usa inteligencia artificial y responde solo sobre cultivo/)).toBeTruthy();
    await preguntar('¿Cada cuánto riego la albahaca?');
    expect(screen.getByText('Regá cuando los primeros centímetros estén secos. Así la raíz respira.')).toBeTruthy();
    const pedido = mockPreguntar.mock.calls[0][0];
    expect(pedido).toMatchObject({ pregunta: '¿Cada cuánto riego la albahaca?', cultivos: [] });
    expect(pedido.mes).toBeGreaterThanOrEqual(1);
    // El saludo inicial no se manda como historial.
    expect(pedido.historial).toEqual([]);
  });

  it('en Pro manda el contexto de los cultivos (el servidor lo verifica)', async () => {
    useApp.setState({ plan: 'pro' });
    mockPreguntar.mockResolvedValue('ok');
    await render(<Agente />);
    await preguntar('¿Cómo viene mi albahaca?');
    const pedido = mockPreguntar.mock.calls[0][0];
    expect(pedido.cultivos[0]).toMatchObject({ nombre: 'Albahaca 1', etapa: 'Crecimiento', medicion: { ppfd: 420 } });
    expect(pedido.cultivos[0].registros[0].nota).toBe('Riego ligero; tierra seca a 3 cm');
  });

  it('dosis, consumo o venta se rechazan sin llamar al servidor', async () => {
    await render(<Agente />);
    await preguntar('¿qué dosis uso?');
    expect(mockPreguntar).not.toHaveBeenCalled();
    expect(screen.getByText('Solo puedo orientarte sobre cultivo. No doy información sobre dosis, consumo ni venta.')).toBeTruthy();
  });

  it('avisa cuando se llega al límite diario', async () => {
    mockPreguntar.mockRejectedValue(new ErrorAgente('limite'));
    await render(<Agente />);
    await preguntar('¿Cuándo trasplanto?');
    expect(screen.getByText(/^Llegaste al límite de preguntas al guía por hoy/)).toBeTruthy();
  });

  it('sin conexión responde con las reglas y lo aclara', async () => {
    mockPreguntar.mockRejectedValue(new ErrorAgente('sin_conexion'));
    await render(<Agente />);
    await preguntar('tengo pulgones');
    expect(screen.getByText(/^No pude conectarme con el guía\. Te respondo con reglas simples: Revisá el envés de las hojas/)).toBeTruthy();
  });
});
