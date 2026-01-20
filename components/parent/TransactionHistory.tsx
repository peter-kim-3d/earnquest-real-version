'use client';

import { useState, useEffect, useMemo } from 'react';
import { Scroll, CaretDown, ArrowUp, ArrowDown, Target, Gift, Repeat, Question } from '@phosphor-icons/react/dist/ssr';
import { useTranslations, useLocale } from 'next-intl';

interface Transaction {
  id: string;
  child_id: string;
  type: 'earn' | 'spend' | 'refund' | 'deposit' | 'adjustment';
  amount: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  balance_after: number;
  created_at: string;
  children?: {
    id: string;
    name: string;
  };
}

interface TransactionHistoryProps {
  childId?: string;
  childName?: string;
  limit?: number;
}

export default function TransactionHistory({
  childId,
  childName,
  limit = 50,
}: TransactionHistoryProps) {
  const t = useTranslations('parent.transactions');
  const locale = useLocale();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [childId]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (childId) params.set('childId', childId);

      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(t('loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <ArrowUp size={16} weight="bold" className="text-green-500" />;
      case 'spend':
        return <ArrowDown size={16} weight="bold" className="text-red-500" />;
      case 'refund':
        return <Repeat size={16} weight="bold" className="text-blue-500" />;
      case 'deposit':
        return <Target size={16} weight="bold" className="text-purple-500" />;
      default:
        return <Question size={16} className="text-gray-400" />;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return 'text-green-600 dark:text-green-400';
    if (amount < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (txDate.getTime() === today.getTime()) return t('today');
    if (txDate.getTime() === yesterday.getTime()) return t('yesterday');

    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Group transactions by date (memoized for performance)
  const groupedTransactions = useMemo(() => {
    return transactions.reduce((groups, tx) => {
      const date = formatDate(tx.created_at);
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
      return groups;
    }, {} as Record<string, Transaction[]>);
  }, [transactions, locale]);

  const visibleGroups = showAll
    ? Object.entries(groupedTransactions)
    : Object.entries(groupedTransactions).slice(0, 3);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scroll size={20} className="text-primary" />
          <h3 className="font-bold text-gray-900 dark:text-white">{t('title')}</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scroll size={20} className="text-primary" />
          <h3 className="font-bold text-gray-900 dark:text-white">{t('title')}</h3>
        </div>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Scroll size={20} className="text-primary" />
          <h3 className="font-bold text-gray-900 dark:text-white">
            {childName ? t('titleWithChild', { name: childName }) : t('title')}
          </h3>
        </div>
        {!childId && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('allChildren')}
          </span>
        )}
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Gift size={40} className="mx-auto mb-2 opacity-50" />
            <p>{t('noTransactions')}</p>
          </div>
        ) : (
          visibleGroups.map(([date, txs]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {date}
                </span>
              </div>

              {/* Transactions */}
              {txs.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {getTransactionIcon(tx.type)}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {!childId && tx.children?.name && (
                        <span className="font-medium">{tx.children.name} · </span>
                      )}
                      {formatTime(tx.created_at)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="flex-shrink-0 text-right">
                    <p className={`font-bold ${getTransactionColor(tx.type, tx.amount)}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} XP
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t('balanceShort')} {tx.balance_after}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Show More Button */}
      {Object.keys(groupedTransactions).length > 3 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-t border-gray-100 dark:border-gray-700"
        >
          <CaretDown size={16} />
          {t('showMore')}
        </button>
      )}
    </div>
  );
}
