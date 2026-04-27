import { supabaseHttp } from "@/services/supabaseHttp"
import type { Member } from "@/types/member"

type MemberRow = Record<string, unknown>

export async function findMemberByCpf(cpf: string) {
  const response = await supabaseHttp.get<MemberRow[]>("/members", {
    params: {
      select: "*",
      cpf: `eq.${cpf}`,
      limit: 1,
    },
  })

  const [firstMember] = response.data
  return firstMember ?? null
}

type MemberApi = Omit<Member, "cpf"> & { cpf: string | number | null }

function normalizeMember(member: MemberApi): Member {
  return {
    id: String(member.id),
    cpf: member.cpf ? String(member.cpf) : "",
    name: String(member.name ?? ""),
    status: String(member.status ?? ""),
  }
}

export async function listActiveMembers() {
  const response = await supabaseHttp.get<MemberApi[]>("/members", {
    params: {
      select: "id,cpf,name,status",
      status: "eq.ACTIVE",
      order: "name.asc",
    },
  })

  return response.data.map(normalizeMember)
}
