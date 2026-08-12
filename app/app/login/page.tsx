import { LoginForm } from "./login-form";
import { MarketingPanel } from "./marketing-panel";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-background lg:p-6">
      <div className="flex w-full flex-col lg:flex-row lg:gap-8">
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-[410px]">
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <img
                src="/brand/logo-mark.svg"
                alt="Upa OS"
                className="h-8 w-auto"
              />
              <span className="text-lg font-bold text-foreground">
                Upa OS
              </span>
            </div>
            <LoginForm />
          </div>
        </div>
        <div className="hidden flex-1 lg:block">
          <MarketingPanel />
        </div>
      </div>
    </div>
  );
}
