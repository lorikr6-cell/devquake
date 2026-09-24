import Link from 'next/link';
import type { ReactNode } from 'react';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { STORE_TYPES } from '../lib/store-types';

/** Public page (ADR 0009): indexed, with the app's own address as canonical URL. */
export function generateMetadata({ ctx }: PluginPageProps) {
  return {
    title: 'User manual · Shared shopping lists',
    description:
      'How to plan shared shopping lists by date, add stores, products, photos and prices, shop together with friends and read your shopping statistics.',
    alternates: { canonical: `${ctx.baseUrl}/help` },
    openGraph: {
      title: 'Shared shopping lists: user manual',
      url: `${ctx.baseUrl}/help`,
      siteName: 'DevQuake',
      type: 'article',
    },
  };
}

const SECTIONS: Array<{ id: string; title: string }> = [
  { id: 'start', title: '1. Getting started' },
  { id: 'screens', title: '2. The main screen' },
  { id: 'create', title: '3. Plan a list' },
  { id: 'stores', title: '4. Add stores' },
  { id: 'items', title: '5. Add products (with suggestions and photos)' },
  { id: 'shopping', title: '6. Go shopping (and “not needed”)' },
  { id: 'alone', title: '7. Using it on your own' },
  { id: 'friends', title: '8. Shopping with friends' },
  { id: 'calendar', title: '9. Calendar' },
  { id: 'stats', title: '10. Statistics' },
  { id: 'manage', title: '11. Change, leave or delete a list' },
  { id: 'notifications', title: '12. Notifications' },
  { id: 'tips', title: '13. Tips and questions' },
];

