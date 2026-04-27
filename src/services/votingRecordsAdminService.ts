import { supabaseHttp } from "@/services/supabaseHttp"
import { toPostgrestInFilter } from "@/services/postgrestFilters"
import { buildRangeHeaders, getTotalFromContentRange } from "@/services/postgrestPagination"
import type { Election } from "@/types/election"
import type { PaginatedResult } from "@/types/pagination"
import type { Round } from "@/types/round"
import type { VotingRecord, VotingRecordListItem } from "@/types/votingRecord"

type ListVotingRecordsInput = {
  page: number
  pageSize: number
  cpfFilter?: string
  electionNameFilter?: string
  roundNumberFilter?: string
}

type VotingRecordApi = Omit<VotingRecord, "id_election" | "id_round"> & {
  id_election: string | number
  id_round: string | number
  cpf: string | number | null
  ip: string | null
}

type ElectionApi = Omit<Election, "type_election"> & { type_election: string | number }

type RoundApi = Omit<Round, "id_election"> & { id_election: string | number }

function normalizeVotingRecord(record: VotingRecordApi): VotingRecord {
  return {
    ...record,
    id_election: String(record.id_election),
    id_round: String(record.id_round),
    cpf: record.cpf ? String(record.cpf) : "",
    ip: record.ip ? String(record.ip) : "",
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

async function listElectionIdsByNameLike(electionNameFilter: string) {
  const trimmed = electionNameFilter.trim()
  if (!trimmed) return null

  const response = await supabaseHttp.get<Array<{ id: string | number }>>("/elections", {
    params: {
      select: "id",
      name: `ilike.*${trimmed}*`,
      order: "name.asc",
      limit: 1000,
    },
  })

  return response.data.map((item) => String(item.id))
}

function parseRoundNumber(filter: string) {
  const trimmed = filter.trim()
  if (!trimmed) return null
  const digits = trimmed.replace(/\D/g, "")
  if (!digits) return null
  const value = Number(digits)
  return Number.isFinite(value) ? value : null
}

async function listRoundIdsByRoundNumber({
  roundNumber,
  electionIds,
}: {
  roundNumber: number
  electionIds: string[] | null
}) {
  const response = await supabaseHttp.get<Array<{ id: string | number }>>("/rounds", {
    params: {
      select: "id",
      round_number: `eq.${roundNumber}`,
      ...(electionIds ? { id_election: toPostgrestInFilter(electionIds) } : {}),
      limit: 2000,
    },
  })

  return response.data.map((item) => String(item.id))
}

async function listVotingRecordsPage(input: ListVotingRecordsInput) {
  const { headers } = buildRangeHeaders(input)

  const cpfFilter = input.cpfFilter?.trim() ?? ""
  const electionIds = input.electionNameFilter
    ? await listElectionIdsByNameLike(input.electionNameFilter)
    : null

  if (Array.isArray(electionIds) && electionIds.length === 0) {
    return { records: [], total: 0 }
  }

  const roundNumber = input.roundNumberFilter ? parseRoundNumber(input.roundNumberFilter) : null
  const roundIds = roundNumber !== null ? await listRoundIdsByRoundNumber({ roundNumber, electionIds }) : null

  if (Array.isArray(roundIds) && roundIds.length === 0) {
    return { records: [], total: 0 }
  }

  const response = await supabaseHttp.get<VotingRecordApi[]>("/voting_records", {
    params: {
      select: "id,id_election,id_round,cpf,ip",
      ...(cpfFilter ? { cpf: `ilike.*${cpfFilter}*` } : {}),
      ...(electionIds ? { id_election: toPostgrestInFilter(electionIds) } : {}),
      ...(roundIds ? { id_round: toPostgrestInFilter(roundIds) } : {}),
      order: "id.desc",
    },
    headers,
  })

  const total = getTotalFromContentRange(response.headers["content-range"]) ?? 0
  const records = response.data.map(normalizeVotingRecord)

  return { records, total }
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

export async function listVotingRecordsForAdmin(
  input: ListVotingRecordsInput,
): Promise<PaginatedResult<VotingRecordListItem>> {
  const { records, total } = await listVotingRecordsPage(input)

  const electionIds = Array.from(new Set(records.map((record) => record.id_election)))
  const roundIds = Array.from(new Set(records.map((record) => record.id_round)))

  const [elections, rounds] = await Promise.all([
    listElectionsByIds(electionIds),
    listRoundsByIds(roundIds),
  ])

  const electionById = new Map(elections.map((election) => [election.id, election]))
  const roundById = new Map(rounds.map((round) => [round.id, round]))

  const items: VotingRecordListItem[] = records.map((record) => {
    const election = electionById.get(record.id_election)
    const round = roundById.get(record.id_round)

    return {
      id: record.id,
      electionName: election?.name ?? "—",
      roundNumber: round?.round_number ? String(round.round_number) : "—",
      cpf: record.cpf.trim() ? record.cpf : "Staff",
      ip: record.ip.trim() ? record.ip : "-",
    }
  })

  return { items, total }
}
