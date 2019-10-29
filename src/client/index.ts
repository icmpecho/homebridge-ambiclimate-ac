import { AmbiClimateClientConfig } from './AmbiClimateClientConfig';
import { AmbiClimateOauthResponse } from './response/AmbiClimateOauthResponse';
import { AmbiClimateModeResponse } from './response/AmbiClimateModeResponse';
import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'https://api.ambiclimate.com';
const DEFAULT_REDIRECT_URL = 'https://httpbin.org/get';
enum GrantType {
  AUTHORIZATION_CODE = 'authorization_code',
  REFRESH_TOKEN = 'refresh_token',
}

export class AmbiClimateClient {
  private config: AmbiClimateClientConfig;
  private accessToken: String | null;
  private axios: AxiosInstance;

  constructor(
    config: AmbiClimateClientConfig,
    axiosInstance: AxiosInstance = axios.create()
  ) {
    this.config = config;
    this.accessToken = null;
    this.axios = axiosInstance;
    this.axios.interceptors.response.use(undefined, async err => {
      if (
        err.response.status === 401 &&
        err.config &&
        !err.config.__isRetryRequest
      ) {
        await this.refreshAccessToken();
        err.config.headers.Authorization = `Bearer ${this.accessToken}`;
        err.config.__isRetryRequest = true;
        return await this.axios(err.config);
      }
      throw err;
    });
  }

  async refreshAccessToken(): Promise<void> {
    const OAUTH_URL = `${BASE_URL}/oauth2/token`;
    const response = await this.axios.get<AmbiClimateOauthResponse>(OAUTH_URL, {
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

  async request<T>(url: string, data: any): Promise<T> {
    const response = await this.axios.get<T>(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      data,
    });
    return response.data;
  }

  async mode(
    locationName: String,
    roomName: String
  ): Promise<AmbiClimateModeResponse> {
    const MODE_URL = `${BASE_URL}/api/v1/device/mode`;
    return this.request<AmbiClimateModeResponse>(MODE_URL, {
      room_name: roomName,
      location_name: locationName,
    });
  }
}
