import { DEFAULT_PASSWORD_POLICY, type PasswordPolicy } from './validation'

export interface PasswordPolicyResponse extends PasswordPolicy {
  checklist?: string[]
}

export const normalizePasswordPolicy = (policy?: Partial<PasswordPolicyResponse> | null): PasswordPolicyResponse => ({
  minLength: Math.min(Math.max(Number(policy?.minLength) || DEFAULT_PASSWORD_POLICY.minLength, 8), 128),
  requireUppercase: Boolean(policy?.requireUppercase),
  requireLowercase: Boolean(policy?.requireLowercase),
  requireNumber: Boolean(policy?.requireNumber),
  requireSpecialCharacter: Boolean(policy?.requireSpecialCharacter),
  checklist: Array.isArray(policy?.checklist) ? policy.checklist : undefined,
})
