"use client";

import { useFlags } from "@/hooks/use-flags";
import { FlagCard } from "./flag-card";
import { LoadingState } from "@/components/shared/loading-state";

export function FlagList() {
  const { flags, isLoading } = useFlags();

  if (isLoading) return <LoadingState message="Mapping AI-guarded features..." />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {flags.map((flag) => (
        <FlagCard key={flag.id} flag={flag} onSelect={() => {}} />
      ))}
    </div>
  );
}