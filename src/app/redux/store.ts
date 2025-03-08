import { configureStore } from '@reduxjs/toolkit';
import teamsReducer from './features/teams.js';
import mapsReducer from './features/maps.js';
export const store = configureStore({
  reducer: {
    teams: teamsReducer,
    maps: mapsReducer,
  },
});

export default store; 