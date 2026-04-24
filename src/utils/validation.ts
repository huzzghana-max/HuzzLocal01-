const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumber: boolean
  requireSpecialCharacter: boolean
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: false,
  requireLowercase: false,
  requireNumber: false,
  requireSpecialCharacter: false,
}

export const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

export const normalizeEmail = (value: string) => value.trim().toLowerCase()

const isBlank = (value: string) => normalizeWhitespace(value).length === 0

export interface ValidationResult<T> {
  errors: Partial<Record<keyof T, string>>
  values: T
  isValid: boolean
}

export interface AuthSignupValues {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: string
}

export interface AuthSigninValues {
  email: string
  password: string
}

export interface ContactFormValues {
  name: string
  email: string
  message: string
}

export interface SupportTicketValues {
  category_id: string
  subject: string
  description: string
  priority: string
}

export interface SupportReplyValues {
  message: string
}

export interface ReviewValues {
  rating: number | null
  comment: string
}

export const getPasswordPolicyChecklist = (policy: PasswordPolicy) => {
  const checklist = [`At least ${policy.minLength} characters`]

  if (policy.requireUppercase) checklist.push('At least one uppercase letter')
  if (policy.requireLowercase) checklist.push('At least one lowercase letter')
  if (policy.requireNumber) checklist.push('At least one number')
  if (policy.requireSpecialCharacter) checklist.push('At least one special character')

  return checklist
}

export const validatePasswordAgainstPolicy = (password: string, policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): string => {
  if (!password) {
    return 'Password is required.'
  }
  if (password.length < policy.minLength) {
    return `Password must be at least ${policy.minLength} characters.`
  }
  if (password.length > 128) {
    return 'Password must be 128 characters or fewer.'
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.'
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.'
  }
  if (policy.requireNumber && !/\d/.test(password)) {
    return 'Password must include at least one number.'
  }
  if (policy.requireSpecialCharacter && !/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character.'
  }

  return ''
}

export const validateSignUp = (
  values: AuthSignupValues,
  passwordPolicy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
): ValidationResult<AuthSignupValues> => {
  const normalizedValues = {
    ...values,
    name: normalizeWhitespace(values.name),
    email: normalizeEmail(values.email),
  }
  const errors: ValidationResult<AuthSignupValues>['errors'] = {}

  if (isBlank(normalizedValues.name)) {
    errors.name = 'Full name is required.'
  } else if (normalizedValues.name.length < 2) {
    errors.name = 'Full name must be at least 2 characters.'
  } else if (normalizedValues.name.length > 80) {
    errors.name = 'Full name must be 80 characters or fewer.'
  }

  if (!normalizedValues.email) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_REGEX.test(normalizedValues.email)) {
    errors.email = 'Enter a valid email address.'
  } else if (normalizedValues.email.length > 120) {
    errors.email = 'Email must be 120 characters or fewer.'
  }

  const passwordError = validatePasswordAgainstPolicy(values.password, passwordPolicy)
  if (passwordError) errors.password = passwordError

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return { errors, values: normalizedValues, isValid: Object.keys(errors).length === 0 }
}

export const validateSignIn = (values: AuthSigninValues): ValidationResult<AuthSigninValues> => {
  const normalizedValues = {
    ...values,
    email: normalizeEmail(values.email),
  }
  const errors: ValidationResult<AuthSigninValues>['errors'] = {}

  if (!normalizedValues.email) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_REGEX.test(normalizedValues.email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  }

  return { errors, values: normalizedValues, isValid: Object.keys(errors).length === 0 }
}

export const validateContactForm = (values: ContactFormValues): ValidationResult<ContactFormValues> => {
  const normalizedValues = {
    ...values,
    name: normalizeWhitespace(values.name),
    email: normalizeEmail(values.email),
    message: values.message.trim(),
  }
  const errors: ValidationResult<ContactFormValues>['errors'] = {}

  if (isBlank(normalizedValues.name)) {
    errors.name = 'Name is required.'
  } else if (normalizedValues.name.length < 2) {
    errors.name = 'Name must be at least 2 characters.'
  } else if (normalizedValues.name.length > 80) {
    errors.name = 'Name must be 80 characters or fewer.'
  }

  if (!normalizedValues.email) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_REGEX.test(normalizedValues.email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!normalizedValues.message) {
    errors.message = 'Message is required.'
  } else if (normalizedValues.message.length < 10) {
    errors.message = 'Message must be at least 10 characters.'
  } else if (normalizedValues.message.length > 2000) {
    errors.message = 'Message must be 2000 characters or fewer.'
  }

  return { errors, values: normalizedValues, isValid: Object.keys(errors).length === 0 }
}

export const validateSupportTicket = (values: SupportTicketValues): ValidationResult<SupportTicketValues> => {
  const normalizedValues = {
    ...values,
    category_id: String(values.category_id).trim(),
    subject: normalizeWhitespace(values.subject),
    description: values.description.trim(),
  }
  const errors: ValidationResult<SupportTicketValues>['errors'] = {}

  if (!normalizedValues.category_id) {
    errors.category_id = 'Category is required.'
  }

  if (!normalizedValues.subject) {
    errors.subject = 'Subject is required.'
  } else if (normalizedValues.subject.length < 5) {
    errors.subject = 'Subject must be at least 5 characters.'
  } else if (normalizedValues.subject.length > 120) {
    errors.subject = 'Subject must be 120 characters or fewer.'
  }

  if (!normalizedValues.description) {
    errors.description = 'Description is required.'
  } else if (normalizedValues.description.length < 20) {
    errors.description = 'Description must be at least 20 characters.'
  } else if (normalizedValues.description.length > 4000) {
    errors.description = 'Description must be 4000 characters or fewer.'
  }

  return { errors, values: normalizedValues, isValid: Object.keys(errors).length === 0 }
}

export const validateSupportReply = (values: SupportReplyValues): ValidationResult<SupportReplyValues> => {
  const normalizedValues = {
    ...values,
    message: values.message.trim(),
  }
  const errors: ValidationResult<SupportReplyValues>['errors'] = {}

  if (!normalizedValues.message) {
    errors.message = 'Message is required.'
  } else if (normalizedValues.message.length < 2) {
    errors.message = 'Message must be at least 2 characters.'
  } else if (normalizedValues.message.length > 2000) {
    errors.message = 'Message must be 2000 characters or fewer.'
  }

  return { errors, values: normalizedValues, isValid: Object.keys(errors).length === 0 }
}

export const validateReview = (values: ReviewValues): ValidationResult<ReviewValues> => {
  const normalizedValues = {
    ...values,
    comment: values.comment.trim(),
  }
  const errors: ValidationResult<ReviewValues>['errors'] = {}

  if (normalizedValues.rating == null) {
    errors.rating = 'Please provide a rating.'
  } else if (!Number.isInteger(normalizedValues.rating) || normalizedValues.rating < 1 || normalizedValues.rating > 5) {
    errors.rating = 'Rating must be a whole number between 1 and 5.'
  }

  if (normalizedValues.comment.length > 1000) {
    errors.comment = 'Comment must be 1000 characters or fewer.'
  }

  return { errors, values: normalizedValues, isValid: Object.keys(errors).length === 0 }
}
