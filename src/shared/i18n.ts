import enMessages from '../../_locales/en/messages.json';
import zhCNMessages from '../../_locales/zh_CN/messages.json';
import zhTWMessages from '../../_locales/zh_TW/messages.json';

type Messages = Record<string, { message: string; placeholders?: Record<string, { content: string }> }>;

const locales: Record<string, Messages> = {
  en: enMessages,
  zh_CN: zhCNMessages,
  zh_TW: zhTWMessages,
};

let currentLocale = 'en';

export function setLocale(locale: string): void {
  if (locale === 'auto') {
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh-TW') || browserLang.startsWith('zh-Hant')) {
      currentLocale = 'zh_TW';
    } else if (browserLang.startsWith('zh')) {
      currentLocale = 'zh_CN';
    } else {
      currentLocale = 'en';
    }
  } else if (locales[locale]) {
    currentLocale = locale;
  } else {
    currentLocale = 'en';
  }
}

export function getLocale(): string {
  return currentLocale;
}

export function t(key: string, ...substitutions: string[]): string {
  const messages = locales[currentLocale] || locales.en;
  const entry = messages[key] || locales.en[key];

  if (!entry) return key;

  let message = entry.message;

  // Replace $1, $2, etc. with substitutions
  substitutions.forEach((sub, i) => {
    message = message.replace(new RegExp(`\\$${i + 1}`, 'g'), sub);
  });

  // Also replace named placeholders like $COUNT$
  if (entry.placeholders) {
    for (const [name, placeholder] of Object.entries(entry.placeholders)) {
      const index = parseInt(placeholder.content.replace('$', ''), 10) - 1;
      if (substitutions[index] !== undefined) {
        message = message.replace(new RegExp(`\\$${name}\\$`, 'gi'), substitutions[index]);
      }
    }
  }

  return message;
}

// Initialize with browser default
setLocale('auto');
