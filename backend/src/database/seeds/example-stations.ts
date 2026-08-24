export interface ExampleStation {
  externalId: number;
  address: string;
  longitude: number;
  latitude: number;
}

// Representative records from the City of Cologne's public fuel-station data.
export const exampleStations: readonly ExampleStation[] = [
  {
    externalId: 98,
    address: "Bonner Str. 98 (50677 Neustadt/Süd)",
    longitude: 6.960644911005172,
    latitude: 50.916095041454554,
  },
  {
    externalId: 99,
    address: "Hülchrather Str. 17 (50670 Neustadt/Nord)",
    longitude: 6.961069175632063,
    latitude: 50.954466539174284,
  },
  {
    externalId: 100,
    address: "Siegburger Str. 116 (50679 Deutz)",
    longitude: 6.979491940887355,
    latitude: 50.923288946783785,
  },
  {
    externalId: 101,
    address: "Marsilstein 3 (50676 Altstadt/Süd)",
    longitude: 6.944522335446989,
    latitude: 50.935113088265084,
  },
  {
    externalId: 102,
    address: "Deutz-Kalker Str. 103 (50679 Deutz)",
    longitude: 6.9917132640677755,
    latitude: 50.937189337758255,
  },
  {
    externalId: 103,
    address: "Ringstr. 21 (50996 Rodenkirchen)",
    longitude: 6.9919236852224,
    latitude: 50.89030570672304,
  },
  {
    externalId: 104,
    address: "Brühler Str. 223 (50968 Raderthal)",
    longitude: 6.953723006149421,
    latitude: 50.89987757453494,
  },
  {
    externalId: 112,
    address: "Aachener Str. 1035 (50858 Junkersdorf)",
    longitude: 6.8581281326722605,
    latitude: 50.93767146119405,
  },
  {
    externalId: 124,
    address: "Flughafen/Nordallee (51147 Köln)",
    longitude: 7.112903272879867,
    latitude: 50.88113367263274,
  },
  {
    externalId: 51,
    address: "Neusser Landstr. 323 (50769 Worringen)",
    longitude: 6.864124787483406,
    latitude: 51.067769336314974,
  },
];
