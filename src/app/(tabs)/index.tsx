import { useTranslation } from 'react-i18next';

import { Pantalla } from '@/componentes/Pantalla';

export default function Hoy() {
  const { t } = useTranslation();
  return <Pantalla titulo={t('titulos.hoy')} />;
}
