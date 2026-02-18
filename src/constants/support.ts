export const SUPPORT_CATEGORIES: Record<string, string> = {
  billing: 'Billing & Payments',
  technical: 'Technical Issue',
  feature: 'Feature Request',
  account: 'Account Management',
  security: 'Security',
  other: 'Other',
}

export const getCategoryLabel = (key: string | undefined): string => {
  if (!key) return 'Unspecified'
  return SUPPORT_CATEGORIES[key] || key
}