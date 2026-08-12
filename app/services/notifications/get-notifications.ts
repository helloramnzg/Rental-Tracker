import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getPaymentsContext } from "@/services/payments/get-payments-context";
import { getSoaScreenContext } from "@/services/soa/get-soa-screen-context";

export type NotificationItem = {
  id: string;
  type: "payment" | "soa";
  title: string;
  description: string;
  href: string;
};

export type NotificationsContext = {
  items: NotificationItem[];
};

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// There is no persisted in-app notification table — the only built
// notification system is the Resend email reminders
// (docs/product/16-notification-system.md); migration
// 20260807160000_notification_preferences.sql explicitly notes the
// in_app_notifications_enabled toggle "has no consumer yet". This
// derives a notification list from data that already exists, reusing
// getPaymentsContext and getSoaScreenContext the same way the
// Dashboard does for its own "N payments need your attention" status
// (get-dashboard-status.ts), so the bell never claims something the
// backend can't actually back up. There is no read/unread state —
// every call reflects the current billing cycle's actual state.
export async function getNotifications(
  supabase: SupabaseClient<Database>,
  { year, month }: { year: number; month: number },
): Promise<NotificationsContext> {
  const [paymentsContext, soaContext] = await Promise.all([
    getPaymentsContext(supabase, { year, month }),
    getSoaScreenContext(supabase, { year, month }),
  ]);

  const items: NotificationItem[] = [];

  for (const row of paymentsContext.tenantRows) {
    if (row.status === "paid") continue;
    items.push({
      id: `payment-${row.tenantId}`,
      type: "payment",
      title:
        row.status === "partial"
          ? `${row.tenantName} has a partial balance`
          : `${row.tenantName} has an outstanding balance`,
      description: `${formatCurrency(row.outstanding)} outstanding · ${row.unitName}`,
      href: "/payments",
    });
  }

  if (soaContext.billingCycle) {
    const pending = soaContext.cards.filter((c) => c.generatedSoaId === null).length;
    if (pending > 0) {
      items.push({
        id: "soa-pending",
        type: "soa",
        title:
          pending === 1
            ? "1 Statement of Account needs generating"
            : `${pending} Statements of Account need generating`,
        description: "Billing is ready — SOAs haven't been generated yet.",
        href: "/soa",
      });
    }
  }

  return { items };
}
