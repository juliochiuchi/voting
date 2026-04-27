export type Vote = {
  id: string
  id_election: string
  id_round: string
  id_member: string
}

export type VoteListItem = {
  id: string
  electionName: string
  electionType: string
  roundNumber: string
  memberName: string
}
