import { Injectable } from '@angular/core';

/**
 * Runtime configuration read synchronously from window.__env (assets/env.js).
 *
 * In Docker, env.js is regenerated at container startup from the PORTAL_*
 * environment variables; in dev, src/assets/env.js ships localhost defaults.
 * Replaces the former ngx-config-json ConfigService (assets/config.json):
 * the `config` property keeps the same keys, so consumers are unchanged.
 *
 * Values coming from environment variables are strings: booleans and the
 * languages list are normalized here so consumers always get proper types.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  readonly config: Record<string, any>;

  private static readonly BOOLEAN_KEYS = [
    'enableAuthentication',
    'enable_datalet',
    'idra.orion.manager.url',
  ];

  constructor() {
    const env = (typeof window !== 'undefined' && (window as any).__env) || {};
    this.config = { ...env };
    this.config['languages'] = AppConfigService.toArray(this.config['languages']);
    for (const key of AppConfigService.BOOLEAN_KEYS) {
      this.config[key] = AppConfigService.toBool(this.config[key]);
    }
  }

  private static toArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
    }
    return [];
  }

  private static toBool(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    return typeof value === 'string' && value.trim().toLowerCase() === 'true';
  }
}
