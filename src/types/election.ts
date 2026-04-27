export type ElectionStatus = "DRAFT" | "OPEN" | "CLOSED" | "CANCELLED" | string

export type Election = {
  id: string
  name: string
  date: string
  type_election: string
  status: ElectionStatus
  number_votes_needed_elected: number
  total_number_voters: number
  number_coro: number
}

