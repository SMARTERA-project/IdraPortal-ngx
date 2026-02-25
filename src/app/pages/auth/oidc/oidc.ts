import {
    NbAuthOAuth2JWTToken
} from '@nebular/auth';

export interface UserClaims {
    email: string;
    email_verified: boolean;
    family_name?: string;
    given_name?: string;
    locale?: string;
    name: string;
    preferred_username: string;
    picture: string;
    sub: string;
    updated_at: string;
    roles: string[];
    realm_access: RealmAccess;
}

export interface RealmAccess {
    roles: string[];
}

export interface OidcToken {
    user: UserClaims;
    id_token: string;
    access_token: string;
}

export class OidcJWTToken extends NbAuthOAuth2JWTToken {
    // let's rename it to exclude name clashes
    static NAME = 'nb:auth:oidc:token';

    declare protected readonly token: OidcToken | string | undefined;

    getValue(): string {
        const rawToken = this.token as any;
        if (typeof rawToken === 'string') {
            return rawToken;
        }
        if (rawToken && typeof rawToken === 'object' && rawToken.access_token) {
            return rawToken.access_token;
        }
        return super.getValue();
    }
}
