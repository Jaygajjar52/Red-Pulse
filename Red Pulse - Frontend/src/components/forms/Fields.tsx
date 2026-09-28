import { cn } from '@/utils/cn';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';
import { Search } from 'lucide-react';

interface FieldWrapProps {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function Field({ label, error, hint, children, htmlFor }: FieldWrapProps) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-stone-700 dark:text-stone-200">
          {label}
        </label>
      ) : null}
      {children}
      {hint && !error ? <p className="text-xs text-stone-500">{hint}</p> : null}
      {error ? (
        <p className="text-xs text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(
  function Input({ label, error, className, id, ...props }, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <Field label={label} error={error} htmlFor={inputId}>
        <input ref={ref} id={inputId} className={cn(controlClass, className)} {...props} />
      </Field>
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }
>(function Textarea({ label, error, className, id, ...props }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} error={error} htmlFor={inputId}>
      <textarea ref={ref} id={inputId} className={cn(controlClass, 'min-h-28', className)} {...props} />
    </Field>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; options: { value: string; label: string }[] }
>(function Select({ label, error, className, id, options, ...props }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} error={error} htmlFor={inputId}>
      <select ref={ref} id={inputId} className={cn(controlClass, className)} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
});

export const Checkbox = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(function Checkbox({ label, error, className, id, ...props }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div>
      <label htmlFor={inputId} className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
        <input ref={ref} id={inputId} type="checkbox" className={cn('h-4 w-4 rounded border-stone-300', className)} {...props} />
        {label}
      </label>
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
});

export function Radio({
  label,
  options,
  value,
  onChange,
  name,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-stone-700 dark:text-stone-200">{label}</legend>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-sm"
    >
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition',
          checked ? 'bg-brand-600' : 'bg-stone-300 dark:bg-stone-600',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition',
            checked ? 'left-5.5 translate-x-5' : 'left-0.5',
          )}
        />
      </span>
      {label}
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="relative block w-full max-w-sm">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-stone-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(controlClass, 'pl-9')}
      />
    </label>
  );
}
