export type RoundStatus = "OPEN" | "COMPLETED" | "CANCELLED" | string

export type Round = {
  id: string
  id_election: string
  round_number: number
  total_numbers_votes_per_round: number
  maximum_number_votes_per_ballot: number
  status: RoundStatus
}

