'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Bell, Package, Ticket } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import TicketCard from '@/components/store/TicketCard';
import { getErrorMessage } from '@/lib/utils/error';

type Purchase = {
  id: string;
  status: string;
  points_spent: number;
  purchased_at: string;
  fulfilled_at: string | null;
  used_at: string | null;
  reward: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    icon: string | null;
    image_url: string | null;
    screen_minutes: number | null;
  };
  child?: {
    name: string;
    avatar_url: string | null;
  };
};

interface PendingTicketsSectionProps {
  pendingTickets: Purchase[];
  activeTickets: Purchase[];
}

export default function PendingTicketsSection({
  pendingTickets,
  activeTickets,
}: PendingTicketsSectionProps) {
  const router = useRouter();
  const t = useTranslations('parent.pendingTickets');
  const [approving, setApproving] = useState<string | null>(null);
  const [fulfilling, setFulfilling] = useState<string | null>(null);

  const handleApprove = async (ticketId: string) => {
    setApproving(ticketId);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve');
      }

      toast.success(t('approved'), {
        description: t('haveFun'),
      });

      router.refresh();
    } catch (error: unknown) {
      console.error('Approve error:', error);
      toast.error(t('approvalFailed'), { description: getErrorMessage(error) });
    } finally {
      setApproving(null);
    }
  };

  const handleFulfill = async (ticketId: string) => {
    setFulfilling(ticketId);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/fulfill`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fulfill');
      }

      toast.success(t('markedAsGiven'), {
        description: t('ticketFulfilled'),
      });

      router.refresh();
    } catch (error: unknown) {
      console.error('Fulfill error:', error);
      toast.error(t('fulfillmentFailed'), { description: getErrorMessage(error) });
    } finally {
      setFulfilling(null);
    }
  };

  const hasItems = pendingTickets.length > 0 || activeTickets.length > 0;

  if (!hasItems) {
    return null;
  }

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Ticket size={24} className="text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-main dark:text-white">
            <span aria-hidden="true">🎫 </span>{t('ticketsTitle')}
          </h2>
          <p className="text-sm text-text-muted dark:text-gray-400">
            {t('ticketsNeedAttention', { count: pendingTickets.length + activeTickets.length })}
          </p>
        </div>
      </div>

      {/* Use Requests (pending approval) */}
      {pendingTickets.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={20} weight="fill" className="text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
            <h3 className="font-bold text-yellow-700 dark:text-yellow-300">
              {t('useRequests', { count: pendingTickets.length })}
            </h3>
          </div>
          <div className="grid gap-3">
            {pendingTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-start gap-3">
                <div className="flex-1">
                  <TicketCard
                    purchase={ticket}
                    viewMode="parent"
                    onApprove={handleApprove}
                    isApproving={approving === ticket.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ready to Give (active non-screen tickets) */}
      {activeTickets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package size={20} weight="fill" className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <h3 className="font-bold text-blue-700 dark:text-blue-300">
              {t('readyToGive', { count: activeTickets.length })}
            </h3>
          </div>
          <div className="grid gap-3">
            {activeTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-start gap-3">
                <div className="flex-1">
                  <TicketCard
                    purchase={ticket}
                    viewMode="parent"
                    onFulfill={handleFulfill}
                    isFulfilling={fulfilling === ticket.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
