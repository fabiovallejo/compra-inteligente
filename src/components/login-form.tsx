"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import type { LoginActionState } from "@/server/auth/actions";
import { loginAction } from "@/server/auth/actions";

interface LoginFormValues {
  username: string;
  password: string;
}

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );
  const {
    register,
    formState: { errors },
  } = useForm<LoginFormValues>({
    mode: "onBlur",
  });

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate={false}>
      {state.message ? (
        <div
          className="rounded-md border border-[#d9a3a3] bg-[#fff5f5] px-4 py-3 text-sm font-medium text-[#8a1f1f]"
          role="alert"
        >
          {state.message}
        </div>
      ) : null}

      <FieldShell
        error={
          errors.username?.message ?? state.fieldErrors?.username?.at(0) ?? null
        }
        help="Usa el nombre de usuario asignado por el administrador."
        htmlFor="username"
        label="Usuario"
      >
        <input
          {...register("username", {
            required: "Ingresa tu usuario.",
            maxLength: {
              value: 80,
              message: "El usuario no debe superar 80 caracteres.",
            },
          })}
          autoComplete="username"
          className="h-11 w-full rounded-md border border-[#c9c7bd] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f65] focus:ring-2 focus:ring-[#2f6f65]/20"
          id="username"
          name="username"
          placeholder="Ingresa tu usuario"
          required
          type="text"
        />
      </FieldShell>

      <FieldShell
        error={
          errors.password?.message ?? state.fieldErrors?.password?.at(0) ?? null
        }
        help="La contrasena se valida contra un hash seguro almacenado en la base de datos."
        htmlFor="password"
        label="Contrasena"
      >
        <input
          {...register("password", {
            required: "Ingresa tu contrasena.",
            maxLength: {
              value: 200,
              message: "La contrasena no debe superar 200 caracteres.",
            },
          })}
          autoComplete="current-password"
          className="h-11 w-full rounded-md border border-[#c9c7bd] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f65] focus:ring-2 focus:ring-[#2f6f65]/20"
          id="password"
          name="password"
          placeholder="Ingresa tu contrasena"
          required
          type="password"
        />
      </FieldShell>

      <button
        className="mt-2 h-11 rounded-md bg-[#1f5f57] px-4 text-sm font-semibold text-white transition hover:bg-[#184c46] disabled:cursor-not-allowed disabled:bg-[#7a9a95]"
        disabled={pending}
        type="submit"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}

function FieldShell({
  children,
  error,
  help,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  error: string | null;
  help: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-[#24313b]" htmlFor={htmlFor}>
          {label}
        </label>
        <button
          aria-label={`Ayuda para ${label}`}
          className="flex size-7 items-center justify-center rounded-full border border-[#c9c7bd] text-xs font-bold text-[#2f6f65]"
          title={help}
          type="button"
        >
          ?
        </button>
      </div>
      {children}
      {error ? <p className="text-sm text-[#9a3412]">{error}</p> : null}
    </div>
  );
}
