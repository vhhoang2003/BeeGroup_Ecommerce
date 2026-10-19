/**
 * Mirrors the API's password policy (AUTH-03: 8-72 characters, a letter and a digit, not the email) so most mistakes
 * are caught before the request. The API also rejects the 10k most common passwords; that message comes back from it.
 */
export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < 8 || password.length > 72) return 'Mật khẩu cần 8-72 ký tự.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Mật khẩu cần có cả chữ và số.';
  if (email && password.toLowerCase() === email.trim().toLowerCase()) return 'Mật khẩu không được trùng email.';
  return null;
}
