export function BlankDashboardSection({ title }: { title: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="text-xl font-semibold tracking-tight">{title}</div>
    </main>
  )
}
