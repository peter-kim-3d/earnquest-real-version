export function formatPoints(points: number | null | undefined): string {
    const value = points || 0;
    return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function formatPercentage(value: number, decimals = 0): string {
    return `${value.toFixed(decimals)}%`;
}
