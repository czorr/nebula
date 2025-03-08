import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearChat: (state) => {
      state.messages = [];
      state.error = null;
    },
  },
});

export const { addMessage, setMessages, setLoading, setError, clearChat } = chatSlice.actions;
export default chatSlice.reducer; 