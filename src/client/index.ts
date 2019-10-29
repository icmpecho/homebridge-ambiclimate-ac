import { AmbiClimateClientConfig } from './AmbiClimateClientConfig';
import { AmbiClimateOauthResponse } from './response/AmbiClimateOauthResponse';
import { AmbiClimateSetResponse } from './response/AmbiClimateSetResponse';
import { AmbiClimateModeResponse } from './response/AmbiClimateModeResponse';
import { AmbiClimateSensorTemperatureResponse } from './response/AmbiClimateSensorTemperatureResponse';
import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'https://api.ambiclimate.com';
const API_V1_URL = `${BASE_URL}/api/v1`;
const DEFAULT_REDIRECT_URL = 'https://httpbin.org/get';
enum GrantType {
  AUTHORIZATION_CODE = 'authorization_code',
  REFRESH_TOKEN = 'refresh_token',
}

export class AmbiClimateClient {
  private config: AmbiClimateClientConfig;
  private accessToken: string | null;
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

  async get<T>(
    path: string,
    locationName: string,
    roomName: string
  ): Promise<T> {
    return this.request<T>(`${API_V1_URL}${path}`, {
      room_name: roomName,
      location_name: locationName,
    });
  }

  async set(
    path: string,
    locationName: string,
    roomName: string,
    data: any
  ): Promise<void> {
    const result = await this.request<AmbiClimateSetResponse[]>(
      `${API_V1_URL}${path}`,
      {
        room_name: roomName,
        location_name: locationName,
        ...data,
      }
    );
    if (result[0].status !== 'ok') {
      throw new Error(`SET ${path} failed!: ${JSON.stringify(result)}`);
    }
  }

  async mode(
    locationName: string,
    roomName: string
  ): Promise<AmbiClimateModeResponse> {
    return this.get<AmbiClimateModeResponse>(
      '/device/mode',
      locationName,
      roomName
    );
  }

  async sensorTemperature(
    locationName: string,
    roomName: string
  ): Promise<number> {
    const result = await this.get<AmbiClimateSensorTemperatureResponse[]>(
      '/device/sensor/temperature',
      locationName,
      roomName
    );
    return result[0].value;
  }

  async powerOff(locationName: string, roomName: string): Promise<void> {
    await this.set('/device/power/off', locationName, roomName, {});
  }
}
