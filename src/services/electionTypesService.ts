import { supabaseHttp } from "@/services/supabaseHttp"
import type { ElectionType } from "@/types/electionType"

export async function listElectionTypes() {
  const response = await supabaseHttp.get<Array<{ id: string | number; type: string }>>(
    "/types_election",
    {
    params: {
      select: "id,type",
      order: "type.asc",
    },
    },
  )

  return response.data.map((item) => ({
    id: String(item.id),
    type: item.type,
  })) satisfies ElectionType[]
}
