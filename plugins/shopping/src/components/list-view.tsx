'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, cn } from '@devquake/ui';
import {
  computeTotals,
  formatMoney,
  formatQuantity,
  groupByStore,
  lineTotal,
  type Item,
  type ListSnapshot,
  type Store,
} from '../lib/model';
import { storeType } from '../lib/store-types';
import { callApi, errorMessage } from './call-api';
import { StoreFields, emptyStore, storePayload, type StoreDraft } from './store-fields';
import { ErrorText, Field, Input, Panel, Select } from './ui';

const POLL_MS = 4000;
const NEW_STORE = 'new';

/** The shared list: items grouped by store, live-ish updates by polling the list's version. */
export function ListView({ initial }: { initial: ListSnapshot }) {
  const [list, setList] = useState(initial);
  const [shopping, setShopping] = useState(false);
  const [error, setError] = useState('');
  const version = useRef(initial.version);

  const load = useCallback(
    async (onlyIfChanged: boolean) => {
      const query = onlyIfChanged ? `?v=${version.current}` : '';
      const next = await callApi<ListSnapshot>(`/lists/${initial.id}${query}`);
      if (next) {
        version.current = next.version;
        setList(next);
      }
    },
    [initial.id],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load(true).catch(() => {});
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') load(true).catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  /**
   * Runs a change, then reloads the list; errors are shown above the list. `optimistic` updates
   * the screen immediately (e.g. ticking an item in the shop); a failure reloads the real state.
   */
  const run = useCallback(
    async (change: () => Promise<unknown>, optimistic?: (l: ListSnapshot) => ListSnapshot) => {
      setError('');
      if (optimistic) setList(optimistic);
      try {
        await change();
        await load(false);
        return true;
      } catch (err) {
        setError(errorMessage(err));
        if (optimistic) await load(false).catch(() => {});
        return false;
      }
    },
    [load],
  );

  const groups = groupByStore(list.stores, list.items);
  const totals = computeTotals(list.items);
  const open = computeTotals(list.items.filter((i) => !i.done));
  const doneCount = list.items.filter((i) => i.done).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
            ← All lists
          </Link>
          <h1 className="font-display text-3xl font-bold">{list.name}</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            {list.members.map((m) => m.displayName).join(', ')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={shopping ? 'primary' : 'secondary'}
            onClick={() => setShopping((s) => !s)}
            aria-pressed={shopping}
          >
            {shopping ? 'Done shopping' : 'Go shopping'}
          </Button>
          <Link
            href={`/lists/${list.id}/share`}
            className="inline-flex items-center rounded-md border border-ink/20 px-4 py-2 text-sm font-medium hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10"
          >
            {list.role === 'owner' ? 'Share & settings' : 'Members'}
          </Link>
        </div>
      </div>

      <ErrorText>{error}</ErrorText>

      {!shopping ? <AddItemForm list={list} run={run} /> : null}

      {groups.length === 0 ? (
        <Panel>
          <p className="text-sm text-ink/70 dark:text-paper/70">
            The list is empty. Add the first item above.
          </p>
        </Panel>
      ) : (
        groups.map((g) => (
          <Panel key={g.store?.id ?? 'none'} flush>
            <StoreHeader
              store={g.store}
              subtotal={g.total}
              unpriced={g.unpriced}
              currency={list.currency}
              listId={list.id}
              editable={!shopping}
              run={run}
            />
            <ul className="divide-y divide-ink/10 dark:divide-paper/10">
              {g.items.map((item) => (
                <ItemRow key={item.id} item={item} list={list} shopping={shopping} run={run} />
              ))}
            </ul>
          </Panel>
        ))
      )}

      <Panel className="flex flex-wrap items-center justify-between gap-3">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:flex sm:gap-8">
          <div>
            <dt className="text-ink/60 dark:text-paper/60">Still to buy</dt>
            <dd className="font-display text-xl font-bold">
              {formatMoney(open.total, list.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-ink/60 dark:text-paper/60">Whole list</dt>
            <dd className="font-display text-xl font-bold">
              {formatMoney(totals.total, list.currency)}
            </dd>
          </div>
          {totals.unpriced > 0 ? (
            <div className="col-span-2 self-end text-ink/60 dark:text-paper/60">
              {totals.unpriced} {totals.unpriced === 1 ? 'item has' : 'items have'} no price yet
            </div>
          ) : null}
        </dl>
        {doneCount > 0 ? (
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm(`Remove the ${doneCount} ticked-off item(s) from the list?`)) {
                run(() => callApi(`/lists/${list.id}/clear-done`, 'POST'));
              }
            }}
          >
            Clear {doneCount} done
          </Button>
        ) : null}
      </Panel>
    </div>
  );
}

