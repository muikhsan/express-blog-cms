import { UAParser } from 'ua-parser-js';
import { Request } from 'express';

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os?: string;
  browser?: string;
}

export const getClientIP = (req: Request): string => {
  // Check for IP in various headers (proxy, load balancer, etc.)
  const xForwardedFor = req.headers['x-forwarded-for'];
  const xRealIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare

  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    return ips.split(',')[0].trim();
  }

  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  }

  if (cfConnectingIp) {
    return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
  }

  // Fallback to connection remote address
  return req.socket.remoteAddress || req.connection?.remoteAddress || 'unknown';
};

export const parseDeviceInfo = (userAgent: string): DeviceInfo => {
  try {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Determine device type
    let deviceType: DeviceInfo['type'] = 'unknown';

    if (result.device.type === 'mobile') {
      deviceType = 'mobile';
    } else if (result.device.type === 'tablet') {
      deviceType = 'tablet';
    } else if (result.device.type === undefined && result.os.name) {
      // If no device type but has OS, likely desktop
      deviceType = 'desktop';
    }

    return {
      type: deviceType,
      os: result.os.name ? `${result.os.name} ${result.os.version || ''}`.trim() : undefined,
      browser: result.browser.name ? `${result.browser.name} ${result.browser.version || ''}`.trim() : undefined
    };
  } catch (error) {
    console.error('Error parsing user agent:', error);
    return {
      type: 'unknown'
    };
  }
};

export const getDeviceAndIP = (req: Request) => {
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = getClientIP(req);
  const deviceInfo = parseDeviceInfo(userAgent);

  return {
    ipAddress,
    userAgent,
    device: deviceInfo
  };
};
