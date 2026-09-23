import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About · __PLUGIN_NAME__' };

export default function About() {
  return <h1 className="text-3xl font-bold">About __PLUGIN_NAME__</h1>;
}
