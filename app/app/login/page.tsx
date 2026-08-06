import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-[10px] bg-primary text-sm font-semibold text-primary-foreground">
            RT
          </div>
          <h1 className="text-h2 text-foreground">Rental Tracker</h1>
          <p className="text-small text-muted-foreground">
            Sign in to continue.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
