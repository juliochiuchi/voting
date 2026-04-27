import { supabaseHttp } from "@/services/supabaseHttp"
import type { Elected } from "@/types/elected"

type ElectedApi = Omit<Elected, "id_election" | "id_round" | "id_member"> & {
  id_election: string | number
  id_round: string | number
  id_member: string | number
}

function normalizeElected(row: ElectedApi): Elected {
  return {
    ...row,
    id_election: String(row.id_election),
    id_round: String(row.id_round),
    id_member: String(row.id_member),
    number_votes_received: Number(row.number_votes_received ?? 0),
    status: String(row.status ?? ""),
    id: String(row.id),
  }
}

export async function listElectedByElectionAndRound({
  electionId,
  roundId,
}: {
  electionId: string
  roundId: string
}) {
  const response = await supabaseHttp.get<ElectedApi[]>("/elected", {
    params: {
      select: "id,id_election,id_round,id_member,number_votes_received,status",
      id_election: `eq.${electionId}`,
      id_round: `eq.${roundId}`,
      order: "id.desc",
      limit: 2000,
    },
  })

  return response.data.map(normalizeElected)
}

export async function listElectedByElection({ electionId }: { electionId: string }) {
  const response = await supabaseHttp.get<ElectedApi[]>("/elected", {
    params: {
      select: "id,id_election,id_round,id_member,number_votes_received,status",
      id_election: `eq.${electionId}`,
      order: "id.desc",
      limit: 5000,
    },
  })

  return response.data.map(normalizeElected)
}

export async function createElectedRecord(input: Omit<Elected, "id">) {
  const response = await supabaseHttp.post<ElectedApi[]>("/elected", [input], {
    headers: {
      Prefer: "return=representation",
    },
  })

  const [created] = response.data
  return created ? normalizeElected(created) : null
}
