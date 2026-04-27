import { getBestNameFromRow } from "@/lib/personName"
import { listElectionTypes } from "@/services/electionTypesService"
import { toPostgrestInFilter } from "@/services/postgrestFilters"
import { buildRangeHeaders, getTotalFromContentRange } from "@/services/postgrestPagination"
import { supabaseHttp } from "@/services/supabaseHttp"
import type { Election } from "@/types/election"
import type { PaginatedResult } from "@/types/pagination"
import type { Round } from "@/types/round"
import type { Vote, VoteListItem } from "@/types/vote"

type ListVotesInput = {
  page: number
  pageSize: number
  memberNameFilter?: string
}

type VoteApi = Omit<Vote, "id_election" | "id_round" | "id_member"> & {
  id_election: string | number
  id_round: string | number
  id_member: string | number
}

type ElectionApi = Omit<Election, "type_election"> & { type_election: string | number }

type RoundApi = Omit<Round, "id_election"> & { id_election: string | number }

function normalizeVote(vote: VoteApi): Vote {
  return {
    ...vote,
    id_election: String(vote.id_election),
    id_round: String(vote.id_round),
    id_member: String(vote.id_member),
  }
}

function normalizeElection(election: ElectionApi): Election {
  return {
    ...election,
    type_election: String(election.type_election),
  }
}

function normalizeRound(round: RoundApi): Round {
  return {
    ...round,
    id_election: String(round.id_election),
  }
}

async function listMemberIdsByNameLike(memberNameFilter: string) {
  const trimmed = memberNameFilter.trim()
  if (!trimmed) return null

  const response = await supabaseHttp.get<Array<Record<string, unknown>>>("/members", {
    params: {
      select: "id,name",
      name: `ilike.*${trimmed}*`,
      limit: 1000,
      order: "name.asc",
    },
  })

  return response.data
    .map((row) => row.id)
    .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
    .map(String)
}

async function listVotesPage(input: ListVotesInput) {
  const { headers } = buildRangeHeaders(input)

  const memberIds = input.memberNameFilter
    ? await listMemberIdsByNameLike(input.memberNameFilter)
    : null

  if (Array.isArray(memberIds) && memberIds.length === 0) {
    return { votes: [], total: 0 }
  }

  const response = await supabaseHttp.get<VoteApi[]>("/votes", {
    params: {
      select: "id,id_election,id_round,id_member",
      ...(memberIds ? { id_member: toPostgrestInFilter(memberIds) } : {}),
      order: "id.desc",
    },
    headers,
  })

  const total = getTotalFromContentRange(response.headers["content-range"]) ?? 0
  const votes = response.data.map(normalizeVote)

  return { votes, total }
}

async function listElectionsByIds(electionIds: string[]) {
  if (electionIds.length === 0) return []

  const response = await supabaseHttp.get<ElectionApi[]>("/elections", {
    params: {
      select: "id,name,type_election",
      id: toPostgrestInFilter(electionIds),
    },
  })

  return response.data.map(normalizeElection)
}

async function listRoundsByIds(roundIds: string[]) {
  if (roundIds.length === 0) return []

  const response = await supabaseHttp.get<RoundApi[]>("/rounds", {
    params: {
      select: "id,id_election,round_number",
      id: toPostgrestInFilter(roundIds),
    },
  })

  return response.data.map(normalizeRound)
}

async function listMembersByIds(memberIds: string[]) {
  if (memberIds.length === 0) return []

  const response = await supabaseHttp.get<Array<Record<string, unknown>>>("/members", {
    params: {
      select: "*",
      id: toPostgrestInFilter(memberIds),
    },
  })

  return response.data
}

export async function listVotesForAdmin(
  input: ListVotesInput,
): Promise<PaginatedResult<VoteListItem>> {
  const { votes, total } = await listVotesPage(input)

  const electionIds = Array.from(new Set(votes.map((vote) => vote.id_election)))
  const roundIds = Array.from(new Set(votes.map((vote) => vote.id_round)))
  const memberIds = Array.from(new Set(votes.map((vote) => vote.id_member)))

  const [elections, rounds, members, electionTypes] = await Promise.all([
    listElectionsByIds(electionIds),
    listRoundsByIds(roundIds),
    listMembersByIds(memberIds),
    listElectionTypes(),
  ])

  const electionById = new Map(elections.map((election) => [election.id, election]))
  const roundById = new Map(rounds.map((round) => [round.id, round]))
  const memberNameById = new Map(
    members.map((memberRow) => [String(memberRow.id ?? ""), getBestNameFromRow(memberRow) ?? "—"]),
  )
  const electionTypeById = new Map(electionTypes.map((type) => [type.id, type.type]))

  const items: VoteListItem[] = votes.map((vote) => {
    const election = electionById.get(vote.id_election)
    const round = roundById.get(vote.id_round)

    const electionName = election?.name ?? "—"
    const electionType =
      (election?.type_election ? electionTypeById.get(String(election.type_election)) : null) ??
      "—"
    const roundNumber = round?.round_number ? String(round.round_number) : "—"
    const memberName = memberNameById.get(vote.id_member) ?? "—"

    return {
      id: vote.id,
      electionName,
      electionType,
      roundNumber,
      memberName,
    }
  })

  return { items, total }
}
