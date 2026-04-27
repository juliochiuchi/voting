import { supabaseHttp } from "@/services/supabaseHttp"
import type { Election } from "@/types/election"

type CreateElectionInput = Omit<Election, "id">
type UpdateElectionInput = Partial<Omit<Election, "id">>

type ElectionApi = Omit<Election, "type_election"> & { type_election: string | number }

function normalizeElection(election: ElectionApi): Election {
  return {
    ...election,
    type_election: String(election.type_election),
  }
}

export async function listElections() {
  const response = await supabaseHttp.get<ElectionApi[]>("/elections", {
    params: {
      select:
        "id,name,date,type_election,status,number_votes_needed_elected,total_number_voters,number_coro",
      order: "date.desc",
    },
  })

  return response.data.map(normalizeElection)
}

export async function createElection(input: CreateElectionInput) {
  const electionToCreate: CreateElectionInput = {
    ...input,
    status: "OPEN",
  }

  const response = await supabaseHttp.post<ElectionApi[]>(
    "/elections",
    [electionToCreate],
    {
      headers: {
        Prefer: "return=representation",
      },
    },
  )

  const [createdElection] = response.data
  return createdElection ? normalizeElection(createdElection) : null
}

export async function updateElection(id: string, input: UpdateElectionInput) {
  const response = await supabaseHttp.patch<ElectionApi[]>(
    "/elections",
    input,
    {
      params: {
        id: `eq.${id}`,
      },
      headers: {
        Prefer: "return=representation",
      },
    },
  )

  const [updatedElection] = response.data
  return updatedElection ? normalizeElection(updatedElection) : null
}

export async function deleteElection(id: string) {
  await supabaseHttp.delete("/elections", {
    params: {
      id: `eq.${id}`,
    },
  })
}
