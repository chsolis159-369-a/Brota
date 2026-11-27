/** Pantalla del Agente con servidor: respuesta con IA, negativa local, límite, caída a reglas (D-27) y fotos (D-30). */
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
const mockFoto = jest.fn();
jest.mock('@/servicios/fotoAgente', () => ({ fotoParaAnalizar: (...a: unknown[]) => mockFoto(...a) }));
const FOTO = { uri: 'file:///cache/hoja.jpg', base64: '/9j/4AAQ', tipo: 'image/jpeg' };
/** Respuesta de la IA sin reconocimiento (D-31). */
const ia = (texto: string) => ({ texto, reconocimiento: null });
jest.mock('expo-router', () => ({ useRouter: () => ({}), useLocalSearchParams: () => ({}), useFocusEffect: () => {} }));

beforeEach(async () => {
  mockPreguntar.mockReset();
  mockFoto.mockReset();
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
    mockPreguntar.mockResolvedValue(ia('Regá cuando los primeros centímetros estén secos. Así la raíz respira.'));
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
    mockPreguntar.mockResolvedValue(ia('ok'));
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

  it('saca una foto, la manda con la pregunta escrita y muestra el análisis', async () => {
    mockFoto.mockResolvedValue({ tipo: 'ok', foto: FOTO });
    mockPreguntar.mockResolvedValue(ia('Veo pulgones en el envés. Aislá la planta y revisá cada dos días.'));
    await render(<Agente />);
    expect(screen.getByText('Analizar una foto')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Escribí tu pregunta'), '¿Qué bichos son?');
    await fireEvent.press(screen.getByText('Sacar foto'));
    expect(mockFoto).toHaveBeenCalledWith('camara');
    expect(mockPreguntar.mock.calls[0][0]).toMatchObject({ pregunta: '¿Qué bichos son?', foto: { tipo: 'image/jpeg', datos: '/9j/4AAQ' } });
    expect(screen.getByLabelText('Foto subida por el usuario')).toBeTruthy();
    expect(screen.getByText('Veo pulgones en el envés. Aislá la planta y revisá cada dos días.')).toBeTruthy();
  });

  it('una foto sin pregunta se manda igual (el servidor usa una pregunta por defecto)', async () => {
    mockFoto.mockResolvedValue({ tipo: 'ok', foto: FOTO });
    mockPreguntar.mockResolvedValue(ia('Es una vaquita: es benéfica, no la elimines.'));
    await render(<Agente />);
    await fireEvent.press(screen.getByText('Elegir de la galería'));
    expect(mockFoto).toHaveBeenCalledWith('galeria');
    expect(mockPreguntar.mock.calls[0][0]).toMatchObject({ pregunta: '', foto: { datos: '/9j/4AAQ' } });
  });

  it('sin permiso de cámara lo explica y no llama al servidor', async () => {
    mockFoto.mockResolvedValue({ tipo: 'sin_permiso' });
    await render(<Agente />);
    await fireEvent.press(screen.getByText('Sacar foto'));
    expect(mockPreguntar).not.toHaveBeenCalled();
    expect(screen.getByText(/^Para sacar fotos, BROTA necesita permiso para usar la cámara/)).toBeTruthy();
  });

  it('avisa cuando se llega al límite de fotos del día', async () => {
    mockFoto.mockResolvedValue({ tipo: 'ok', foto: FOTO });
    mockPreguntar.mockRejectedValue(new ErrorAgente('limite_fotos'));
    await render(<Agente />);
    await fireEvent.press(screen.getByText('Sacar foto'));
    expect(screen.getByText('Llegaste al límite de 10 fotos por día. Mañana podés mandar más.')).toBeTruthy();
  });

  it('el historial que va al servidor marca los mensajes que tenían foto', async () => {
    mockFoto.mockResolvedValue({ tipo: 'ok', foto: FOTO });
    mockPreguntar.mockResolvedValueOnce(ia('Es oídio.')).mockResolvedValueOnce(ia('Sí, sacá esas hojas.'));
    await render(<Agente />);
    await fireEvent.press(screen.getByText('Sacar foto'));
    await preguntar('¿Saco las hojas?');
    expect(mockPreguntar.mock.calls[1][0].historial).toEqual([
      { de: 'vos', t: '(Foto)' },
      { de: 'agente', t: 'Es oídio.' },
    ]);
  });

  it('sin conexión responde con las reglas y lo aclara', async () => {
    mockPreguntar.mockRejectedValue(new ErrorAgente('sin_conexion'));
    await render(<Agente />);
    await preguntar('tengo pulgones');
    expect(screen.getByText(/^No pude conectarme con el guía\. Te respondo con reglas simples: Revisá el envés de las hojas/)).toBeTruthy();
  });

  it('reconoce con fotos y preguntas: candidatos, certeza y opciones como botones (D-31)', async () => {
    mockFoto.mockResolvedValue({ tipo: 'ok', foto: FOTO });
    mockPreguntar
      .mockResolvedValueOnce({
        texto: 'Puede ser oídio o mildiu. ¿La mancha blanca está arriba o abajo de la hoja?',
        reconocimiento: {
          candidatos: [
            { nombre: 'Oídio', cientifico: 'Erysiphales', tipo: 'hongo', confianza: 0.62 },
            { nombre: 'Mildiu', cientifico: '', tipo: 'hongo', confianza: 0.3 },
          ],
          certeza: 'media',
          pregunta: { texto: '¿La mancha blanca está arriba o abajo de la hoja?', opciones: ['Arriba', 'Abajo'] },
          pedirFoto: null,
          derivar: false,
        },
      })
      .mockResolvedValueOnce({
        texto: 'Es muy probablemente oídio.',
        reconocimiento: {
          candidatos: [{ nombre: 'Oídio', cientifico: 'Erysiphales', tipo: 'hongo', confianza: 0.88 }],
          certeza: 'alta',
          pregunta: null,
          pedirFoto: null,
          derivar: true,
        },
      });
    await render(<Agente />);
    await fireEvent.press(screen.getByText('Sacar foto'));
    expect(mockPreguntar.mock.calls[0][0].preguntasHechas).toBe(0);
    expect(screen.getByText('Lo que puede ser')).toBeTruthy();
    expect(screen.getByText('Probable')).toBeTruthy();
    expect(screen.getByLabelText('Oídio: 62 % de confianza')).toBeTruthy();
    expect(screen.getByText('No sé')).toBeTruthy();
    expect(screen.getByText('Mandar foto')).toBeTruthy();

    await fireEvent.press(screen.getByText('Arriba'));
    const segundo = mockPreguntar.mock.calls[1][0];
    expect(segundo).toMatchObject({ pregunta: 'Arriba', preguntasHechas: 1 });
    expect(segundo.historial.at(-1)).toEqual({
      de: 'agente',
      t: 'Puede ser oídio o mildiu. ¿La mancha blanca está arriba o abajo de la hoja?\n(Candidatos: Oídio 62 %, Mildiu 30 %. Pregunta: ¿La mancha blanca está arriba o abajo de la hoja? Opciones: Arriba / Abajo.)',
    });
    expect(screen.getByText('Muy probable')).toBeTruthy();
    expect(screen.getByText('Conviene que lo vea un técnico o un ingeniero agrónomo.')).toBeTruthy();
    // Sin pregunta nueva, los botones de opciones desaparecen.
    expect(screen.queryByText('No sé')).toBeNull();
  });
});
