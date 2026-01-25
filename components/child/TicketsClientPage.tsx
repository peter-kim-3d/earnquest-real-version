'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Clock, Check, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import TicketCard from '@/components/store/TicketCard';
import ScreenTimeTimer from '@/components/child/ScreenTimeTimer';

type TicketStatus = 'active' | 'use_requested' | 'in_use' | 'used';

type Purchase = {
  id: string;
  status: string;
  points_spent: number;
  purchased_at: string;
  fulfilled_at: string | null;
  used_at: string | null;
  started_at?: string | null;
  elapsed_seconds?: number | null;
  paused_at?: string | null;
  paused_seconds?: number | null;
  reward: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    icon: string | null;
    image_url: string | null;
    screen_minutes: number | null;
  };
};

type GroupedTickets = {
  active: Purchase[];
  use_requested: Purchase[];
  in_use: Purchase[];
  used: Purchase[];
};

interface TicketsClientPageProps {
  childId: string;
  initialTickets: GroupedTickets;
}

export default function TicketsClientPage({
  childId,
  initialTickets,
}: TicketsClientPageProps) {
  const router = useRouter();
  const t = useTranslations('child.tickets');
  const [tickets, setTickets] = useState<GroupedTickets>(initialTickets);
  const [activeTab, setActiveTab] = useState<TicketStatus>('active');
  const [requestingUse, setRequestingUse] = useState<string | null>(null);

  const handleRequestUse = async (ticketId: string) => {
    setRequestingUse(ticketId);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/request-use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request use');
      }

      // Optimistic update: move ticket from active to in_use (timer starts immediately)
      const ticket = tickets.active.find(t => t.id === ticketId);
      if (ticket) {
        setTickets({
          active: tickets.active.filter(t => t.id !== ticketId),
          use_requested: tickets.use_requested,
          in_use: [...tickets.in_use, { ...ticket, status: 'in_use', started_at: new Date().toISOString() }],
          used: tickets.used,
        });
      }

      toast.success(t('screenTimeStarted'), {
        description: t('enjoyYourTime'),
      });

      // Switch to playing tab to show the timer
      setActiveTab('in_use');

      // Refresh server data in background
      router.refresh();
    } catch (error: any) {
      console.error('Request use error:', error);
      toast.error(t('requestFailed'), {
        description: error.message || 'Please try again.',
      });
    } finally {
      setRequestingUse(null);
    }
  };

  // Check if child already has screen time running (guardrail)
  const hasActiveScreenTime = tickets.in_use.length > 0;

  const handleScreenTimeComplete = (ticketId: string) => {
    // Optimistic update: move ticket from in_use to used
    const ticket = tickets.in_use.find(t => t.id === ticketId);
    if (ticket) {
      setTickets({
        active: tickets.active,
        use_requested: tickets.use_requested,
        in_use: tickets.in_use.filter(t => t.id !== ticketId),
        used: [{ ...ticket, status: 'used', used_at: new Date().toISOString() }, ...tickets.used],
      });

      // Switch to Used tab to show completion
      setActiveTab('used');
    }
  };

  const handleCancel = (ticketId: string) => {
    // Optimistic update: remove ticket from active list
    setTickets({
      active: tickets.active.filter(t => t.id !== ticketId),
      use_requested: tickets.use_requested,
      in_use: tickets.in_use,
      used: tickets.used,
    });
  };

  const tabs = [
    {
      id: 'active' as TicketStatus,
      label: t('active'),
      icon: Sparkles,
      count: tickets.active.length,
    },
    {
      id: 'use_requested' as TicketStatus,
      label: t('waiting'),
      icon: Clock,
      count: tickets.use_requested.length,
    },
    {
      id: 'in_use' as TicketStatus,
      label: t('playing'),
      icon: Play,
      count: tickets.in_use.length,
    },
    {
      id: 'used' as TicketStatus,
      label: t('used'),
      icon: Check,
      count: tickets.used.length,
    },
  ];

  return (
    <div className="container py-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-main dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-text-muted dark:text-gray-400">
          {t('subtitle')}
        </p>
      </div>

      {/* Custom Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all
                  border-b-2 -mb-px
                  ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-muted dark:text-gray-400 hover:text-text-main dark:hover:text-white'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }
                  `}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'active' && (
          <div>
            {tickets.active.length === 0 ? (
              <EmptyState
                icon="🎟️"
                message={t('noActiveTickets')}
                description={t('buyFromStore')}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tickets.active.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    purchase={ticket}
                    viewMode="child"
                    onRequestUse={handleRequestUse}
                    onCancel={handleCancel}
                    hasPendingRequest={hasActiveScreenTime}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'use_requested' && (
          <div>
            {tickets.use_requested.length === 0 ? (
              <EmptyState
                icon="⏳"
                message={t('noPendingRequests')}
                description={t('requestScreenReward')}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tickets.use_requested.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    purchase={ticket}
                    viewMode="child"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'in_use' && (
          <div>
            {tickets.in_use.length === 0 ? (
              <EmptyState
                icon="🎮"
                message={t('noActiveScreenTime')}
                description={t('onceApproved')}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tickets.in_use.map((ticket) => (
                  <ScreenTimeTimer
                    key={ticket.id}
                    purchaseId={ticket.id}
                    childId={childId}
                    rewardName={ticket.reward.name}
                    screenMinutes={ticket.reward.screen_minutes || 0}
                    startedAt={ticket.started_at || ticket.fulfilled_at || ''}
                    initialElapsedSeconds={ticket.elapsed_seconds || 0}
                    initialPausedAt={ticket.paused_at}
                    initialPausedSeconds={ticket.paused_seconds || 0}
                    onComplete={() => handleScreenTimeComplete(ticket.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'used' && (
          <div>
            {tickets.used.length === 0 ? (
              <EmptyState
                icon="✅"
                message={t('noUsedTickets')}
                description={t('ticketsHistory')}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tickets.used.slice(0, 10).map((ticket) => (
                  <TicketCard key={ticket.id} purchase={ticket} viewMode="child" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  message,
  description,
}: {
  icon: string;
  message: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">
          {message}
        </h3>
        <p className="text-sm text-text-muted dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}
