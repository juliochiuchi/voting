import { supabaseHttp } from "@/services/supabaseHttp"

type VoteRow = { id_member: string | number | null }

export async function listVoteMemberIdsByElectionAndRound({
  electionId,
  roundId,
}: {
  electionId: string
  roundId: string
}) {
  const response = await supabaseHttp.get<VoteRow[]>("/votes", {
    params: {
      select: "id_member",
      id_election: `eq.${electionId}`,
      id_round: `eq.${roundId}`,
      limit: 20000,
    },
  })

  return response.data
    .map((row) => row.id_member)
    .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
    .map(String)
}

