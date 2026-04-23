const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

export const validateSignUp = (values: AuthSignupValues): ValidationResult<AuthSignupValues> => {
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

  if (!values.password) {
    errors.password = 'Password is required.'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  } else if (values.password.length > 128) {
    errors.password = 'Password must be 128 characters or fewer.'
  }

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
