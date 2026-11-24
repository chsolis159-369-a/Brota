import { useTranslation } from 'react-i18next';

import { Pantalla } from '@/componentes/Pantalla';

export default function Aprender() {
  const { t } = useTranslation();
  return <Pantalla titulo={t('titulos.aprender')} />;
}
