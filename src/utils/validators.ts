export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

export function validatePin(pin: string): string | null {
  if (!pin) return 'PIN is required';
  if (!/^\d{4,6}$/.test(pin)) return 'PIN must be 4 or 6 digits';
  return null;
}

export function validateMobile(mobile: string): string | null {
  if (!mobile) return 'Mobile number is required';
  if (!/^01\d{9}$/.test(mobile)) return 'Mobile must be 11 digits starting with 01';
  return null;
}

export function validateNID(nid: string): string | null {
  if (!nid) return 'NID number is required';
  if (!/^\d{10,17}$/.test(nid)) return 'NID must be 10-17 digits';
  return null;
}

export function validateAge(dob: string): string | null {
  if (!dob) return 'Date of birth is required';
  const birth = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  const actualAge = m < 0 || (m === 0 && today.getDate() < birth.getDate()) ? age - 1 : age;
  if (actualAge < 18) return 'You must be at least 18 years old';
  return null;
}

export function validateAmount(amount: string, balance?: number): string | null {
  const num = parseFloat(amount);
  if (!amount || isNaN(num)) return 'Amount is required';
  if (num <= 0) return 'Amount must be greater than 0';
  if (balance !== undefined && num > balance) return 'Insufficient balance';
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim() === '') return `${fieldName} is required`;
  return null;
}
