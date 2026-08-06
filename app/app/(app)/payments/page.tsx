import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";

export default function PaymentsPage() {
  return (
    <>
      <PageHeader title="Payments" />
      <EmptyState icon={Wallet} title="No payments have been recorded yet." />
    </>
  );
}
