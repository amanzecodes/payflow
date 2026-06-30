const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NIGERIAN_LOCAL_PHONE_PATTERN = /^[0-9]{10}$/;

export interface LoginFormValues {
  phone: string;
  password: string;
}

export interface RegisterFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export const validateLoginForm = (values: LoginFormValues): string | null => {
  if (!values.phone) return "Please enter your phone number";
  if (!NIGERIAN_LOCAL_PHONE_PATTERN.test(values.phone)) return "Enter a valid 10-digit phone number";
  if (!values.password) return "Please enter your password";
  if (values.password.length < 6) return "Password must be at least 6 characters";
  return null;
};

export const validateRegisterForm = (values: RegisterFormValues): string | null => {
  if (!values.name || values.name.trim().length < 2) return "Name must be at least 2 characters";
  if (!values.email) return "Please enter your email";
  if (!EMAIL_PATTERN.test(values.email)) return "Enter a valid email address";
  if (!values.phone) return "Please enter your phone number";
  if (!NIGERIAN_LOCAL_PHONE_PATTERN.test(values.phone)) return "Enter a valid 10-digit phone number";
  if (!values.password) return "Please enter a password";
  if (values.password.length < 8) return "Password must be at least 8 characters";
  return null;
};
