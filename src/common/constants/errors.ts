export const USER_ERRORS = {
  NOT_FOUND: 'Foydalanuvchi topilmadi',
  ALREADY_EXISTS: 'Foydalanuvchi allaqachon mavjud',
  INVALID_CREDENTIALS: 'Noto‘g‘ri ma’lumotlar',
  NOT_ENOUGH_PRIVILEGES: 'Kirish uchun yetarli huquq yo‘q',
  FORBIDDEN: 'Ta’qiqlangan',
  INCORRECT_PASSWORD: 'Noto‘g‘ri joriy parol',
  EMAIL_VERIFICATION_TOKEN_INVALID: 'Токен подтверждения недействителен',
  EMAIL_ALREADY_VERIFIED: 'Email allaqachon tasdiqlangan',
  EMAIL_VERIFICATION_TOKEN_EXPIRED: 'Email tasdiqlash tokeni muddati o‘tgan',
};

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Noto‘g‘ri login yoki parol',
  USER_NOT_FOUND: 'Foydalanuvchi topilmadi',
  EMAIL_NOT_VERIFIED: 'Email tasdiqlanmagan',
  ACCOUNT_BLOCKED: 'Accaunt bloklangan',
  ACCOUNT_NOT_ACTIVE: 'Accaunt faol emas',
};
export const SESSION_ERRORS = {
  CREATE_FAILED: 'Не удалось создать сессию',
  FETCH_FAILED: 'Не удалось получить сессии пользователя',
  UPDATE_FAILED: 'Не удалось обновить сессию',
  DELETE_FAILED: 'Не удалось удалить сессию',
  SESSION_NOT_FOUND: 'Сессия не найдена или не принадлежит пользователю',
};
export const ACCESS_LOG_ERRORS = {
  NOT_FOUND: 'Kirish tarixi topilmadi',
  USER_NOT_AUTHORIZED: 'Foydalanuvchi avtorizatsiyadan o‘tmagan',
};
