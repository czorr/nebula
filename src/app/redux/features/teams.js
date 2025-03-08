import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  attackers: [],
  defenders: [],
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    setAttackers: (state, action) => {
      state.attackers = action.payload;
    },
    setDefenders: (state, action) => {
      state.defenders = action.payload;
    },
    resetTeams: (state) => {
      state.attackers = [];
      state.defenders = [];
    },
  },
});

export const { setAttackers, setDefenders, resetTeams } = teamsSlice.actions;
export default teamsSlice.reducer; 