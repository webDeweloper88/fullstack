import { RequestMetaData } from 'src/access-log/types/request-meta.type';
import { UAParser } from 'ua-parser-js';

export function parseUserAgent(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();

  let osName = os.name ?? 'Unknown OS';
  let osVersion = os.version ?? '';

  // Обработка NT 10.0 для Windows 10 и 11
  if (osName === 'Windows' && osVersion.startsWith('10')) {
    osName = 'Windows 10/11';
  }

  const browserName = browser.name ?? 'Browser';
  const browserVersion = browser.version ?? '';

  return `${osName} ${osVersion} · ${browserName} ${browserVersion}`.trim();
}

export function parseClientFromUserAgent(
  userAgent: string,
): RequestMetaData['client'] {
  const ua = new UAParser(userAgent);
  const deviceType = ua.getDevice().type;
  const osName = ua.getOS().name?.toLowerCase() || '';

  if (deviceType === 'mobile') {
    return osName.includes('android') ? 'android' : 'ios';
  }

  if (deviceType === 'tablet') {
    return 'mobile';
  }

  if (
    osName.includes('windows') ||
    osName.includes('mac') ||
    osName.includes('linux')
  ) {
    return 'desktop';
  }

  return 'web';
}
