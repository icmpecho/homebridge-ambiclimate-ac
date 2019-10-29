import { callbackify } from 'util';
import { AmbiClimateClient } from './client';
import { AmbiClimateAPI } from './api';
import { Mode } from './api/response/AmbiClimateModeResponse';

const DEFAULT_TARGET_TEMPERATURE = 25;

export default (homebridge: any) => {
  const Service = homebridge.hap.Service;
  const Characteristic = homebridge.hap.Characteristic;

  class AmbiClimateAC {
    private api: AmbiClimateAPI;
    private log: (msg: string) => void;
    private acService: any;
    private locationName: string;
    private roomName: string;
    private targetTemperature: number | null;

    constructor(log: (msg: string) => void, config: any) {
      this.log = log;
      this.log('Initializing AmbiClimateAC...');
      this.targetTemperature = null;
      this.locationName = config.locationName;
      this.roomName = config.roomName;
      const client = new AmbiClimateClient({
        clientID: config.clientID,
        clientSecret: config.clientSecret,
        refreshToken: config.refreshToken,
      });
      this.api = new AmbiClimateAPI(client);
      this.acService = new Service.Thermostat(config.name);
      this.initialServices();
      this.log('Done!');
    }

    private initialServices() {
      this.acService
        .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .on('get', callbackify(this.getCurrentHeatingCoolingState.bind(this)));

      this.acService
        .getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .setProps({
          validValues: [0, 2],
        })
        .on('get', callbackify(this.getTargetHeatingCoolingState.bind(this)))
        .on('set', callbackify(this.setTargetHeatingCoolingState.bind(this)));

      this.acService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', callbackify(this.getCurrentTemperature.bind(this)));

      this.acService
        .getCharacteristic(Characteristic.TargetTemperature)
        .setProps({
          minStep: 1,
        })
        .on('get', callbackify(this.getTargetTemperature.bind(this)))
        .on('set', callbackify(this.setTargetTemperature.bind(this)));

      this.acService.setCharacteristic(
        Characteristic.TemperatureDisplayUnits,
        Characteristic.TemperatureDisplayUnits.CELSIUS
      );
    }

    async getCurrentHeatingCoolingState(): Promise<any> {
      const result = await this.api.mode(this.locationName, this.roomName);
      this.targetTemperature = result.value || this.targetTemperature;
      switch (result.mode) {
        case Mode.MANUAL:
        case Mode.OFF:
          return Characteristic.CurrentHeatingCoolingState.OFF;
        default:
          return Characteristic.CurrentHeatingCoolingState.COOL;
      }
    }

    async getTargetHeatingCoolingState(): Promise<any> {
      const result = await this.api.mode(this.locationName, this.roomName);
      this.targetTemperature = result.value || this.targetTemperature;
      switch (result.mode) {
        case Mode.MANUAL:
        case Mode.OFF:
          return Characteristic.TargetHeatingCoolingState.OFF;
        default:
          return Characteristic.TargetHeatingCoolingState.COOL;
      }
    }

    async setTargetHeatingCoolingState(value: number): Promise<void> {
      switch (value) {
        case Characteristic.TargetHeatingCoolingState.COOL:
          const targetTemperature =
            this.targetTemperature || DEFAULT_TARGET_TEMPERATURE;
          await this.api.temperatureMode(
            this.locationName,
            this.roomName,
            targetTemperature
          );
          this.targetTemperature = targetTemperature;
          return;
        default:
          await this.api.powerOff(this.locationName, this.roomName);
          return;
      }
    }

    async getCurrentTemperature(): Promise<number> {
      return await this.api.sensorTemperature(this.locationName, this.roomName);
    }

    async getTargetTemperature(): Promise<number> {
      const result = await this.api.mode(this.locationName, this.roomName);
      if (result.value != null) {
        this.targetTemperature = result.value;
      }
      return this.targetTemperature || 0;
    }

    async setTargetTemperature(targetTemperature: number): Promise<void> {
      await this.api.temperatureMode(
        this.locationName,
        this.roomName,
        targetTemperature
      );
      this.targetTemperature = targetTemperature;
    }

    getServices(): Array<any> {
      return [this.acService];
    }
  }

  homebridge.registerAccessory(
    'homebridge-ambliclimate-ac',
    'AmbiClimateAC',
    AmbiClimateAC
  );
};
