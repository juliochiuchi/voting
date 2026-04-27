import { supabaseHttp } from "@/services/supabaseHttp"

type SupabaseUserRow = {
  id: string
  name?: string | null
}

export async function findUserByKeypass(keypass: string) {
  const response = await supabaseHttp.get<SupabaseUserRow[]>("/users", {
    params: {
      select: "id,name",
      keypass: `eq.${keypass}`,
      limit: 1,
    },
  })

  const [firstUser] = response.data
  return firstUser ?? null
}
