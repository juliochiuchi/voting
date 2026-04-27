import { supabaseHttp } from "@/services/supabaseHttp"
import { buildRangeHeaders, getTotalFromContentRange } from "@/services/postgrestPagination"
import type { Member } from "@/types/member"
import type { PaginatedResult } from "@/types/pagination"

type MemberApi = Omit<Member, "cpf"> & { cpf: string | number | null }

function normalizeMember(member: MemberApi): Member {
  return {
    id: String(member.id),
    cpf: member.cpf ? String(member.cpf) : "",
    name: String(member.name ?? ""),
    status: String(member.status ?? ""),
  }
}

export async function listMembersForAdmin({
  page,
  pageSize,
  nameFilter,
  cpfFilter,
}: {
  page: number
  pageSize: number
  nameFilter?: string
  cpfFilter?: string
}): Promise<PaginatedResult<Member>> {
  const { headers } = buildRangeHeaders({ page, pageSize })

  const response = await supabaseHttp.get<MemberApi[]>("/members", {
    params: {
      select: "id,cpf,name,status",
      ...(nameFilter ? { name: `ilike.*${nameFilter.trim()}*` } : {}),
      ...(cpfFilter ? { cpf: `ilike.*${cpfFilter.trim()}*` } : {}),
      order: "name.asc",
    },
    headers,
  })

  const total = getTotalFromContentRange(response.headers["content-range"]) ?? 0
  const items = response.data.map(normalizeMember)

  return { items, total }
}

export async function createMemberForAdmin(input: Omit<Member, "id">) {
  const response = await supabaseHttp.post<MemberApi[]>("/members", [input], {
    headers: {
      Prefer: "return=representation",
    },
  })

  const [created] = response.data
  return created ? normalizeMember(created) : null
}

export async function updateMemberForAdmin(id: string, input: Partial<Omit<Member, "id">>) {
  const response = await supabaseHttp.patch<MemberApi[]>("/members", input, {
    params: {
      id: `eq.${id}`,
    },
    headers: {
      Prefer: "return=representation",
    },
  })

  const [updated] = response.data
  return updated ? normalizeMember(updated) : null
}

export async function deleteMemberForAdmin(id: string) {
  await supabaseHttp.delete("/members", {
    params: {
      id: `eq.${id}`,
    },
  })
}

