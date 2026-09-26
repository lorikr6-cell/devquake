import { Button, LOCALES, LOCALE_NAMES } from '@devquake/ui';
import type { AdminReferral } from '@/lib/external-referrals';
import { REFERRAL_TEXT_MAX, TEXT_FIELDS } from '@/lib/external-referral-rules';
import { inputClass, labelClass } from '../../_components/ui';

const FIELD_LABELS: Record<(typeof TEXT_FIELDS)[number], string> = {
  label: 'Caption (small, above the title)',
  title: 'Title',
  body: 'Text',
  button: 'Button',
};

/**
 * An external referral: the partner link and its texts in every language (all required, ADR
 * 0011). Visitors reach the link through /go/<slug>, which the QR code encodes.
 */
export function ReferralForm({
  action,
  referral,
  submitLabel,
}: {
  action: (form: FormData) => Promise<void>;
  referral?: AdminReferral;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Partner name
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={80}
            defaultValue={referral?.name}
            placeholder="Bitget"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="slug" className={labelClass}>
            Short link: devquake.com/go/…
          </label>
          <input
            id="slug"
            name="slug"
            required
            pattern="[a-z0-9][a-z0-9\-]{0,38}"
            defaultValue={referral?.slug}
            placeholder="bitget"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="url" className={labelClass}>
          Referral link (https)
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          maxLength={1000}
          defaultValue={referral?.url}
          placeholder="https://…"
          className={`${inputClass} font-mono`}
        />
      </div>
      <div>
        <label htmlFor="code" className={labelClass}>
          Referral code (optional: shown with a copy button, for apps that ask for it)
        </label>
        <input
          id="code"
          name="code"
          maxLength={40}
          pattern="[A-Za-z0-9_\-]{1,40}"
          defaultValue={referral?.code ?? ''}
          className={`${inputClass} font-mono sm:w-72`}
        />
      </div>
      <div>
        <label htmlFor="logo" className={labelClass}>
          Logo (top right of the box): SVG, PNG, JPEG or WebP, up to 100 KB; square works best
        </label>
        <div className="flex flex-wrap items-center gap-4">
          {referral?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={referral.logoUrl}
              alt=""
              className="size-12 rounded-lg bg-white object-contain p-1 ring-1 ring-ink/10"
            />
          ) : null}
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
            className="text-sm"
          />
          {referral?.logoUrl ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="remove_logo"
                className="size-4 accent-[var(--dq-quake)]"
              />
              Remove the logo
            </label>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="sort_order" className={labelClass}>
            Order
          </label>
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            min={0}
            max={9999}
            defaultValue={referral?.sortOrder ?? 10}
            className={`${inputClass} w-28`}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={referral?.isActive ?? true}
            className="size-4 accent-[var(--dq-quake)]"
          />
          Shown on the landing page
        </label>
      </div>

      {LOCALES.map((locale) => (
        <fieldset
          key={locale}
          className="space-y-3 rounded-md border border-ink/10 p-4 dark:border-paper/10"
        >
          <legend className="px-1 text-sm font-semibold">{LOCALE_NAMES[locale]}</legend>
          {TEXT_FIELDS.map((field) => {
            const id = `${locale}.${field}`;
            const value = referral?.texts[locale]?.[field];
            return (
              <div key={field}>
                <label htmlFor={id} className={labelClass}>
                  {FIELD_LABELS[field]}
                </label>
                {field === 'body' ? (
                  <textarea
                    id={id}
                    name={id}
                    required
                    rows={2}
                    maxLength={REFERRAL_TEXT_MAX[field]}
                    defaultValue={value}
                    className={inputClass}
                  />
                ) : (
                  <input
                    id={id}
                    name={id}
                    required
                    maxLength={REFERRAL_TEXT_MAX[field]}
                    defaultValue={value}
                    className={inputClass}
                  />
                )}
              </div>
            );
          })}
        </fieldset>
      ))}
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
