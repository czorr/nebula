import { configureStore } from '@reduxjs/toolkit';
import teamsReducer from './features/teams.js';
import mapsReducer from './features/maps.js';
import chatReducer from './features/chat.js';
import agentStatusReducer from './features/agentStatus.js';

export const store = configureStore({
  reducer: {
    teams: teamsReducer,
    maps: mapsReducer,
    chat: chatReducer,
    agentStatus: agentStatusReducer,
  },
});

export default store;