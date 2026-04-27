import { supabaseHttp } from "@/services/supabaseHttp"

type SupabaseUserRow = {
  id: string
}

export async function findUserIdByKeypass(keypass: string) {
  const response = await supabaseHttp.get<SupabaseUserRow[]>("/users", {
    params: {
      select: "id",
      keypass: `eq.${keypass}`,
      limit: 1,
    },
  })

  const [firstUser] = response.data
  return firstUser?.id ?? null
}

