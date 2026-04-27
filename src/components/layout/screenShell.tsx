import type * as React from "react"

import { cn } from "@/lib/utils"

const noiseDataUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E"

export function ScreenShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative min-h-dvh overflow-hidden bg-background text-foreground",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -inset-[40%] bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.16),transparent_40%),radial-gradient(circle_at_75%_65%,rgba(120,119,198,0.25),transparent_45%),radial-gradient(circle_at_45%_85%,rgba(16,185,129,0.12),transparent_55%)] blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.25),rgba(0,0,0,0.65))]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0,rgba(255,255,255,0)_55%)]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `url("${noiseDataUrl}")`,
            backgroundSize: "180px 180px",
            mixBlendMode: "overlay",
          }}
        />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}
