"use client";

export function EntityField({
  children,
  error,
  help,
  label,
  name,
}: {
  children: React.ReactNode;
  error?: string;
  help: string;
  label: string;
  name: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-[#24313b]" htmlFor={name}>
          {label}
        </label>
        <button
          aria-label={`Ayuda para ${label}`}
          className="flex size-7 items-center justify-center rounded-full border border-[#c9c7bd] text-xs font-bold text-[#2f6f65]"
          title={help}
          type="button"
        >
          i
        </button>
      </div>
      {children}
      {error ? <p className="text-sm text-[#9a3412]">{error}</p> : null}
    </div>
  );
}

export const inputClassName =
  "h-11 w-full rounded-md border border-[#c9c7bd] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f65] focus:ring-2 focus:ring-[#2f6f65]/20";

export const textareaClassName =
  "min-h-24 w-full rounded-md border border-[#c9c7bd] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2f6f65] focus:ring-2 focus:ring-[#2f6f65]/20";
