import { supabaseHttp } from "@/services/supabaseHttp"

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

