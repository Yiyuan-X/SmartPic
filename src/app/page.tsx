'use client';

import {useTranslations} from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div>
      <h1>{t('headline')}</h1>
      <p>{t('subheading')}</p>
      <button>{t('buttonExplore')}</button>
    </div>
  );
}
