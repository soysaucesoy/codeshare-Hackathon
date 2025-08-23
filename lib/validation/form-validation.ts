// lib/validation/form-validation.ts - バリデーション関数
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password) {
    return { isValid: false, message: 'パスワードは必須です' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'パスワードは6文字以上で入力してください' };
  }
  
  return { isValid: true };
};

export const validatePasswordConfirmation = (password: string, confirmPassword: string): { isValid: boolean; message?: string } => {
  if (!confirmPassword) {
    return { isValid: false, message: 'パスワード確認は必須です' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, message: 'パスワードが一致しません' };
  }
  
  return { isValid: true };
};