type Run = (
  change: () => Promise<unknown>,
  optimistic?: (l: ListSnapshot) => ListSnapshot,
) => Promise<boolean>;

function storeLabel(store: Store) {
  return store.location ? `${store.name} (${store.location})` : store.name;
}

// --- store header ------------------------------------------------------------------------

function StoreHeader({
  store,
  subtotal,
  unpriced,
  currency,
  listId,
  editable,
  run,
}: {
  store: Store | null;
  subtotal: number;
  unpriced: number;
  currency: string;
  listId: number;
  editable: boolean;
  run: Run;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<StoreDraft>(emptyStore);

  if (store && editing) {
    return (
      <form
        className="space-y-3 border-b border-ink/10 p-4 dark:border-paper/10"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await run(() =>
            callApi(`/lists/${listId}/stores/${store.id}`, 'PATCH', storePayload(draft)),
          );
          if (ok) setEditing(false);
        }}
      >
        <StoreFields value={draft} onChange={setDraft} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Save store</Button>
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="ml-auto text-red-700 dark:text-red-400"
            onClick={() => {
              if (confirm(`Remove ${store.name}? Its items stay on the list without a store.`)) {
                run(() => callApi(`/lists/${listId}/stores/${store.id}`, 'DELETE'));
              }
            }}
          >
            Remove store
          </Button>
        </div>
      </form>
    );
  }

  const type = store ? storeType(store.type) : null;
  return (
    <header className="flex flex-wrap items-start justify-between gap-2 border-b border-ink/10 px-4 py-3 dark:border-paper/10">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold">{store ? store.name : 'Any store'}</h2>
        {store && type ? (
          <p className="text-xs text-ink/60 dark:text-paper/60">
            <span className="rounded bg-quake/10 px-1.5 py-0.5 font-medium text-quake">
              {type.label}
            </span>
            {store.location ? <> · {store.location}</> : null}
            {store.description ? <> · {store.description}</> : null}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium">
          {formatMoney(subtotal, currency)}
          {unpriced > 0 ? (
            <span className="text-ink/50 dark:text-paper/50"> + {unpriced} unpriced</span>
          ) : null}
        </span>
        {store && editable ? (
          <button
            type="button"
            className="text-ink/60 underline hover:text-quake dark:text-paper/60"
            onClick={() => {
              setDraft({
                name: store.name,
                type: store.type,
                location: store.location ?? '',
                description: store.description ?? '',
                typeTouched: true,
              });
              setEditing(true);
            }}
          >
            Edit
          </button>
        ) : null}
      </div>
    </header>
  );
}

// --- items --------------------------------------------------------------------------------

interface ItemDraft {
  name: string;
  quantity: string;
  unit: string;
  price: string;
  description: string;
  storeId: string;
}

const emptyItem: ItemDraft = {
  name: '',
  quantity: '1',
  unit: '',
  price: '',
  description: '',
  storeId: '',
};

function ItemFields({
  draft,
  setDraft,
  stores,
  currency,
  allowNewStore,
}: {
  draft: ItemDraft;
  setDraft: (d: ItemDraft) => void;
  stores: Store[];
  currency: string;
  allowNewStore: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <Field label="Item" className="sm:col-span-3">
        <Input
          required
          maxLength={120}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Milk"
        />
      </Field>
      <Field label="Quantity">
        <Input
          inputMode="decimal"
          value={draft.quantity}
          onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
        />
      </Field>
      <Field label="Unit">
        <Input
          maxLength={16}
          value={draft.unit}
          onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
          placeholder="kg, pcs"
        />
      </Field>
      <Field label={`Price / unit (${currency})`}>
        <Input
          inputMode="decimal"
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
          placeholder="0.00"
        />
      </Field>
      <Field label="Store" className="sm:col-span-3">
        <Select
          value={draft.storeId}
          onChange={(e) => setDraft({ ...draft, storeId: e.target.value })}
        >
          <option value="">Any store</option>
          {stores.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {storeLabel(s)} · {storeType(s.type).label}
            </option>
          ))}
          {allowNewStore ? <option value={NEW_STORE}>+ New store…</option> : null}
        </Select>
      </Field>
      <Field label="Description" className="sm:col-span-3">
        <Input
          maxLength={255}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="Brand, size, lactose-free…"
        />
      </Field>
    </div>
  );
}

function itemPayload(draft: ItemDraft, storeId: number | null) {
  return {
    name: draft.name,
    quantity: draft.quantity,
    unit: draft.unit,
    price: draft.price,
    description: draft.description,
    storeId,
  };
}

