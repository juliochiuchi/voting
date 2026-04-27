import { supabaseHttp } from "@/services/supabaseHttp"

type VotingRecordApi = {
  id: string | number
}

export async function submitBallot({
  electionId,
  roundId,
  voterCpf,
  memberIds,
}: {
  electionId: string
  roundId: string
  voterCpf?: string
  memberIds: string[]
}) {
  const votingRecordPayload: Record<string, unknown> = {
    id_election: electionId,
    id_round: roundId,
    ...(voterCpf ? { cpf: voterCpf } : {}),
  }

  const votingRecordResponse = await supabaseHttp.post<VotingRecordApi[]>(
    "/voting_records",
    [votingRecordPayload],
    {
      headers: {
        Prefer: "return=representation",
      },
    },
  )

  const createdVotingRecordId =
    votingRecordResponse.data[0]?.id !== undefined
      ? String(votingRecordResponse.data[0].id)
      : null

  try {
    const votesPayload = memberIds.map((memberId) => ({
      id_election: electionId,
      id_round: roundId,
      id_member: memberId,
    }))

    await supabaseHttp.post("/votes", votesPayload, {
      headers: {
        Prefer: "return=minimal",
      },
    })
  } catch (error) {
    if (createdVotingRecordId) {
      await supabaseHttp
        .delete("/voting_records", {
          params: {
            id: `eq.${createdVotingRecordId}`,
          },
        })
        .catch(() => undefined)
    }
    throw error
  }
}

