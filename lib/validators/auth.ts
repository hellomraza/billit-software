export function validateEmail(email: string): string | null {
  if (!email) return "Email is required.";
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return "Invalid email address.";
  return null;
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!password) {
    errors.push("Password is required.");
  } else {
    if (password.length < 8) errors.push("Must be at least 8 characters long.");
    // We can add more complexity rules if needed
  }
  return { valid: errors.length === 0, errors };
}
