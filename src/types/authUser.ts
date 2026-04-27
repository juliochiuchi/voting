export type UserAccessType = "owner" | "member"

export type AuthenticatedUser = {
  accessType: UserAccessType
  hasAuthentication: boolean
  cpf?: string
  ownerUserId?: string
}

