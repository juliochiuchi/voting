import type { AuthenticatedUser } from "@/types/authUser"
import { findMemberByCpf } from "@/services/membersService"
import { findUserByKeypass } from "@/services/usersService"
import { getBestNameFromRow, getFirstNameFromName } from "@/lib/personName"

export async function authenticateOwner(keypass: string): Promise<AuthenticatedUser> {
  const ownerUser = await findUserByKeypass(keypass)
  if (!ownerUser) {
    throw new Error("Invalid access key")
  }

  return {
    accessType: "owner",
    hasAuthentication: true,
    ownerUserId: ownerUser.id,
    name: ownerUser.name ?? undefined,
  }
}

export async function getMemberIdentityByCpf(cpf: string) {
  const member = await findMemberByCpf(cpf)
  if (!member) return null

  const name = getBestNameFromRow(member)
  const firstName = name ? getFirstNameFromName(name) : null

  return {
    name,
    firstName,
  }
}

export function createMemberUser({
  cpf,
  name,
  firstName,
}: {
  cpf: string
  name?: string | null
  firstName?: string | null
}): AuthenticatedUser {
  return {
    accessType: "member",
    hasAuthentication: false,
    cpf,
    name: name ?? undefined,
    firstName: firstName ?? undefined,
  }
}
