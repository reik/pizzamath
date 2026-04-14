export type Role = 'user' | 'admin'

export interface Subscription {
  status: 'active' | 'inactive' | 'trial'
  plan: 'monthly' | 'annual' | null
  expiresAt: string | null
}

export type AccountStatus = 'active' | 'suspended'

export interface User {
  id: string
  email: string
  role: Role
  accountStatus: AccountStatus
  subscription: Subscription
  createdAt: string
}
