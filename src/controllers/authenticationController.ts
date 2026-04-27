import type { AuthenticatedUser } from "@/types/authUser"
import { findMemberByCpf } from "@/services/membersService"
import { findUserByKeypass } from "@/services/usersService"
import { getBestNameFromRow, getFirstNameFromName } from "@/lib/personName"

export async function authenticateKeypassUser(
  keypass: string,
): Promise<AuthenticatedUser> {
  const user = await findUserByKeypass(keypass)
  if (!user) throw new Error("Invalid access key")

  const name = user.name ?? undefined
  const firstName = name ? getFirstNameFromName(name) ?? undefined : undefined

  if (user.rule === "Owner") {
    return {
      accessType: "owner",
      hasAuthentication: true,
      userId: user.id,
      ownerUserId: user.id,
      name,
      firstName,
    }
  }

  if (user.rule === "Staff") {
    return {
      accessType: "staff",
      hasAuthentication: false,
      userId: user.id,
      name,
      firstName,
    }
  }

  throw new Error("Invalid access key")
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
