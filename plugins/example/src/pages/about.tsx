import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About · Example' };

export default function About() {
  return <h1 className="text-3xl font-bold">About Example</h1>;
}
