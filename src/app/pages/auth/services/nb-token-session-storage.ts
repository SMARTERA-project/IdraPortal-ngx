import { Injectable } from '@angular/core';
import { NbAuthToken, NbAuthTokenParceler, NbTokenStorage } from '@nebular/auth';

/**
 * Stores the Nebular auth token (access + refresh + id token) in sessionStorage
 * instead of the default localStorage. The token is therefore cleared when the
 * tab closes and is not persisted across browser sessions, shrinking the window
 * in which an XSS payload could exfiltrate the long-lived refresh token.
 *
 * Provided in AppModule via { provide: NbTokenStorage, useClass: ... }.
 */
@Injectable()
export class NbTokenSessionStorage extends NbTokenStorage {

  // Same key the default NbTokenLocalStorage uses.
  protected key = 'auth_app_token';

  constructor(private parceler: NbAuthTokenParceler) {
    super();
  }

  get(): NbAuthToken {
    const raw = sessionStorage.getItem(this.key);
    return this.parceler.unwrap(raw);
  }

  set(token: NbAuthToken): void {
    const raw = this.parceler.wrap(token);
    sessionStorage.setItem(this.key, raw);
  }

  clear(): void {
    sessionStorage.removeItem(this.key);
  }
}
