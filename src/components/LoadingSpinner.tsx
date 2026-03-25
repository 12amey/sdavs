interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    text?: string;
}

export function LoadingSpinner({ size = 'md', color = 'green-500', text }: LoadingSpinnerProps) {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    return (
        <div className="flex flex-col items-center justify-center">
            <div
                className={`${sizes[size]} border-4 border-${color} border-t-transparent rounded-full animate-spin`}
            ></div>
            {text && <p className="mt-4 text-slate-300">{text}</p>}
        </div>
    );
}

interface SkeletonLoaderProps {
    className?: string;
    count?: number;
}

export function SkeletonLoader({ className = '', count = 1 }: SkeletonLoaderProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`animate-pulse bg-slate-700/50 rounded ${className}`}
                ></div>
            ))}
        </>
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="animate-pulse space-y-4">
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                <div className="h-8 bg-slate-700 rounded w-1/2"></div>
                <div className="h-4 bg-slate-700 rounded w-full"></div>
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                    <div className="h-12 bg-slate-700 rounded flex-1"></div>
                </div>
            ))}
        </div>
    );
}
