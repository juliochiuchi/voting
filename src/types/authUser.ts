export type UserAccessType = "owner" | "member"

export type AuthenticatedUser = {
  accessType: UserAccessType
  hasAuthentication: boolean
  name?: string
  firstName?: string
  cpf?: string
  ownerUserId?: string
}
