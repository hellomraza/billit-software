"use client";

type OfflineBannerProps = {
  isOnline: boolean;
  className?: string;
};

export default function OfflineBanner({
  isOnline,
  className = "",
}: OfflineBannerProps) {
  if (isOnline) return null;

  return (
    <div
      className={`bg-amber-50 border-l-4 border-amber-400 text-amber-800 px-4 py-2 text-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      You&quot;re offline — new drafts are local only. Changes will sync when
      you reconnect.
    </div>
  );
}
