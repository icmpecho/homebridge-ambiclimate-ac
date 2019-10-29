import { AmbiClimateClientConfig } from './AmbiClimateClientConfig';
import { AmbiClimateOauthResponse } from './response/AmbiClimateOauthResponse';
import { AmbiClimateModeResponse } from './response/AmbiClimateModeResponse';
import axios from 'axios';

const BASE_URL = 'https://api.ambiclimate.com';
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
    const OAUTH_URL = `${BASE_URL}/oauth2/token`;
    const response = await axios.get<AmbiClimateOauthResponse>(OAUTH_URL, {
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

  async mode(
    locationName: String,
    roomName: String
  ): Promise<AmbiClimateModeResponse> {
    const MODE_URL = `${BASE_URL}/api/v1/device/mode`;
    const response = await axios.get<AmbiClimateModeResponse>(MODE_URL, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      data: {
        room_name: roomName,
        location_name: locationName,
      },
    });
    return response.data;
  }

  printAccessToken() {
    console.log(this.accessToken);
  }
}
