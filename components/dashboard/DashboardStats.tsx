import { Lightning, CheckCircle, TrendUp } from '@/components/ui/ClientIcons';

interface DashboardStatsProps {
    activeTasksCount: number;
    pendingApprovalsCount: number;
    totalWeeklyXP: number;
}

export default function DashboardStats({
    activeTasksCount,
    pendingApprovalsCount,
    totalWeeklyXP,
}: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Active Tasks */}
            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Lightning className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-text-muted dark:text-gray-400">
                        Active Tasks
                    </p>
                    <p className="text-2xl font-black text-text-main dark:text-white">
                        {activeTasksCount}
                    </p>
                </div>
            </div>

            {/* Pending Approvals */}
            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${pendingApprovalsCount > 0
                    ? 'bg-orange-100 dark:bg-orange-900/30'
                    : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                    {pendingApprovalsCount > 0 ? (
                        <CheckCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    ) : (
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-text-muted dark:text-gray-400">
                        Pending Approvals
                    </p>
                    <p className="text-2xl font-black text-text-main dark:text-white">
                        {pendingApprovalsCount}
                    </p>
                </div>
            </div>

            {/* Weekly XP */}
            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <TrendUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-text-muted dark:text-gray-400">
                        Family Weekly XP
                    </p>
                    <p className="text-2xl font-black text-text-main dark:text-white">
                        {totalWeeklyXP}
                    </p>
                </div>
            </div>
        </div>
    );
}
