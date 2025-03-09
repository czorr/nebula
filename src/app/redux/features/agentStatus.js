import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  agentStatus: "",
};

const agentStatusSlice = createSlice({
  name: 'agentStatus',
  initialState,
  reducers: {
    setAgentStatus: (state, action) => {
      state.agentStatus = action.payload;
    },
  },
});

export const { setAgentStatus } = agentStatusSlice.actions;
export default agentStatusSlice.reducer;