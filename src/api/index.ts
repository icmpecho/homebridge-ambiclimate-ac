import { AmbiClimateClient } from '../client';
import { AmbiClimateModeResponse } from './response/AmbiClimateModeResponse';
import { AmbiClimateSensorTemperatureResponse } from './response/AmbiClimateSensorTemperatureResponse';

export class AmbiClimateAPI {
  private client: AmbiClimateClient;

  constructor(client: AmbiClimateClient) {
    this.client = client;
  }

  async mode(
    locationName: string,
    roomName: string
  ): Promise<AmbiClimateModeResponse> {
    return this.client.get<AmbiClimateModeResponse>(
      '/device/mode',
      locationName,
      roomName
    );
  }

  async sensorTemperature(
    locationName: string,
    roomName: string
  ): Promise<number> {
    const result = await this.client.get<
      AmbiClimateSensorTemperatureResponse[]
    >('/device/sensor/temperature', locationName, roomName);
    return result[0].value;
  }

  async powerOff(locationName: string, roomName: string): Promise<void> {
    await this.client.set('/device/power/off', locationName, roomName, {});
  }

  async comfortMode(locationName: string, roomName: string): Promise<void> {
    await this.client.set('/device/mode/comfort', locationName, roomName, {});
  }

  async temperatureMode(
    locationName: string,
    roomName: string,
    targetTemperature: number
  ): Promise<void> {
    await this.client.set('/device/mode/temperature', locationName, roomName, {
      value: targetTemperature,
    });
  }
}
