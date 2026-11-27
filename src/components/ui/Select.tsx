import { SelectHTMLAttributes, forwardRef, ReactNode } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className = "", id, children, ...rest },
  ref
) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-neutral-400 mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 ${
          error ? "border-red-700" : ""
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
    </div>
  );
});

export default Select;
