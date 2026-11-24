import { useTranslation } from 'react-i18next';

import { Pantalla } from '@/componentes/Pantalla';

export default function Cultivos() {
  const { t } = useTranslation();
  return <Pantalla titulo={t('titulos.cultivos')} />;
}