function AddItemForm({ list, run }: { list: ListSnapshot; run: Run }) {
  const [draft, setDraft] = useState<ItemDraft>(emptyItem);
  const [store, setStore] = useState<StoreDraft>(emptyStore);
  const [busy, setBusy] = useState(false);
  const newStore = draft.storeId === NEW_STORE;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    await run(async () => {
      let storeId = draft.storeId ? Number(draft.storeId) : null;
      if (newStore) {
        const res = await callApi<{ id: number }>(
          `/lists/${list.id}/stores`,
          'POST',
          storePayload(store),
        );
        storeId = res!.id;
      }
      await callApi(`/lists/${list.id}/items`, 'POST', itemPayload(draft, storeId));
      // Keep the chosen store for the next item: people usually add several per shop.
      setDraft({ ...emptyItem, storeId: storeId === null ? '' : String(storeId) });
      setStore(emptyStore);
    });
    setBusy(false);
  }

  return (
    <Panel>
      <form onSubmit={submit} className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Add to the cart</h2>
        <ItemFields
          draft={draft}
          setDraft={setDraft}
          stores={list.stores}
          currency={list.currency}
          allowNewStore
        />
        {newStore ? (
          <div className="rounded-lg border border-dashed border-quake/40 p-3">
            <p className="mb-2 text-xs font-medium text-quake">New store</p>
            <StoreFields value={store} onChange={setStore} />
          </div>
        ) : null}
        <Button type="submit" disabled={busy}>
          {busy ? 'Adding…' : 'Add item'}
        </Button>
      </form>
    </Panel>
  );
}

function ItemRow({
  item,
  list,
  shopping,
  run,
}: {
  item: Item;
  list: ListSnapshot;
  shopping: boolean;
  run: Run;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ItemDraft>(emptyItem);
  const line = lineTotal(item);
  const path = `/lists/${list.id}/items/${item.id}`;

  if (editing && !shopping) {
    return (
      <li className="p-4">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const storeId = draft.storeId ? Number(draft.storeId) : null;
            const ok = await run(() => callApi(path, 'PATCH', itemPayload(draft, storeId)));
            if (ok) setEditing(false);
          }}
        >
          <ItemFields
            draft={draft}
            setDraft={setDraft}
            stores={list.stores}
            currency={list.currency}
            allowNewStore={false}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="ml-auto text-red-700 dark:text-red-400"
              onClick={() => run(() => callApi(path, 'DELETE'))}
            >
              Delete item
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={cn('flex items-start gap-3 px-4 py-3', shopping && 'py-4')}>
      <input
        type="checkbox"
        checked={item.done}
        onChange={() =>
          run(
            () => callApi(path, 'PATCH', { done: !item.done }),
            (l) => ({
              ...l,
              items: l.items.map((i) => (i.id === item.id ? { ...i, done: !item.done } : i)),
            }),
          )
        }
        aria-label={item.done ? `Put ${item.name} back on the list` : `Tick off ${item.name}`}
        className={cn('mt-1 accent-quake', shopping ? 'size-6' : 'size-4')}
      />
      <div
        className={cn('min-w-0 flex-1', item.done && 'text-ink/40 line-through dark:text-paper/40')}
      >
        <p className={cn('font-medium', shopping && 'text-lg')}>
          {item.name}{' '}
          <span className="font-normal text-ink/60 dark:text-paper/60">
            × {formatQuantity(item.quantity, item.unit)}
          </span>
        </p>
        {item.description ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">{item.description}</p>
        ) : null}
        <p className="text-xs text-ink/50 no-underline dark:text-paper/50">
          {item.done && item.doneByName
            ? `Picked up by ${item.doneByName}`
            : item.addedByName
              ? `Added by ${item.addedByName}`
              : null}
        </p>
      </div>
      <div className="text-right text-sm">
        {line === null ? (
          <span className="text-ink/40 dark:text-paper/40">no price</span>
        ) : (
          <>
            <span className="font-medium">{formatMoney(line, list.currency)}</span>
            {item.quantity !== 1 ? (
              <span className="block text-xs text-ink/50 dark:text-paper/50">
                {formatMoney(item.price!, list.currency)} each
              </span>
            ) : null}
          </>
        )}
        {!shopping ? (
          <button
            type="button"
            className="mt-1 block w-full text-right text-xs text-ink/60 underline hover:text-quake dark:text-paper/60"
            onClick={() => {
              setDraft({
                name: item.name,
                quantity: String(item.quantity),
                unit: item.unit ?? '',
                price: item.price === null ? '' : String(item.price),
                description: item.description ?? '',
                storeId: item.storeId === null ? '' : String(item.storeId),
              });
              setEditing(true);
            }}
          >
            Edit
          </button>
        ) : null}
      </div>
    </li>
  );
}