function Section({ id, children }: { id: string; children: ReactNode }) {
  const title = SECTIONS.find((s) => s.id === id)!.title;
  return (
    <section id={id} className="scroll-mt-20 space-y-3">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="list-decimal space-y-2 pl-5">{children}</ol>;
}

const Tip = ({ children }: { children: ReactNode }) => (
  <p className="rounded-lg border-l-4 border-quake bg-quake/5 px-4 py-2 text-sm">{children}</p>
);

/** The user manual: how to set up a list and use it alone or with friends, in order. */
export default function Help({ ctx }: PluginPageProps) {
  const categories = [...new Set(STORE_TYPES.map((t) => t.category))];
  return (
    <article className="mx-auto max-w-3xl space-y-10 leading-relaxed">
      {!ctx.user ? (
        <p className="rounded-xl border border-quake/30 bg-quake/5 px-4 py-3 text-sm">
          Want to try it? Shared shopping lists is free for DevQuake members.{' '}
          <a className="font-medium text-quake underline" href={`${ctx.hostUrl}/#account`}>
            Create an account or sign in
          </a>
          , then subscribe to the app.
        </p>
      ) : null}
      <header>
        <p className="text-sm text-ink/60 dark:text-paper/60">Shopping lists · User manual</p>
        <h1 className="font-display text-4xl font-bold">How to use shared shopping lists</h1>
        <p className="mt-3 text-ink/80 dark:text-paper/80">
          Plan what to buy, in which store and on which day, see what it costs, and shop together
          with family and friends. This manual walks you through it step by step.
        </p>
      </header>

      <nav
        aria-label="Contents"
        className="rounded-xl border border-ink/10 bg-white/70 p-4 dark:border-paper/10 dark:bg-paper/5"
      >
        <p className="mb-2 text-sm font-semibold">Contents</p>
        <ol className="grid gap-1 text-sm sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="underline decoration-quake/40 underline-offset-2 hover:decoration-quake"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Section id="start">
        <p>
          Shopping lists is an app of DevQuake and uses your DevQuake account, so there is no
          separate sign-up.
        </p>
        <Steps>
          <li>
            Sign in on{' '}
            <a className="underline" href={ctx.hostUrl}>
              devquake.com
            </a>{' '}
            (or create an account and confirm your email).
          </li>
          <li>
            Open <strong>Your account → Available projects</strong> and <strong>Subscribe</strong>{' '}
            to “Shared shopping lists”.
          </li>
          <li>
            Click <strong>Open Shared shopping lists</strong>. You arrive here already signed in. If
            you open the app address directly while signed out, sign in once and you come right
            back.
          </li>
        </Steps>
      </Section>

      <Section id="screens">
        <p>
          The main screen has four tabs. On a phone or tablet, swipe left and right between them.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Today</strong> (opens first): every list planned for today, with its products,
            prices and totals per store. Tap <strong>Open list</strong> to work on it.
          </li>
          <li>
            <strong>Calendar</strong>: all your lists by date, past and future, as a week, month or
            year.
          </li>
          <li>
            <strong>New list</strong>: plan a new list, or join someone else’s with their invite
            code.
          </li>
          <li>
            <strong>Statistics</strong>: what you bought, where, at which prices, and who shopped
            with you.
          </li>
        </ul>
        <p>
          The toolbar at the top always has <strong>Lists</strong> (back to this screen) and{' '}
          <strong>Manual</strong> (this page).
        </p>
      </Section>

      <Section id="create">
        <Steps>
          <li>
            Go to the <strong>New list</strong> tab.
          </li>
          <li>
            Give the list a <strong>name</strong>, for example “Weekly groceries” or “Barbecue on
            Saturday”.
          </li>
          <li>
            Pick the <strong>shopping date</strong> with the date picker. It is today unless you
            choose another day; plan as many days ahead as you like.
          </li>
          <li>
            Choose the <strong>currency</strong> (RON by default) and press{' '}
            <strong>Create list</strong>. The list opens and you are its owner.
          </li>
        </Steps>
        <Tip>
          One list per trip works best: a list for Saturday’s groceries and another for next week’s
          hardware store run keeps the calendar and the totals clear.
        </Tip>
      </Section>

      <Section id="stores">
        <p>
          Stores tell everyone where to buy each product. A store has a name, a type, a location and
          a description, and belongs to the list.
        </p>
        <Steps>
          <li>
            In the <strong>Add to the cart</strong> form, open the <strong>Store</strong> menu and
            choose <strong>+ New store…</strong>.
          </li>
          <li>
            Type the store’s name. Well-known chains are suggested, and their{' '}
            <strong>type fills in automatically</strong> (Kaufland → Grocery store, Dedeman →
            Hardware and DIY, Altex → Consumer electronics, Catena → Pharmacy). You can always pick
            another type.
          </li>
          <li>
            Add the <strong>location</strong> (address, mall or area) and a{' '}
            <strong>description</strong> if it helps (opening hours, parking, which entrance).
          </li>
        </Steps>
        <p>The store types are grouped like this:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {categories.map((c) => (
            <li key={c}>
              <strong>{c}</strong>:{' '}
              {STORE_TYPES.filter((t) => t.category === c)
                .map((t) => t.label)
                .join(', ')}
            </li>
          ))}
        </ul>
        <p>
          To change or remove a store, press <strong>Edit</strong> next to its name on the list.
          Removing a store keeps its products; they move to “Any store”.
        </p>
      </Section>

      <Section id="items">
        <p>Each product needs a name and a unit; everything else is optional.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Item</strong> (required): the product, e.g. “Milk”.
          </li>
          <li>
            <strong>Unit</strong> (required): how it is sold, e.g. l, kg, pcs, pack, bottle.
          </li>
          <li>
            <strong>Quantity</strong> (optional): how many units. Leave it empty when the product
            itself says it all (“Milk, 1 l”); it then counts once.
          </li>
          <li>
            <strong>Price / unit</strong> (optional): can be filled in now or later by whoever is in
            the shop. The line total is price × quantity.
          </li>
          <li>
            <strong>Store</strong> and <strong>Description</strong> (brand, size, “lactose-free”).
          </li>
        </ul>
        <p>
          After <strong>Add item</strong> the form keeps the chosen store, so you can add several
          products for the same shop quickly. Press <strong>Edit</strong> on a product to change it
          or delete it.
        </p>
        <h3 className="text-lg font-semibold">Suggestions from your usual shopping</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Start typing a product name: products from your earlier lists appear, most frequent
            first, with their unit, last price and store. Accents do not matter (“paine” finds
            “Pâine”). Pick one with a tap, or with the arrow keys and Enter.
          </li>
          <li>
            With <strong>Fill in the whole row from last time</strong> switched on, picking a
            product fills in the unit, quantity, last known price, description, store (added to the
            list if needed) and its photo. Switch it off to fill in only the name and unit. The app
            remembers your choice on this device.
          </li>
          <li>
            <strong>Usual products</strong> above the form lists what you buy most often and is not
            on the list yet: one tap adds it with everything from last time.
          </li>
        </ul>
        <h3 className="text-lg font-semibold">Photos</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Use <strong>Add a photo</strong> in the form, or <strong>Edit → Add a photo</strong> on
            a product. On a phone you can take the picture right away.
          </li>
          <li>
            Photos are shrunk on your device before uploading, so it is quick even on mobile data.
            Only people on the list can see them. Tap a photo to see it large.
          </li>
          <li>A product picked from the suggestions brings its last photo along.</li>
        </ul>
      </Section>

      <Section id="shopping">
        <Steps>
          <li>
            Open the list (from <strong>Today</strong> or the calendar) and press{' '}
            <strong>Go shopping</strong>: bigger tick boxes, no editing clutter.
          </li>
          <li>Tick each product as it goes into the cart. It moves to the bottom of its store.</li>
          <li>
            Missing a price? Leave shopping mode, press <strong>Edit</strong> on the product and
            enter what it costs in the shop.
          </li>
          <li>
            Watch the totals: <strong>Still to buy</strong>, <strong>Whole list</strong>, and the
            total per store. Products without a price are counted separately.
          </li>
          <li>
            Afterwards, <strong>Clear done</strong> removes the ticked products, or keep them for
            your statistics.
          </li>
        </Steps>
        <h3 className="text-lg font-semibold">Not needed any more</h3>
        <p>
          Press <strong>Not needed</strong> on a product to strike it out: it moves to the bottom of
          its store and no longer counts towards <strong>Still to buy</strong> or the list’s total.{' '}
          <strong>Needed again</strong> brings it back.
        </p>
        <p>
          If the product had already been bought, the money is spent anyway: it stays in the totals
          and gets a darker background with a 🙃 (“bought, but not needed after all”). The
          Statistics tab counts these, with the money spent on them, so you can spot what you tend
          to buy for nothing.
        </p>
      </Section>

      <Section id="alone">
        <p>You do not need anyone else: a list with only you on it works the same way.</p>
        <Steps>
          <li>Plan lists for the days you shop.</li>
          <li>Each day, open the app: the Today tab shows exactly what to buy.</li>
          <li>
            Tick products off and enter prices; the Statistics tab builds up your price history.
          </li>
        </Steps>
      </Section>

      <Section id="friends">
        <p>
          Everyone on a list can add products and stores, enter prices and tick things off. Only the
          owner can invite, remove people, change the settings or delete the list.
        </p>
        <h3 className="text-lg font-semibold">Invite someone</h3>
        <Steps>
          <li>
            Open the list and press <strong>Share &amp; settings</strong>.
          </li>
          <li>
            <strong>Your friends on DevQuake</strong>: people you invited to DevQuake (and the
            person who invited you) can be added with one press on <strong>Add to list</strong>.
          </li>
          <li>
            Anyone else: send the <strong>invite link</strong>, read out the{' '}
            <strong>8-character code</strong>, or let them scan the <strong>QR code</strong>. They
            need a DevQuake account and a subscription to this app.
          </li>
          <li>
            <strong>New link</strong> makes a fresh link and code; the old ones stop working.
          </li>
        </Steps>
        <h3 className="text-lg font-semibold">Join someone’s list</h3>
        <Steps>
          <li>
            Open their link or scan their QR code, or type the code in{' '}
            <strong>New list → Join a list</strong>.
          </li>
          <li>
            Check the list name and owner, then press <strong>Join this list</strong>.
          </li>
        </Steps>
        <h3 className="text-lg font-semibold">Shopping together</h3>
        <p>
          Changes show up for everyone within a few seconds, without reloading: on an open list, and
          on the Today, Calendar and Statistics tabs. Split up by store: each person ticks off what
          they picked up, and the list shows who added and who picked up each product.
        </p>
      </Section>

      <Section id="calendar">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Week</strong>: the seven days with each list, what is still to buy and its
            total.
          </li>
          <li>
            <strong>Month</strong>: a month grid; each day shows its lists. Finished lists are
            crossed out.
          </li>
          <li>
            <strong>Year</strong>: twelve small months with the shopping days marked; press a month
            to open it.
          </li>
        </ul>
        <p>
          Use ‹ and › to move, and <strong>Today</strong> to jump back. Press a list to open it. A
          list only appears in the calendar of people who are on it.
        </p>
      </Section>

      <Section id="stats">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Totals</strong>: lists, products, and what was bought compared with what was
            planned, per currency.
          </li>
          <li>
            <strong>Friends on your lists</strong>: for each person, on how many of your lists they
            were, a row of dots for your most recent lists (filled when they were on it), how many
            products they added and picked up, and when they last joined.
          </li>
          <li>
            <strong>Stores</strong>: where you shop most and how much you spent there.
          </li>
          <li>
            <strong>Spending per month</strong> by shopping date.
          </li>
          <li>
            <strong>Most bought products</strong> with average, lowest, highest and last price per
            unit, handy to spot a good deal.
          </li>
        </ul>
      </Section>

      <Section id="manage">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Change the name, date or currency</strong>: Share &amp; settings → Settings
            (owner).
          </li>
          <li>
            <strong>Remove someone</strong>: Share &amp; settings → Members → Remove (owner).
          </li>
          <li>
            <strong>Leave a list</strong>: Members → Leave list (members).
          </li>
          <li>
            <strong>Delete a list</strong>: Settings → Delete list. This removes it for everyone.
          </li>
        </ul>
      </Section>

      <Section id="notifications">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            The <strong>bell</strong> in the toolbar shows what your friends did on lists you are on
            (“Ana picked up Milk”, “Bob struck out Chips”). A number shows how many are new; tap an
            entry to open that list.
          </li>
          <li>While the app is open, new changes also pop up briefly in the corner.</li>
          <li>
            In the bell, tick <strong>Notify me even when this tab is in the background</strong> and
            allow notifications: your device then shows them while the app is open in another tab or
            in the background.
          </li>
          <li>
            When the app is closed, nothing is sent. Open it and the bell shows what you missed (up
            to 30 days).
          </li>
        </ul>
      </Section>

      <Section id="tips">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Prices differ per store?</strong> Put the product on the list once per store;
            the statistics then compare the prices.
          </li>
          <li>
            <strong>Nothing on Today?</strong> The tab shows the next planned list; plan one for
            today in <strong>New list</strong>.
          </li>
          <li>
            <strong>A friend cannot open the list?</strong> They must be subscribed to Shared
            shopping lists on DevQuake; the Share page tells you when that is the case.
          </li>
          <li>
            <strong>Deleting your DevQuake account</strong> passes your lists to the member who
            joined first (or deletes them when you were alone) and removes your name from products.
          </li>
        </ul>
        <p>
          Questions or ideas? Write to{' '}
          <a className="underline" href="mailto:contact@devquake.com">
            contact@devquake.com
          </a>
          .
        </p>
        <p>
          <Link href="/" className="font-medium text-quake underline">
            ← Back to your lists
          </Link>
        </p>
      </Section>
    </article>
  );
}
