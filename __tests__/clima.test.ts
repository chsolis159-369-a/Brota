import { descripcionClima, desdeOpenMeteo, lluviaManana } from '@/servicios/clima';

const RESPUESTA = {
  current: { time: '2026-11-23T10:00', temperature_2m: 21.6, weather_code: 2, wind_speed_10m: 12.4 },
  daily: {
    time: ['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27'],
    weather_code: [2, 61, 0, 0, 3],
    temperature_2m_max: [27.2, 19.4, 21, 25.5, 23.1],
    temperature_2m_min: [14.1, 12, 13, 15, 16],
    precipitation_probability_max: [10, 70, null, 0, 30],
  },
};

describe('clima', () => {
  it('convierte la respuesta de Open-Meteo: hoy y los 4 días siguientes, redondeado', () => {
    const c = desdeOpenMeteo(RESPUESTA, new Date('2026-11-23T13:00:00Z'));
    expect(c.hoy).toEqual({ t: 22, min: 14, max: 27, lluvia: 10, viento: 12, codigo: 2 });
    expect(c.dias.map((d) => [d.fecha, d.max, d.lluvia])).toEqual([
      ['2026-11-24', 19, 70],
      ['2026-11-25', 21, 0],
      ['2026-11-26', 26, 0],
      ['2026-11-27', 23, 30],
    ]);
    expect(c.consultado).toBe('2026-11-23T13:00:00.000Z');
  });

  it('la lluvia de mañana es la del primer día siguiente', () => {
    expect(lluviaManana(desdeOpenMeteo(RESPUESTA))).toBe(70);
    expect(lluviaManana(null)).toBeNull();
  });

  it.each([
    [0, 'soleado'],
    [1, 'soleado'],
    [2, 'parcial'],
    [3, 'nublado'],
    [45, 'niebla'],
    [53, 'lluvia'],
    [63, 'lluvia'],
    [81, 'lluvia'],
    [73, 'nieve'],
    [95, 'tormenta'],
  ])('código %i: %s', (codigo, desc) => expect(descripcionClima(codigo)).toBe(desc));
});
