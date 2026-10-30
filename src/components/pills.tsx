type Props = {
  tone?: "solid" | "outline" | "muted";
  children: React.ReactNode;
  withDot?: boolean;
};

export function Pill({ tone = "outline", children, withDot = false }: Props) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] leading-none";
  const tones = {
    solid: "border-foreground bg-foreground text-background",
    outline: "border-border bg-background text-foreground",
    muted: "border-transparent bg-muted text-muted-foreground",
  } as const;

  return (
    <span className={`${base} ${tones[tone]}`}>
      {withDot ? (
        <span
          aria-hidden="true"
          className={`size-1.5 rounded-full ${
            tone === "solid" ? "bg-background" : "bg-foreground"
          }`}
        />
      ) : null}
      {children}
    </span>
  );
}

export function LockStatePill({ isLocked }: { isLocked: boolean }) {
  return (
    <Pill tone={isLocked ? "outline" : "solid"} withDot>
      {isLocked ? "Locked" : "Unlocked"}
    </Pill>
  );
}

export function StatusPill({ status }: { status: "CONFIRMED" | "CANCELLED" }) {
  if (status === "CANCELLED") {
    return <Pill tone="muted">Cancelled</Pill>;
  }

  return (
    <Pill tone="outline" withDot>
      Confirmed
    </Pill>
  );
}
