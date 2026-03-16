import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const sendMessage = async (message, sessionId = 'default') => {
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message,
      session_id: sessionId
    });
    return response.data;
  } catch (error) {
    return { response: 'Error connecting to backend. Make sure backend is running!', chart_data: null, mermaid: null };
  }
};
