export interface SendMailOptions {
  to: string;
  subject: string;
  templateName: string; // название шаблона без .hbs
  context: Record<string, any>;
}
// Пример использования:
