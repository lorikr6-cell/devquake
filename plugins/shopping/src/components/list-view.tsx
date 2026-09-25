'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Button, cn, trackEvent } from '@devquake/ui';
import {
  computeTotals,
  formatMoney,
  formatQuantity,
  groupByStore,
  isOpen,
  lineTotal,
  type Item,
  type ListSnapshot,
  type Store,
} from '../lib/model';
import { formatDay } from '../lib/dates';
import { storeType } from '../lib/store-types';
import { fold, usualProducts, type Suggestion } from '../lib/suggestions';
import { callApi, errorMessage } from './call-api';
import { removePhoto, uploadPhoto } from './photo-upload';
import { ProductCombobox } from './product-combobox';
import { StoreFields, emptyStore, storePayload, type StoreDraft } from './store-fields';
import { ErrorText, Field, Input, Panel, Select } from './ui';

const POLL_MS = 4000;
const COMMON_UNITS = ['pcs', 'kg', 'g', 'l', 'ml', 'pack', 'bottle', 'can', 'box', 'bag', 'm'];
const NEW_STORE = 'new';

/** The shared list: items grouped by store, live-ish updates by polling the list's version. */
export function ListView({ initial }: { initial: ListSnapshot }) {
  const [list, setList] = useState(initial);
  const [shopping, setShopping] = useState(false);
  const [error, setError] = useState('');
  // The owner deleted the list (or removed this user) while it was open.
  const [gone, setGone] = useState(false);
  const version = useRef(initial.version);

  const load = useCallback(
    async (onlyIfChanged: boolean) => {
      const query = onlyIfChanged ? `?v=${version.current}` : '';
      const next = await callApi<ListSnapshot>(`/lists/${initial.id}${query}`).catch((err) => {
        if ((err as { status?: number }).status === 404) {
          setGone(true);
          return null;
        }
        throw err;
      });
      if (next) {
        version.current = next.version;
        setList(next);
      }
    },
    [initial.id],
  );

  useEffect(() => {
    if (gone) return;
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
  }, [load, gone]);

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

  // The user's products from earlier lists, for the autocomplete and "Usual products".
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const loadSuggestions = useCallback(() => {
    callApi<{ suggestions: Suggestion[] }>('/suggestions')
      .then((res) => {
        if (res) setSuggestions(res.suggestions);
      })
      .catch(() => {});
  }, []);
  useEffect(() => loadSuggestions(), [loadSuggestions]);

  if (gone) {
    return (
      <Panel className="space-y-3 p-6 text-center">
        <h1 className="font-display text-2xl font-bold">“{list.name}” is no longer available</h1>
        <p className="text-sm text-ink/70 dark:text-paper/70">
          The owner deleted this list, or you are no longer on it. What was bought on it still
          counts in your Statistics.
        </p>
        <Link href="/" className="inline-block text-sm font-medium underline hover:text-quake">
          ← Back to your lists
        </Link>
      </Panel>
    );
  }

  const groups = groupByStore(list.stores, list.items);
  const totals = computeTotals(list.items);
  const open = computeTotals(list.items.filter(isOpen));
  const doneCount = list.items.filter((i) => i.done || i.dropped).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
            ← All lists
          </Link>
          <h1 className="font-display text-3xl font-bold">{list.name}</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            <span className="font-medium text-ink dark:text-paper">{formatDay(list.shopDate)}</span>
            {' · '}
            {list.members.map((m) => m.displayName).join(', ')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={shopping ? 'primary' : 'secondary'}
            onClick={() => {
              if (!shopping) trackEvent('shopping_mode_started');
              setShopping((s) => !s);
            }}
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

      {!shopping ? (
        <>
          <UsualProducts
            list={list}
            run={run}
            suggestions={suggestions}
            onAdded={loadSuggestions}
          />
          <AddItemForm list={list} run={run} suggestions={suggestions} onAdded={loadSuggestions} />
        </>
      ) : null}

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
              if (
                confirm(
                  `Remove the ${doneCount} bought or not needed item(s) from the list? They also leave the statistics.`,
                )
              ) {
                run(() => callApi(`/lists/${list.id}/clear-done`, 'POST'));
              }
            }}
          >
            Clear {doneCount} finished
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
  quantity: '',
  unit: '',
  price: '',
  description: '',
  storeId: '',
};

/** Photo of a new item: a file the user picked, or the photo of an earlier item (suggestion). */
interface PhotoDraft {
  file: File | null;
  fromItemId: number | null;
  preview: string | null;
}

const noPhoto: PhotoDraft = { file: null, fromItemId: null, preview: null };

const AUTOFILL_KEY = 'dq.shopping.autofill';

function ItemFields({
  draft,
  setDraft,
  stores,
  currency,
  allowNewStore,
  nameInput,
}: {
  draft: ItemDraft;
  setDraft: (d: ItemDraft) => void;
  stores: Store[];
  currency: string;
  allowNewStore: boolean;
  /** Replaces the plain name input (the add form uses the autocomplete). */
  nameInput?: ReactNode;
}) {
  const unitsId = useId();
  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <Field label="Item" className="sm:col-span-3">
        {nameInput ?? (
          <Input
            required
            maxLength={120}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Milk"
          />
        )}
      </Field>
      <Field label="Quantity (optional)">
        <Input
          inputMode="decimal"
          value={draft.quantity}
          onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
          placeholder="2"
        />
      </Field>
      <Field label="Unit">
        <Input
          required
          maxLength={16}
          list={unitsId}
          value={draft.unit}
          onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
          placeholder="kg, pcs"
        />
        <datalist id={unitsId}>
          {COMMON_UNITS.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
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

/** A store of this list with the same name and location as the suggestion's, if any. */
function matchingStore(stores: Store[], store: Suggestion['store']): Store | undefined {
  if (!store) return undefined;
  return stores.find(
    (s) =>
      fold(s.name) === fold(store.name) && fold(s.location ?? '') === fold(store.location ?? ''),
  );
}

const numberText = (n: number | null) => (n === null ? '' : String(n));

/** Photo picker with a preview; the browser shrinks the photo before it is uploaded. */
function PhotoField({ photo, onChange }: { photo: PhotoDraft; onChange: (p: PhotoDraft) => void }) {
  const inputId = useId();
  useEffect(() => {
    // Free the preview of a picked file when it is replaced or removed.
    const url = photo.file ? photo.preview : null;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [photo]);
  return (
    <div className="flex items-center gap-3 text-sm">
      {photo.preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- local preview / API image
        <img
          src={photo.preview}
          alt="Photo of the product"
          className="size-14 rounded-md object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-14 items-center justify-center rounded-md border border-dashed border-ink/25 text-ink/40 dark:border-paper/25 dark:text-paper/40"
        >
          📷
        </span>
      )}
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="cursor-pointer font-medium underline decoration-quake/50 underline-offset-2 hover:decoration-quake"
        >
          {photo.preview ? 'Change photo' : 'Add a photo (optional)'}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onChange({ file, fromItemId: null, preview: URL.createObjectURL(file) });
          }}
        />
        {photo.preview ? (
          <button
            type="button"
            className="block text-xs text-ink/60 underline dark:text-paper/60"
            onClick={() => onChange(noPhoto)}
          >
            Remove photo
          </button>
        ) : (
          <p className="text-xs text-ink/60 dark:text-paper/60">
            Take one with your phone or pick a file.
          </p>
        )}
      </div>
    </div>
  );
}

function AddItemForm({
  list,
  run,
  suggestions,
  onAdded,
}: {
  list: ListSnapshot;
  run: Run;
  suggestions: Suggestion[];
  onAdded: () => void;
}) {
  const [draft, setDraft] = useState<ItemDraft>(emptyItem);
  const [store, setStore] = useState<StoreDraft>(emptyStore);
  const [photo, setPhoto] = useState<PhotoDraft>(noPhoto);
  const [autofill, setAutofill] = useState(true);
  /** The current row came from a suggestion (for analytics only). */
  const [fromSuggestion, setFromSuggestion] = useState(false);
  const [busy, setBusy] = useState(false);
  const newStore = draft.storeId === NEW_STORE;

  useEffect(() => {
    try {
      if (localStorage.getItem(AUTOFILL_KEY) === 'off') setAutofill(false);
    } catch {
      // storage unavailable: keep the default
    }
  }, []);

  function toggleAutofill(on: boolean) {
    setAutofill(on);
    try {
      localStorage.setItem(AUTOFILL_KEY, on ? 'on' : 'off');
    } catch {
      // not remembered, that is fine
    }
  }

  /** A suggestion was picked: always name and unit, the rest of the row when autofill is on. */
  function applySuggestion(s: Suggestion) {
    setFromSuggestion(true);
    if (!autofill) {
      setDraft({ ...draft, name: s.name, unit: s.unit ?? draft.unit });
      return;
    }
    const existing = matchingStore(list.stores, s.store);
    let storeId = draft.storeId;
    if (existing) storeId = String(existing.id);
    else if (s.store) {
      storeId = NEW_STORE;
      setStore({
        name: s.store.name,
        type: s.store.type,
        location: s.store.location ?? '',
        description: s.store.description ?? '',
        typeTouched: true,
      });
    }
    setDraft({
      name: s.name,
      unit: s.unit ?? '',
      quantity: numberText(s.quantity),
      price: numberText(s.price),
      description: s.description ?? '',
      storeId,
    });
    setPhoto(s.photoItemId ? { file: null, fromItemId: s.photoItemId, preview: s.photo } : noPhoto);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    await run(async () => {
      let storeId = draft.storeId && !newStore ? Number(draft.storeId) : null;
      if (newStore) {
        const res = await callApi<{ id: number }>(
          `/lists/${list.id}/stores`,
          'POST',
          storePayload(store),
        );
        storeId = res!.id;
      }
      const created = await callApi<{ id: number }>(`/lists/${list.id}/items`, 'POST', {
        ...itemPayload(draft, storeId),
        photoFrom: photo.file ? null : photo.fromItemId,
      });
      if (photo.file) await uploadPhoto(list.id, created!.id, photo.file);
      trackEvent('item_added', {
        source: fromSuggestion ? 'suggestion' : 'typed',
        autofill: fromSuggestion && autofill,
        with_photo: !!(photo.file || photo.fromItemId),
        new_store: newStore,
      });
      setFromSuggestion(false);
      // Keep the chosen store for the next item: people usually add several per shop.
      setDraft({ ...emptyItem, storeId: storeId === null ? '' : String(storeId) });
      setStore(emptyStore);
      setPhoto(noPhoto);
      onAdded();
    });
    setBusy(false);
  }

  return (
    <Panel>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Add to the cart</h2>
          <label className="flex items-center gap-2 text-xs text-ink/70 dark:text-paper/70">
            <input
              type="checkbox"
              className="accent-quake"
              checked={autofill}
              onChange={(e) => toggleAutofill(e.target.checked)}
            />
            Fill in the whole row from last time
          </label>
        </div>
        <ItemFields
          draft={draft}
          setDraft={setDraft}
          stores={list.stores}
          currency={list.currency}
          allowNewStore
          nameInput={
            <ProductCombobox
              value={draft.name}
              onChange={(name) => setDraft({ ...draft, name })}
              onPick={applySuggestion}
              suggestions={suggestions}
              currency={list.currency}
            />
          }
        />
        {newStore ? (
          <div className="rounded-lg border border-dashed border-quake/40 p-3">
            <p className="mb-2 text-xs font-medium text-quake">New store</p>
            <StoreFields value={store} onChange={setStore} />
          </div>
        ) : null}
        <PhotoField photo={photo} onChange={setPhoto} />
        <Button type="submit" disabled={busy}>
          {busy ? 'Adding…' : 'Add item'}
        </Button>
      </form>
    </Panel>
  );
}

