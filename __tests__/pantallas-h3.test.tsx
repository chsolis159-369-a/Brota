/**
 * Render de las pantallas de H3 (Aprender) y de las versiones sin servidor de Agente y Plan (D-25),
 * con datos reales (store + SQLite en memoria).
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';

import Agente from '@/app/(tabs)/agente';
import FichaExamen from '@/app/(tabs)/aprender/examen/[id]';
import Glosario from '@/app/(tabs)/aprender/glosario';
import Aprender from '@/app/(tabs)/aprender/index';
import PantallaModulo from '@/app/(tabs)/aprender/modulo/[id]';
import PantallaPlan from '@/app/(tabs)/plan';
import { inicializarDatos, migrar } from '@/db';
import '@/i18n';
import { useApp } from '@/store/app';
import { useClima } from '@/store/clima';
import { useDatos } from '@/store/datos';

import { abrirBaseDePrueba } from './ayudas/sqlite-node';

// Pantallas completas con SQLite real: en una máquina cargada pueden pasar de 5 s.
jest.setTimeout(20000);

const mockRouter = { push: jest.fn(), navigate: jest.fn(), back: jest.fn(), replace: jest.fn(), setParams: jest.fn() };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  useFocusEffect: () => {},
}));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));
jest.mock('@/servicios/fotos', () => ({ elegirFoto: jest.fn(), borrarArchivo: jest.fn() }));

const S = () => useDatos.getState();
const aprobar = async (id: string) => S().terminarTest(id, { aciertos: 2, puntos: 30, bonus: 0, total: 30, aprobado: true, perfecto: false });

beforeEach(async () => {
  mockParams = {};
  jest.clearAllMocks();
  const db = abrirBaseDePrueba();
  await migrar(db);
  await inicializarDatos(db);
  await S().cargar(db);
  useApp.setState({ plan: 'gratis', ciclo: 'mensual', chat: [] });
  useClima.setState({ clima: null, ciudad: 'Buenos Aires' });
});

describe('Aprender', () => {
  it('muestra el nivel, los niveles, los módulos y sus bloqueos', async () => {
    await render(<Aprender />);
    expect(screen.getByText('Tu nivel')).toBeTruthy();
    expect(screen.getByText('Te faltan 60 puntos para Aprendiz.')).toBeTruthy();
    expect(screen.getByText('Módulos aprobados: 0 de 16 · Exámenes aprobados: 0 de 7')).toBeTruthy();
    expect(screen.getByText('Inexperto · 0')).toBeTruthy();
    expect(screen.getByText('Suelo, compost y acolchado')).toBeTruthy();
    expect(screen.getAllByText('Sin intentar · hasta 75 pts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Se desbloquea al llegar a Aprendiz (60 pts)').length).toBeGreaterThan(0);
    expect(screen.getByText('Disponible en el plan Pro')).toBeTruthy();
  });

  it('abre un módulo disponible y lleva al plan desde uno Pro', async () => {
    await render(<Aprender />);
    await fireEvent.press(screen.getByTestId('modulo-suelo'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/aprender/modulo/[id]', params: { id: 'suelo' } });
    await fireEvent.press(screen.getByTestId('modulo-diagnostico'));
    expect(mockRouter.navigate).toHaveBeenCalledWith('/plan');
  });

  it('filtra por categoría', async () => {
    await render(<Aprender />);
    await fireEvent.press(screen.getByText('Nutrición'));
    expect(screen.getByText('Nutrientes: qué necesita cada planta')).toBeTruthy();
    expect(screen.queryByText('Suelo, compost y acolchado')).toBeNull();
  });

  it('con un módulo aprobado muestra su mejor marca', async () => {
    await aprobar('suelo');
    await render(<Aprender />);
    expect(screen.getByText('✓ Aprobado · Mejor: 30 de 75 pts')).toBeTruthy();
    expect(screen.getByText('Módulos aprobados: 1 de 16 · Exámenes aprobados: 0 de 7')).toBeTruthy();
  });

  it('muestra la lista de exámenes con sus motivos', async () => {
    await render(<Aprender />);
    await fireEvent.press(screen.getByTestId('sec-examenes'));
    expect(screen.getByText('Examen de Suelo, compost y rotación')).toBeTruthy();
    expect(screen.getByText('Examen de Plagas')).toBeTruthy();
    expect(screen.getAllByText(/^Aprobá antes el test de: Suelo, compost y acolchado/)).toHaveLength(1);
    // En Gratis, el final pide el plan Pro antes que los exámenes previos (como el prototipo).
    expect(screen.getByText('Disponible en el plan Pro')).toBeTruthy();
  });

  it('en Pro, el final pide los seis exámenes previos (D-34)', async () => {
    useApp.setState({ plan: 'pro' });
    await render(<Aprender />);
    await fireEvent.press(screen.getByTestId('sec-examenes'));
    expect(screen.getByText('Primero aprobá: Examen de Suelo, compost y rotación, Examen de Siembra y calendario, Examen de Hidroponía y nutrición, Examen de Sustrato inerte, Examen de Luz y ambiente, Examen de Plagas')).toBeTruthy();
  });
});

describe('Módulo', () => {
  it('lecciones, test de 3 preguntas y resultado con la mejor marca', async () => {
    mockParams = { id: 'suelo' };
    await render(<PantallaModulo />);
    expect(screen.getByText('Lección 1 de 3')).toBeTruthy();
    expect(screen.getByText('Textura y materia orgánica')).toBeTruthy();
    await fireEvent.press(screen.getByText('Siguiente lección'));
    await fireEvent.press(screen.getByText('Siguiente lección'));
    expect(screen.getByText('Para aprobar el módulo tenés que acertar 2 de 3. Podés repetir el test: las preguntas cambian.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Hacer el test (3 preguntas)'));
    for (let i = 0; i < 3; i++) {
      expect(screen.getByText(`Pregunta ${i + 1} de 3`)).toBeTruthy();
      await fireEvent.press(screen.getByTestId('opcion-0'));
      expect(screen.queryByText('Correcto.') ?? screen.queryByText('Casi.')).toBeTruthy();
      await fireEvent.press(screen.getByTestId('test-siguiente'));
    }
    expect(screen.getByText('Resultado · Suelo, compost y acolchado')).toBeTruthy();
    expect(screen.getByText('Solo cuenta tu mejor resultado en cada módulo: repetir el test sirve para aprender, no para sumar de más.')).toBeTruthy();
    expect(S().progreso.suelo).toBeDefined();
    expect(S().estudio).toHaveLength(1);
  });

  it('las etiquetas de dificultad del test', async () => {
    mockParams = { id: 'rotacion' };
    await render(<PantallaModulo />);
    await fireEvent.press(screen.getByText('Siguiente lección'));
    await fireEvent.press(screen.getByText('Hacer el test (3 preguntas)'));
    expect(screen.getByText('Básica · 10 pts')).toBeTruthy();
  });

  it('un módulo bloqueado no se abre', async () => {
    mockParams = { id: 'hidro-intro' };
    await render(<PantallaModulo />);
    expect(screen.queryByText('Lección 1 de 3')).toBeNull();
  });
});

describe('Glosario y ficha de examen', () => {
  it('glosario con sus términos', async () => {
    await render(<Glosario />);
    expect(screen.getByText('PPFD')).toBeTruthy();
    expect(screen.getByText('Plazo de carencia')).toBeTruthy();
  });

  it('ficha del examen de Suelo habilitado: reglas y aviso de próxima versión', async () => {
    for (const id of ['suelo', 'rotacion', 'compost']) await aprobar(id);
    mockParams = { id: 'suelo' };
    await render(<FichaExamen />);
    expect(screen.getByText('12 preguntas elegidas al azar entre 21: cada intento es distinto.')).toBeTruthy();
    expect(screen.getByText('Tiempo: 12 minutos. Si se acaba, se corrige lo que respondiste.')).toBeTruthy();
    expect(screen.getByText('No se puede volver atrás. Tenés 3 intentos por día (hoy llevás 0).')).toBeTruthy();
    expect(screen.getByText('La primera vez que aprobás ganás +40 puntos.')).toBeTruthy();
    expect(screen.getByText(/^Los exámenes se habilitan en la próxima versión de prueba/)).toBeTruthy();
  });

  it('ficha del final en Gratis ofrece ver planes', async () => {
    mockParams = { id: 'final' };
    await render(<FichaExamen />);
    expect(screen.getByText('Disponible en el plan Pro')).toBeTruthy();
    await fireEvent.press(screen.getByText('Ver planes'));
    expect(mockRouter.navigate).toHaveBeenCalledWith('/plan');
  });
});

describe('Agente', () => {
  it('saluda y responde las preguntas rápidas con las reglas', async () => {
    await render(<Agente />);
    expect(screen.getByText('Hola, soy tu guía de cultivo. Preguntame lo que quieras o usá las preguntas rápidas.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('pregunta-0'));
    expect(screen.getByText(/^Las hojas amarillas suelen indicar/)).toBeTruthy();
    expect(screen.getByText('Modo de ejemplo sin conexión: las respuestas salen de reglas simples. El guía real se conecta con el backend.')).toBeTruthy();
  });

  it('se niega a hablar de dosis, consumo o venta', async () => {
    await render(<Agente />);
    await fireEvent.changeText(screen.getByLabelText('Escribí tu pregunta'), '¿qué dosis uso?');
    await fireEvent.press(screen.getByText('Enviar'));
    expect(screen.getByText('¿qué dosis uso?')).toBeTruthy();
    expect(screen.getByText('Solo puedo orientarte sobre cultivo. No doy información sobre dosis, consumo ni venta.')).toBeTruthy();
  });

  it('en Pro tiene en cuenta el historial del cultivo', async () => {
    useApp.setState({ plan: 'pro' });
    await render(<Agente />);
    await fireEvent.changeText(screen.getByLabelText('Escribí tu pregunta'), 'riego');
    await fireEvent.press(screen.getByText('Enviar'));
    expect(screen.getByText(/\(Plan Pro: tengo en cuenta tus 2 cultivo\(s\)\.\) En Albahaca 1 \(Crecimiento\), tu último registro fue: "Riego ligero; tierra seca a 3 cm"\.$/)).toBeTruthy();
  });
});

describe('Plan', () => {
  it('muestra los planes del prototipo', async () => {
    await render(<PantallaPlan />);
    expect(screen.getByText('US$ 0')).toBeTruthy();
    expect(screen.getByText('US$ 5.99 / mes · o US$ 49.99 / año (ahorrás cerca de 30 %)')).toBeTruthy();
    expect(screen.getByText('16 módulos con test: huerta, nutrición, hidroponía, sustrato inerte, luz y plagas')).toBeTruthy();
    expect(screen.getByText('Plan actual')).toBeTruthy();
    expect(screen.getByText('El cobro real se conecta después. Por ahora el cambio es solo local.')).toBeTruthy();
    expect(screen.queryByText('Business')).toBeNull();
  });

  it('elegir Pro anual cambia el plan en el teléfono', async () => {
    await render(<PantallaPlan />);
    await fireEvent.press(screen.getByText('Elegir Pro anual · US$ 49.99'));
    expect(S().perfil.plan).toBe('pro');
    expect(useApp.getState()).toMatchObject({ plan: 'pro', ciclo: 'anual' });
    expect(screen.getByText(/Plan: Pro anual/)).toBeTruthy();
  });

  it('copia la opinión con calificación y comentario', async () => {
    await render(<PantallaPlan />);
    await fireEvent.press(screen.getByText('4'));
    await fireEvent.changeText(screen.getByLabelText('¿Qué te gustó? ¿Qué falló o te confundió?'), 'Muy clara');
    await fireEvent.press(screen.getByText('Copiar mi opinión'));
    const copiado = (Clipboard.setStringAsync as jest.Mock).mock.calls[0][0] as string;
    expect(copiado).toMatch(/^BROTA prueba 0\.9 · \d{4}-\d{2}-\d{2}\nPlan: Gratis\nCalificación: 4\/5\nCultivos propios: 0\n/);
    expect(copiado).toMatch(/Errores capturados: ninguno\n\nComentario:\nMuy clara$/);
  });

  it('ya no muestra privacidad ni el borrado: pasaron a Configuración (D-35)', async () => {
    await render(<PantallaPlan />);
    expect(screen.queryByText('Ver cómo tratamos tus datos')).toBeNull();
    expect(screen.queryByTestId('borrar-cuenta')).toBeNull();
  });
});
