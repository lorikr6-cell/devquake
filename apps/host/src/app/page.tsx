import { Card } from '@devquake/ui';
import { pluginUrl } from '@/lib/domain';
import { pluginSubdomains } from '@/plugins/registry.manifest.generated';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">DevQuake</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Host platform. Each plugin below runs on its own subdomain.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {pluginSubdomains.map((id) => (
          <a key={id} href={pluginUrl(id)}>
            <Card className="transition-colors hover:border-zinc-400">
              <h2 className="font-semibold">{id}</h2>
              <p className="mt-1 text-sm text-zinc-500">{pluginUrl(id)}</p>
            </Card>
          </a>
        ))}
      </section>
    </main>
  );
}
