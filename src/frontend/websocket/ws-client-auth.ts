import { jwtDecode } from 'jwt-decode';
import { genericEndpoints } from '../core/endpoints.ts';
import { WsJwtToken } from '../../shared/types/wss-types.ts';

const WS_TOKEN_NAME = 'WS_JWT_TOKEN';

export class WsClientAuthImpl {
  async getToken(): Promise<string> {
    let token = localStorage.getItem(WS_TOKEN_NAME);

    if (token && !this.isTokenExpired(token)) {
      return token;
    } else {
      return await genericEndpoints.wsToken.send({}).then(response => {
        localStorage.setItem(WS_TOKEN_NAME, response.token);
        return token;
      });
    }
  }

  private isTokenExpired(token: string) {
    try {
      const decodedToken: WsJwtToken = jwtDecode(token);
      const currentTime = new Date().getTime() / 1000 | 0;
      return decodedToken.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }
}

export const WsClientAuth = new WsClientAuthImpl();

(<any> window).WsClientAuth = WsClientAuth;
