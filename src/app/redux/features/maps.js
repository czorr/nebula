import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  map: null,
};

const mapsSlice = createSlice({
  name: 'maps',
  initialState,
  reducers: {
    setMap: (state, action) => {
      state.map = action.payload;
    },
    resetMap: (state) => {
      state.map = null;
    },
  },
});

export const { setMap, resetMap } = mapsSlice.actions;
export default mapsSlice.reducer; 