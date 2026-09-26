'use client';

import { useT } from '@devquake/ui';
import { QUESTION_TYPES, type Question, type QuestionType } from '../lib/model';
import { Field, Input, Select } from './ui';

/** A question with the owner's correct answer (the answer is only hashed on the server). */
export interface QuestionDraft {
  prompt: string;
  type: QuestionType;
  /** Choices of single/multi, one per line. */
  optionsText: string;
  answer: AnswerValue;
}

/** An answer as typed: text for date/text/number, an option index, or several indexes. */
export type AnswerValue = string | number | number[] | null;

export const emptyQuestion = (): QuestionDraft => ({
  prompt: '',
  type: 'text',
  optionsText: '',
  answer: '',
});

export function toQuestion(d: QuestionDraft): Question {
  const options =
    d.type === 'single' || d.type === 'multi'
      ? d.optionsText
          .split('\n')
          .map((o) => o.trim())
          .filter(Boolean)
      : null;
  return { prompt: d.prompt.trim(), type: d.type, options };
}

/** One answer input for a question (also used when opening an entry). */
export function AnswerInput({
  question,
  value,
  onChange,
  id,
}: {
  question: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  id: string;
}) {
  switch (question.type) {
    case 'date':
      return (
        <Input
          id={id}
          type="date"
          required
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'number':
      return (
        <Input
          id={id}
          inputMode="decimal"
          required
          autoComplete="off"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'text':
      return (
        <Input
          id={id}
          required
          autoComplete="off"
          spellCheck={false}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'single':
      return (
        <div role="radiogroup" className="space-y-1">
          {(question.options ?? []).map((o, i) => (
            <label key={i} className="flex min-h-9 items-center gap-2 text-sm">
              <input
                type="radio"
                name={id}
                className="accent-quake"
                checked={value === i}
                onChange={() => onChange(i)}
              />
              {o}
            </label>
          ))}
        </div>
      );
    case 'multi': {
      const picked = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-1">
          {(question.options ?? []).map((o, i) => (
            <label key={i} className="flex min-h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-quake"
                checked={picked.includes(i)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...picked, i] : picked.filter((x) => x !== i))
                }
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
  }
}

/** The owner defines a question, its type, its choices and the correct answer. */
export function QuestionEditor({
  n,
  value,
  onChange,
}: {
  n: number;
  value: QuestionDraft;
  onChange: (d: QuestionDraft) => void;
}) {
  const t = useT('questions');
  const question = toQuestion(value);
  const choice = value.type === 'single' || value.type === 'multi';
  return (
    <fieldset className="space-y-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
      <legend className="px-1 text-sm font-semibold">{t('question', { n })}</legend>
      <Field label={t('prompt')} hint={t('promptHint')}>
        <Input
          required
          maxLength={200}
          value={value.prompt}
          placeholder={t('promptPlaceholder')}
          onChange={(e) => onChange({ ...value, prompt: e.target.value })}
        />
      </Field>
      <Field label={t('type')}>
        <Select
          value={value.type}
          onChange={(e) => {
            const type = e.target.value as QuestionType;
            onChange({
              ...value,
              type,
              answer: type === 'multi' ? [] : type === 'single' ? null : '',
            });
          }}
        >
          {QUESTION_TYPES.map((qt) => (
            <option key={qt} value={qt}>
              {t(`types.${qt}`)}
            </option>
          ))}
        </Select>
      </Field>
      {choice ? (
        <Field label={t('options')} hint={t('optionsHint')}>
          <textarea
            className="min-h-24 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm dark:border-paper/15 dark:bg-ink"
            value={value.optionsText}
            onChange={(e) =>
              onChange({
                ...value,
                optionsText: e.target.value,
                answer: value.type === 'multi' ? [] : null,
              })
            }
          />
        </Field>
      ) : null}
      <div>
        <p className="mb-1 text-sm font-medium">{t('correctAnswer')}</p>
        {choice && (question.options?.length ?? 0) < 2 ? (
          <p className="text-xs text-ink/60 dark:text-paper/60">{t('addOptionsFirst')}</p>
        ) : (
          <AnswerInput
            question={question}
            value={value.answer}
            onChange={(answer) => onChange({ ...value, answer })}
            id={`q${n}-answer`}
          />
        )}
      </div>
    </fieldset>
  );
}
