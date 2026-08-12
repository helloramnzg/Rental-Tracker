"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Email + password, per docs/architecture/08-authentication.md
// Authentication Method. Google sign-in is also enabled (OAuth).
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setFormError(error.message);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  async function onGoogleSignIn() {
    setFormError(null);
    setIsGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setFormError(error.message);
      setIsGoogleLoading(false);
    }
    // On success, Supabase redirects the browser to Google — no further
    // action here.
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-tight font-bold text-foreground sm:text-[36px]">
          Sign In
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground sm:text-[16px]">
          Enter your email and password to sign in!
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={isGoogleLoading}
        onClick={onGoogleSignIn}
        className="h-[50px] gap-2 rounded-[16px] border-transparent bg-muted text-[14px] font-normal text-foreground hover:bg-muted/70"
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-white">
          <svg viewBox="0 0 18 18" className="size-3.5" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.85.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
            />
            <path
              fill="#FBBC05"
              d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
            />
          </svg>
        </span>
        {isGoogleLoading ? "Redirecting…" : "Sign in with Google"}
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[14px] text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-[14px] font-medium">
            Email*
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            className="h-[50px] rounded-[16px] px-4 text-[14px]"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-caption text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-[14px] font-medium">
            Password*
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Min. 8 characters"
            aria-invalid={!!errors.password}
            className="h-[50px] rounded-[16px] px-4 text-[14px]"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-caption text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="keep-logged-in" defaultChecked />
          <Label
            htmlFor="keep-logged-in"
            className="text-[14px] font-normal text-foreground"
          >
            Keep me logged in
          </Label>
        </div>

        {formError && (
          <p role="alert" className="text-small text-destructive">
            {formError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-[54px] rounded-[16px] text-[15px]"
        >
          {isSubmitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
