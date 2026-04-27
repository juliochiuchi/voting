export type UserAccessType = "owner" | "member" | "staff"

export type AuthenticatedUser = {
  accessType: UserAccessType
  hasAuthentication: boolean
  name?: string
  firstName?: string
  cpf?: string
  userId?: string
  ownerUserId?: string
}
