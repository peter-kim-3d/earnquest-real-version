'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Bell, Package, Ticket } from '@phosphor-icons/react';
import { toast } from 'sonner';
import TicketCard from '@/components/store/TicketCard';

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

      toast.success('Approved!', {
        description: 'Have fun!',
      });

      router.refresh();
    } catch (error: any) {
      console.error('Approve error:', error);
      toast.error('Approval failed', {
        description: error.message || 'Please try again.',
      });
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

      toast.success('Marked as given!', {
        description: 'Ticket has been fulfilled.',
      });

      router.refresh();
    } catch (error: any) {
      console.error('Fulfill error:', error);
      toast.error('Fulfillment failed', {
        description: error.message || 'Please try again.',
      });
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
          <Ticket size={24} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-main dark:text-white">
            🎫 Tickets to Handle
          </h2>
          <p className="text-sm text-text-muted dark:text-gray-400">
            {pendingTickets.length + activeTickets.length} ticket
            {pendingTickets.length + activeTickets.length === 1 ? '' : 's'}{' '}
            need your attention
          </p>
        </div>
      </div>

      {/* Use Requests (pending approval) */}
      {pendingTickets.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={20} weight="fill" className="text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-bold text-yellow-700 dark:text-yellow-300">
              Use Requests ({pendingTickets.length})
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
            <Package size={20} weight="fill" className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-blue-700 dark:text-blue-300">
              Ready to Give ({activeTickets.length})
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
