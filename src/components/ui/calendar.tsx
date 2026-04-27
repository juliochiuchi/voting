import * as React from "react"
import dayjs from "dayjs"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type CalendarProps = {
  selected?: Date
  onSelect?: (date: Date) => void
  className?: string
}

const weekDayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function toStartOfDay(date: dayjs.Dayjs) {
  return date.startOf("day")
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [monthCursor, setMonthCursor] = React.useState(() => {
    return selected ? dayjs(selected) : dayjs()
  })

  React.useEffect(() => {
    if (selected) setMonthCursor(dayjs(selected))
  }, [selected])

  const monthStart = toStartOfDay(monthCursor).startOf("month")
  const monthEnd = toStartOfDay(monthCursor).endOf("month")
  const gridStart = monthStart.startOf("week")
  const gridEnd = monthEnd.endOf("week")

  const days: dayjs.Dayjs[] = []
  let cursor = gridStart
  while (cursor.isBefore(gridEnd) || cursor.isSame(gridEnd, "day")) {
    days.push(cursor)
    cursor = cursor.add(1, "day")
  }

  const selectedDay = selected ? dayjs(selected) : null
  const today = dayjs()

  return (
    <div className={cn("w-[280px] select-none", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold tracking-tight">
          {monthCursor.format("MMMM YYYY")}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-xl"
            onClick={() => setMonthCursor((previous) => previous.subtract(1, "month"))}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-xl"
            onClick={() => setMonthCursor((previous) => previous.add(1, "month"))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDayLabels.map((label) => (
          <div
            key={label}
            className="grid h-7 place-items-center text-xs text-muted-foreground"
          >
            {label}
          </div>
        ))}
        {days.map((day) => {
          const isOutsideMonth = !day.isSame(monthCursor, "month")
          const isSelected = selectedDay ? day.isSame(selectedDay, "day") : false
          const isToday = day.isSame(today, "day")

          return (
            <button
              key={day.format("YYYY-MM-DD")}
              type="button"
              className={cn(
                "grid h-9 w-9 cursor-pointer place-items-center rounded-xl text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
                isOutsideMonth
                  ? "text-muted-foreground/40 hover:bg-white/6"
                  : "text-foreground hover:bg-white/8",
                isSelected ? "bg-white/14 ring-1 ring-white/12" : null,
                isToday && !isSelected ? "ring-1 ring-white/10" : null,
              )}
              onClick={() => onSelect?.(day.toDate())}
            >
              {day.date()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

