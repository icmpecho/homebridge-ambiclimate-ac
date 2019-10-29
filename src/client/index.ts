import { AmbiClimateClientConfig } from './AmbiClimateClientConfig';
import { AmbiClimateOauthResponse } from './AmbiClimateOauthResponse';
import axios from 'axios';

const OAUTH_BASE_URL = 'https://api.ambiclimate.com/oauth2/token';
const DEFAULT_REDIRECT_URL = 'https://httpbin.org/get';
enum GrantType {
  AUTHORIZATION_CODE = 'authorization_code',
  REFRESH_TOKEN = 'refresh_token',
}

export class AmbiClimateClient {
  private config: AmbiClimateClientConfig;
  private accessToken: String | null;

  constructor(config: AmbiClimateClientConfig) {
    this.config = config;
    this.accessToken = null;
  }

  async refreshAccessToken(): Promise<void> {
    const response = await axios.get<AmbiClimateOauthResponse>(OAUTH_BASE_URL, {
      params: {
        client_id: this.config.clientID,
        client_secret: this.config.clientSecret,
        redirect_uri: DEFAULT_REDIRECT_URL,
        refresh_token: this.config.refreshToken,
        grant_type: GrantType.REFRESH_TOKEN,
      },
    });
    this.accessToken = response.data.access_token;
  }

  printAccessToken() {
    console.log(this.accessToken);
  }
}
