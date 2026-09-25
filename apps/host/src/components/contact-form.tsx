'use client';

import { useActionState, useState } from 'react';
import { Button, Link, localizePath, rich, useLocale, useT } from '@devquake/ui';
import { inputClass, labelClass } from '@/components/form-styles';
import { contactAction, type ContactFormState } from '@/lib/contact-actions';
import { PRIVACY_PATH } from '@/lib/legal';

const MY_MESSAGES = '/account/messages';

/**
 * The contact form. Signed-in members (`sender`) write with their account's name and email, so
 * they only enter a subject and the message; they find it and the replies on /account/messages.
 */
export function ContactForm({ sender }: { sender?: { name: string; email: string } }) {
  // A new key starts a fresh form after "Write another message".
  const [round, setRound] = useState(0);
  return <Form key={round} sender={sender} again={() => setRound((r) => r + 1)} />;
}

function Form({ sender, again }: { sender?: { name: string; email: string }; again: () => void }) {
  const t = useT('contact.form');
  const locale = useLocale();
  const [state, action, sending] = useActionState<ContactFormState, FormData>(contactAction, {});
  // Rendered-at time: messages sent within a few seconds are treated as bots.
  const [startedAt] = useState(() => Date.now());
  const v = state.values;

  if (state.ok) {
    return (
      <div
        role="status"
        className="rounded-lg border border-ink/10 border-l-4 border-l-quake bg-white p-6 dark:border-paper/10 dark:border-l-quake dark:bg-paper/5"
      >
        <p className="font-semibold">{t('thanks')}</p>
        {state.member ? (
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
            {rich(t('memberNext'), {
              link: (
                <Link
                  href={MY_MESSAGES}
                  className="font-medium underline decoration-quake/50 underline-offset-2"
                >
                  {t('yourMessages')}
                </Link>
              ),
            })}
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('visitorNext')}</p>
        )}
        <button
          type="button"
          onClick={again}
          className="mt-3 text-sm underline decoration-quake/50 underline-offset-2"
        >
          {t('another')}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="started_at" value={startedAt} />
      {/* Honeypot: hidden from people and screen readers, bots tend to fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {sender ? (
        <p className="rounded-md bg-ink/5 px-3 py-2 text-sm dark:bg-paper/10">
          {rich(t('sendingAs'), {
            name: <strong>{sender.name}</strong>,
            email: <span className="text-ink/60 dark:text-paper/60">{sender.email}</span>,
          })}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className={labelClass}>
              {t('name')}
            </label>
            <input
              id="contact-name"
              name="name"
              required
              maxLength={100}
              autoComplete="name"
              defaultValue={v?.name}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contact-email" className={labelClass}>
              {t('email')}
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              defaultValue={v?.email}
              className={inputClass}
            />
          </div>
        </div>
      )}
      <div>
        <label htmlFor="contact-subject" className={labelClass}>
          {t('subject')}
          {sender ? null : (
            <span className="font-normal text-ink/60 dark:text-paper/60"> {t('optional')}</span>
          )}
        </label>
        <input
          id="contact-subject"
          name="subject"
          required={!!sender}
          maxLength={150}
          defaultValue={v?.subject}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className={labelClass}>
          {t('message')}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          defaultValue={v?.message}
          className={inputClass}
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="submit" disabled={sending}>
          {sending ? t('sending') : t('send')}
        </Button>
        <p className="text-xs text-ink/60 dark:text-paper/60">
          {sender ? t('memberNote') : t('visitorNote')}{' '}
          <a
            href={localizePath(PRIVACY_PATH, locale)}
            className="underline decoration-quake/50 underline-offset-2"
          >
            {t('privacy')}
          </a>
        </p>
      </div>
    </form>
  );
}
