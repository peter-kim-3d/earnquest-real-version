import { Skeleton } from "@/components/ui/skeleton"

export default function TasksLoading() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl" role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">Loading tasks...</span>
            {/* Page Header Skeleton */}
            <div className="mb-8">
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-6 w-96" />
            </div>

            {/* Task Stats Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-10 w-16" />
                    </div>
                ))}
            </div>

            {/* Task List Skeleton */}
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 md:p-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="flex items-start gap-4">
                                <Skeleton className="h-12 w-12 rounded-lg" />
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-auto flex gap-2">
                                <Skeleton className="h-10 w-24 rounded-lg" />
                                <Skeleton className="h-10 w-10 rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
