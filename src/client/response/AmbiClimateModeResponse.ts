enum Mode {
  AWAY_HUMIDITY_UPPER = 'Away_Humidity_Upper',
  AWAY_TEMPERATURE_LOWER = 'Away_Temperature_Lower',
  AWAY_TEMPERATURE_UPPER = 'Away_Temperature_Upper',
  COMFORT = 'Comfort',
  MANUAL = 'Manual',
  OFF = 'Off',
  TEMPERATURE = 'Temperature',
}

export interface AmbiClimateModeResponse {
  mode: Mode;
  value: number | null;
}
