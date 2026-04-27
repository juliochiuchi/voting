import { supabaseHttp } from "@/services/supabaseHttp"
import type { Round } from "@/types/round"

type CreateRoundInput = Omit<Round, "id">
type UpdateRoundInput = Partial<Omit<Round, "id">>

export async function listRounds() {
  const response = await supabaseHttp.get<Round[]>("/rounds", {
    params: {
      select:
        "id,id_election,round_number,total_numbers_votes_per_round,maximum_number_votes_per_ballot,status",
      order: "id_election.asc,round_number.desc",
    },
  })

  return response.data
}

export async function listRoundsByElectionId(electionId: string) {
  const response = await supabaseHttp.get<Round[]>("/rounds", {
    params: {
      select:
        "id,id_election,round_number,total_numbers_votes_per_round,maximum_number_votes_per_ballot,status",
      id_election: `eq.${electionId}`,
      order: "round_number.desc",
    },
  })

  return response.data
}

export async function findRoundByElectionAndId({
  electionId,
  roundId,
}: {
  electionId: string
  roundId: string
}) {
  const response = await supabaseHttp.get<Round[]>("/rounds", {
    params: {
      select:
        "id,id_election,round_number,total_numbers_votes_per_round,maximum_number_votes_per_ballot,status",
      id: `eq.${roundId}`,
      id_election: `eq.${electionId}`,
      limit: 1,
    },
  })

  const [round] = response.data
  return round ?? null
}

export async function createRound(input: CreateRoundInput) {
  const roundToCreate: CreateRoundInput = {
    ...input,
    status: "OPEN",
  }

  const response = await supabaseHttp.post<Round[]>(
    "/rounds",
    [roundToCreate],
    {
      headers: {
        Prefer: "return=representation",
      },
    },
  )

  const [createdRound] = response.data
  return createdRound ?? null
}

export async function updateRound(id: string, input: UpdateRoundInput) {
  const response = await supabaseHttp.patch<Round[]>("/rounds", input, {
    params: {
      id: `eq.${id}`,
    },
    headers: {
      Prefer: "return=representation",
    },
  })

  const [updatedRound] = response.data
  return updatedRound ?? null
}

export async function deleteRound(id: string) {
  await supabaseHttp.delete("/rounds", {
    params: {
      id: `eq.${id}`,
    },
  })
}
