import { Link } from '@devquake/ui';
import { getT } from '@/i18n/server';

export default async function NotFound() {
  const t = await getT('common.notFound');
  return (
    <main className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-2 font-semibold">{t('title')}</p>
      <p className="mt-1 text-zinc-500">{t('body')}</p>
      <Link href="/" className="mt-4 inline-block text-sm underline underline-offset-2">
        {t('home')}
      </Link>
    </main>
  );
}
