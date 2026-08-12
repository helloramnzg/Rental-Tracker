import Image from "next/image";

export function MarketingPanel() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-14 overflow-hidden rounded-[30px] bg-chart-1 px-10 py-10 xl:px-16 xl:py-12">
      <div className="flex items-center justify-center gap-3">
        <img
          src="/brand/logo-mark.svg"
          alt="Upa OS"
          className="h-10 w-auto"
        />
        <span className="text-2xl font-bold text-primary">Upa OS</span>
      </div>

      <div className="relative w-full max-w-md">
        <div className="relative">
          <div className="overflow-hidden rounded-xl shadow-[2px_9px_19px_rgba(0,0,0,0.1)]">
            <Image
              src="/login/dashboard-preview.png"
              alt="Upa OS dashboard preview"
              width={2328}
              height={1268}
              className="h-auto w-full"
              priority
            />
          </div>
          <div className="absolute top-[-13.8%] left-[65.8%] w-[27.4%] -rotate-1 overflow-hidden rounded-[10px] shadow-[0px_4px_14px_rgba(0,0,0,0.1)]">
            <Image
              src="/login/soa-preview.png"
              alt="Statement of account preview"
              width={604}
              height={326}
              className="h-auto w-full"
            />
          </div>
          <div className="absolute top-[76.2%] left-[6.7%] w-[25.6%] overflow-hidden rounded-[10px] shadow-[0px_4px_25px_rgba(0,0,0,0.1)]">
            <Image
              src="/login/chart-preview.png"
              alt="Monthly cash flow preview"
              width={948}
              height={694}
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md text-center">
        <h2 className="text-[28px] leading-tight font-bold text-primary">
          Rental management simplified
        </h2>
        <p className="mt-3 text-[15px] text-primary/80">
          Keep tenants, billing and payments organised so managing your
          property takes less time and effort.
        </p>
      </div>
    </div>
  );
}
