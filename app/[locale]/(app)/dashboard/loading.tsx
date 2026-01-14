import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Welcome Section Skeleton */}
            <div className="mb-8">
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-6 w-96" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Action Center Skeleton */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-20 w-full rounded-lg" />
                            <Skeleton className="h-20 w-full rounded-lg" />
                        </div>
                    </div>

                    {/* Pending Tickets Skeleton */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-6 w-40" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-full rounded-lg" />
                        </div>
                    </div>

                    {/* Children Cards Skeleton */}
                    <div>
                        <Skeleton className="h-7 w-32 mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                                    <div className="h-24 bg-muted animate-pulse" />
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="space-y-2">
                                                <Skeleton className="h-6 w-32" />
                                                <Skeleton className="h-4 w-20" />
                                            </div>
                                            <Skeleton className="h-16 w-16 rounded-full -mt-12 border-4 border-background" />
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-12 w-full rounded-lg" />
                                            <Skeleton className="h-12 w-full rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">
                    {/* Activity Feed Skeleton */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="space-y-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
