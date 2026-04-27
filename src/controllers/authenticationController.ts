import type { AuthenticatedUser } from "@/types/authUser"
import { findUserIdByKeypass } from "@/services/usersService"

export async function authenticateOwner(keypass: string): Promise<AuthenticatedUser> {
  const ownerUserId = await findUserIdByKeypass(keypass)
  if (!ownerUserId) {
    throw new Error("Invalid access key")
  }

  return {
    accessType: "owner",
    hasAuthentication: true,
    ownerUserId,
  }
}

export function createMemberUser(cpf: string): AuthenticatedUser {
  return {
    accessType: "member",
    hasAuthentication: false,
    cpf,
  }
}

