'use client';

import { useState, useEffect } from 'react';
import { Gear, Eye, EyeSlash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardLayoutProps {
    header: React.ReactNode;
    stats: React.ReactNode;
    actionCenter: React.ReactNode;
    pendingTickets: React.ReactNode;
    activityFeed: React.ReactNode;
    childrenList: React.ReactNode;
    transactionHistory?: React.ReactNode;
}

type WidgetId = 'stats' | 'actionCenter' | 'pendingTickets' | 'activityFeed' | 'transactionHistory';

const WIDGET_LABELS: Record<WidgetId, string> = {
    stats: 'Quick Stats',
    actionCenter: 'Action Center',
    pendingTickets: 'Pending Tickets',
    activityFeed: 'Activity Feed',
    transactionHistory: 'Point History',
};

const STORAGE_KEY = 'earnquest_dashboard_settings';

export default function DashboardLayout({
    header,
    stats,
    actionCenter,
    pendingTickets,
    activityFeed,
    childrenList,
    transactionHistory,
}: DashboardLayoutProps) {
    const [mounted, setMounted] = useState(false);
    const [visibleWidgets, setVisibleWidgets] = useState<Record<WidgetId, boolean>>({
        stats: true,
        actionCenter: true,
        pendingTickets: true,
        activityFeed: true,
        transactionHistory: true,
    });

    // Load settings from local storage on mount
    useEffect(() => {
        setMounted(true);
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                if (parsed.visible) {
                    setVisibleWidgets((prev) => ({ ...prev, ...parsed.visible }));
                }
            } catch (e) {
                console.error('Failed to parse dashboard settings', e);
            }
        }
    }, []);

    // Save settings when changed
    const toggleWidget = (id: WidgetId) => {
        const newVisible = { ...visibleWidgets, [id]: !visibleWidgets[id] };
        setVisibleWidgets(newVisible);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ visible: newVisible }));
    };

    // Avoid hydration mismatch by rendering default structure until mounted
    // But we want to show content immediately for SEO/SSR, so we just use default 'true' before mount
    // However, this might cause a flicker if user has hidden items.
    // To avoid flicker, we could use a useLayoutEffect-like approach or just accept it.
    // Standard practice for client-only preference is to render default or null.
    // Given this is a dashboard behind auth, SEO is less critical, but UX is.
    // We'll render with defaults (all visible) on server/first render, and update after mount.
    // This causes a "layout shift" if something hides.
    // A better approach is to render everything but hide via CSS? No, we want to remove from DOM if possible for clean layout.
    // But CSS display:none is safer for hydration.
    // Let's rely on React state.

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl relative">
            {/* Header Area with Customize Button */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
                <div className="flex-1">
                    {header}
                </div>

                <div className="flex-shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Gear size={16} />
                                Customize
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Dashboard Widgets</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {(Object.keys(WIDGET_LABELS) as WidgetId[]).map((id) => (
                                <DropdownMenuCheckboxItem
                                    key={id}
                                    checked={visibleWidgets[id]}
                                    onCheckedChange={() => toggleWidget(id)}
                                >
                                    <span className="flex-1">{WIDGET_LABELS[id]}</span>
                                    {visibleWidgets[id] ? (
                                        <Eye size={14} className="ml-2 opacity-50" />
                                    ) : (
                                        <EyeSlash size={14} className="ml-2 opacity-50" />
                                    )}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Quick Stats */}
            {visibleWidgets.stats && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    {stats}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Sidebar - Right Column (Inbox & Activity) */}
                <div className="lg:col-span-1 lg:col-start-3 space-y-6">
                    {visibleWidgets.actionCenter && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                            {actionCenter}
                        </div>
                    )}

                    {visibleWidgets.pendingTickets && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-150">
                            {pendingTickets}
                        </div>
                    )}

                    {visibleWidgets.activityFeed && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
                            {activityFeed}
                        </div>
                    )}

                    {transactionHistory && visibleWidgets.transactionHistory && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-250">
                            {transactionHistory}
                        </div>
                    )}
                </div>

                {/* Main Content - Left Column (Children) */}
                <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:row-end-2 space-y-6">
                    {childrenList}
                </div>
            </div>
        </div>
    );
}
