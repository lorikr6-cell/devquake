import type { Metadata } from 'next';
import { Card } from '@devquake/ui';
import type { PluginPageProps } from '@devquake/plugin-sdk';

export const metadata: Metadata = { title: '__PLUGIN_NAME__' };

export default function Home({ ctx }: PluginPageProps) {
  return (
    <>
      <h1 className="text-3xl font-bold">__PLUGIN_NAME__</h1>
      <Card className="mt-6">
        <p>
          Running at <code>{ctx.baseUrl}</code>
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Edit <code>plugins/__PLUGIN_ID__/src/pages/home.tsx</code> to get started.
        </p>
      </Card>
    </>
  );
}
