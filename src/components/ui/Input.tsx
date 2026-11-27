import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

const FIELD_CLASS =
  "w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className = "", id, ...rest },
  ref
) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-neutral-400 mb-1.5">
          {label}
        </label>
      )}
      <input ref={ref} id={id} className={`${FIELD_CLASS} ${error ? "border-red-700" : ""} ${className}`} {...rest} />
      {hint && !error && <p className="text-neutral-600 text-[11px] mt-1">{hint}</p>}
      {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className = "", id, ...rest },
  ref
) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-neutral-400 mb-1.5">
          {label}
        </label>
      )}
      <textarea ref={ref} id={id} className={`${FIELD_CLASS} min-h-[70px] ${className}`} {...rest} />
      {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
    </div>
  );
});

export default Input;
