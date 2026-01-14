'use client';

import { Wallet } from 'lucide-react';
import { AppIcon } from '@/components/ui/AppIcon';

interface WalletCardProps {
  balance: number;
  childName: string;
}

export default function WalletCard({ balance, childName }: WalletCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-green-600 p-6 shadow-card hover:shadow-card-hover transition-all duration-normal">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
            My Wallet
          </h3>
          <Wallet className="h-6 w-6 text-white/80" />
        </div>

        <p className="text-5xl font-black text-white mb-2">
          {balance}
        </p>
        <p className="text-lg text-white/80 font-medium">
          Quest Points
        </p>

        {/* Today's earnings (placeholder - can be calculated from today's completions) */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
          <AppIcon name="trending_up" size={16} weight="bold" className="text-white" />
          <span className="text-sm font-semibold text-white">
            Ready to spend!
          </span>
        </div>
      </div>
    </div>
  );
}
