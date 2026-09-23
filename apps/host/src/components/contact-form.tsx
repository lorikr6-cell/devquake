'use client';

import { useActionState, useState } from 'react';
import { Button } from '@devquake/ui';
import { inputClass, labelClass } from '@/components/form-styles';
import { contactAction, type ContactFormState } from '@/lib/contact-actions';
import { PRIVACY_PATH } from '@/lib/legal';

export function ContactForm() {
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
        <p className="font-semibold">Thanks, your message is on its way.</p>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
          We usually reply within a couple of days, to the email address you gave us.
        </p>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Name
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
            Email
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
      <div>
        <label htmlFor="contact-subject" className={labelClass}>
          Subject <span className="font-normal text-ink/60 dark:text-paper/60">(optional)</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          maxLength={150}
          defaultValue={v?.subject}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Message
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
          {sending ? 'Sending…' : 'Send message'}
        </Button>
        <p className="text-xs text-ink/60 dark:text-paper/60">
          We use your details only to reply.{' '}
          <a href={PRIVACY_PATH} className="underline decoration-quake/50 underline-offset-2">
            Privacy policy
          </a>
        </p>
      </div>
    </form>
  );
}
