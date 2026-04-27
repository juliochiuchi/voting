export type ElectedStatus = "ELECTED" | "DESERTER" | string

export type Elected = {
  id: string
  id_election: string
  id_round: string
  id_member: string
  number_votes_received: number
  status: ElectedStatus
}

