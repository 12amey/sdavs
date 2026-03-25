import { Region } from '../types/satellite';

// Pre-defined regions for quick access
export const maharashtraRegion: Region = {
  id: 'maharashtra',
  name: 'Maharashtra, India',
  center: [18.8, 73.3], // Center between Mumbai and Pune
  bounds: [
    [18.0, 72.5], // Southwest corner (covers Mumbai to Pune)
    [20.0, 74.5]  // Northeast corner
  ],
  zoom: 8 // Good zoom level to see both Mumbai and Pune
};

export const defaultRegions: Region[] = [
  maharashtraRegion,
  {
    id: 'amazon',
    name: 'Amazon Rainforest',
    bounds: [[-10.0, -75.0], [5.0, -50.0]],
    center: [-3.4653, -62.2159]
  },
  {
    id: 'sahara',
    name: 'Sahara Desert',
    bounds: [[15.0, -10.0], [30.0, 35.0]],
    center: [23.4162, 25.6628]
  },
  {
    id: 'greenland',
    name: 'Greenland Ice Sheet',
    bounds: [[60.0, -50.0], [83.0, -10.0]],
    center: [71.7069, -42.6043]
  }
];
