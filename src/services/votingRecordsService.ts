import { supabaseHttp } from "@/services/supabaseHttp"

type VotingRecordRow = {
  id_round: string
}

export async function listRoundIdsVotedByMember(params: {
  electionId: string
  cpf: string
}) {
  const response = await supabaseHttp.get<VotingRecordRow[]>("/voting_records", {
    params: {
      select: "id_round",
      id_election: `eq.${params.electionId}`,
      cpf: `eq.${params.cpf}`,
    },
  })

  return response.data.map((row) => String(row.id_round))
}

export async function listVotingRecordRoundIdsByElection(params: {
  electionId: string
}) {
  const response = await supabaseHttp.get<VotingRecordRow[]>("/voting_records", {
    params: {
      select: "id_round",
      id_election: `eq.${params.electionId}`,
    },
  })

  return response.data.map((row) => String(row.id_round))
}