/** One-tap buttons for products the user buys often and that are not on this list yet. */
function UsualProducts({
  list,
  run,
  suggestions,
  onAdded,
}: {
  list: ListSnapshot;
  run: Run;
  suggestions: Suggestion[];
  onAdded: () => void;
}) {
  const usual = usualProducts(suggestions, list.items);
  if (usual.length === 0) return null;

  const add = (s: Suggestion) =>
    run(async () => {
      let storeId = matchingStore(list.stores, s.store)?.id ?? null;
      if (storeId === null && s.store) {
        // The server returns the existing store when one with this name and location exists.
        const res = await callApi<{ id: number }>(`/lists/${list.id}/stores`, 'POST', s.store);
        storeId = res!.id;
      }
      await callApi(`/lists/${list.id}/items`, 'POST', {
        name: s.name,
        unit: s.unit ?? 'pcs',
        quantity: numberText(s.quantity),
        price: numberText(s.price),
        description: s.description ?? '',
        storeId,
        photoFrom: s.photoItemId,
      });
      trackEvent('item_added', { source: 'usual', with_photo: !!s.photoItemId });
      onAdded();
    });

  return (
    <Panel>
      <h2 className="font-display text-lg font-semibold">Usual products</h2>
      <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">
        Tap to add with the unit, quantity, price and store from last time.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {usual.map((s) => (
          <button
            key={`${s.name}|${s.unit}`}
            type="button"
            onClick={() => add(s)}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm hover:border-quake dark:border-paper/15 dark:bg-paper/5"
          >
            {s.photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- authenticated API image
              <img src={s.photo} alt="" className="size-5 rounded-full object-cover" />
            ) : (
              <span aria-hidden className="text-quake">
                +
              </span>
            )}
            <span className="font-medium">{s.name}</span>
            <span className="text-xs text-ink/60 dark:text-paper/60">
              {formatQuantity(s.quantity, s.unit)}
              {s.price === null ? '' : ` · ${formatMoney(s.price, list.currency)}`}
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

/** Small photo that opens full size in a dialog. */
function PhotoThumb({ src, name, large }: { src: string; name: string; large: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={`Show the photo of ${name}`}
        className={cn('shrink-0 overflow-hidden rounded-md', large ? 'size-14' : 'size-10')}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated API image */}
        <img src={src} alt="" loading="lazy" className="size-full object-cover" />
      </button>
      <dialog
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto max-h-[90vh] max-w-[92vw] rounded-xl bg-white p-2 backdrop:bg-ink/70 dark:bg-ink"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated API image */}
        <img src={src} alt={`Photo of ${name}`} className="max-h-[80vh] max-w-full rounded-lg" />
        <div className="flex items-center justify-between gap-3 px-1 pt-2 text-sm">
          <span className="font-medium">{name}</span>
          <button type="button" className="underline" onClick={() => dialog.current?.close()}>
            Close
          </button>
        </div>
      </dialog>
    </>
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
  const photoInput = useId();
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
          <div className="flex items-center gap-3 text-sm">
            {item.photo ? <PhotoThumb src={item.photo} name={item.name} large /> : null}
            <label
              htmlFor={photoInput}
              className="cursor-pointer font-medium underline decoration-quake/50 underline-offset-2 hover:decoration-quake"
            >
              {item.photo ? 'Change photo' : 'Add a photo'}
            </label>
            <input
              id={photoInput}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) {
                  run(async () => {
                    await uploadPhoto(list.id, item.id, file);
                    trackEvent('photo_added');
                  });
                }
              }}
            />
            {item.photo ? (
              <button
                type="button"
                className="text-ink/60 underline dark:text-paper/60"
                onClick={() => run(() => removePhoto(list.id, item.id))}
              >
                Remove photo
              </button>
            ) : null}
          </div>
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

  const wasted = item.done && item.dropped;
  const toggleDropped = () =>
    run(
      async () => {
        await callApi(path, 'PATCH', { dropped: !item.dropped });
        if (!item.dropped) trackEvent('item_not_needed', { already_bought: item.done });
      },
      (l) => ({
        ...l,
        items: l.items.map((i) => (i.id === item.id ? { ...i, dropped: !item.dropped } : i)),
      }),
    );

  return (
    <li
      className={cn(
        'flex items-start gap-3 px-4 py-3',
        shopping && 'py-4',
        // Bought and then not needed: the money is spent, so the row stays visible but darker.
        wasted && 'bg-ink/10 dark:bg-black/40',
      )}
    >
      <input
        type="checkbox"
        checked={item.done}
        onChange={() =>
          run(
            async () => {
              await callApi(path, 'PATCH', { done: !item.done });
              if (!item.done) trackEvent('item_bought');
            },
            (l) => ({
              ...l,
              items: l.items.map((i) => (i.id === item.id ? { ...i, done: !item.done } : i)),
            }),
          )
        }
        aria-label={item.done ? `Put ${item.name} back on the list` : `Tick off ${item.name}`}
        className={cn('mt-1 accent-quake', shopping ? 'size-6' : 'size-4')}
      />
      {item.photo ? <PhotoThumb src={item.photo} name={item.name} large={shopping} /> : null}
      <div
        className={cn(
          'min-w-0 flex-1',
          item.done && !item.dropped && 'text-ink/45 dark:text-paper/45',
          item.dropped && 'text-ink/50 dark:text-paper/50',
        )}
      >
        <p
          className={cn(
            'font-medium',
            shopping && 'text-lg',
            item.dropped && 'line-through decoration-2',
          )}
        >
          {item.name}{' '}
          <span className="font-normal text-ink/60 dark:text-paper/60">
            {item.quantity === null ? '' : '× '}
            {formatQuantity(item.quantity, item.unit)}
          </span>
        </p>
        {item.description ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">{item.description}</p>
        ) : null}
        {wasted ? (
          <p className="mt-0.5 inline-flex items-center gap-1 rounded bg-ink/10 px-1.5 py-0.5 text-xs font-medium text-ink/80 dark:bg-paper/10 dark:text-paper/80">
            <span aria-hidden title="Bought, but not needed after all">
              🙃
            </span>
            Bought, but not needed after all
          </p>
        ) : null}
        <p className="text-xs text-ink/50 dark:text-paper/50">
          {item.dropped && item.droppedByName
            ? `Not needed · struck out by ${item.droppedByName}`
            : item.done && item.doneByName
              ? `Picked up by ${item.doneByName}`
              : item.addedByName
                ? `Added by ${item.addedByName}`
                : null}
        </p>
      </div>
      <div
        className={cn(
          'text-right text-sm',
          item.dropped && !item.done && 'text-ink/40 line-through dark:text-paper/40',
        )}
      >
        {line === null ? (
          <span className="text-ink/40 dark:text-paper/40">no price</span>
        ) : (
          <>
            <span className="font-medium">{formatMoney(line, list.currency)}</span>
            {item.quantity !== null && item.quantity !== 1 ? (
              <span className="block text-xs text-ink/50 dark:text-paper/50">
                {formatMoney(item.price!, list.currency)} each
              </span>
            ) : null}
          </>
        )}
        <button
          type="button"
          onClick={toggleDropped}
          aria-pressed={item.dropped}
          aria-label={item.dropped ? `${item.name} is needed again` : `${item.name} is not needed`}
          className="mt-1 block w-full text-right text-xs text-ink/60 underline hover:text-quake dark:text-paper/60"
        >
          {item.dropped ? 'Needed again' : 'Not needed'}
        </button>
        {!shopping ? (
          <button
            type="button"
            className="mt-1 block w-full text-right text-xs text-ink/60 underline hover:text-quake dark:text-paper/60"
            onClick={() => {
              setDraft({
                name: item.name,
                quantity: item.quantity === null ? '' : String(item.quantity),
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
