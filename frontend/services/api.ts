import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ChatMessage {
  id?: number;
  session_id: string;
  user_id?: number;
  message: string;
  response: string;
  created_at?: string;
}

export interface ChatSession {
  session_id: string;
  last_activity: string;
  title: string;
}

export interface FeedbackData {
  chat_id: number;
  rating: number;
  comment?: string;
}

export interface AnalyticsData {
  total_chats: number;
  avg_rating: number;
  feedback_count: number;
  satisfaction_rate: number;
  unresolved_queries: number;
  active_users: number;
  chats_over_time: Array<{ date: string; count: number }>;
  recent_feedback: Array<{
    id: number;
    rating: number;
    comment: string;
    chat_message: string;
    created_at: string;
  }>;
}

// Axios Instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  /**
   * Fetch unique chat conversation sessions.
   */
  async getSessions(): Promise<ChatSession[]> {
    const res = await apiClient.get<ChatSession[]>('/api/sessions');
    return res.data;
  },

  /**
   * Fetch chat history for a session.
   */
  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const res = await apiClient.get<ChatMessage[]>(`/api/history?session_id=${sessionId}`);
    return res.data;
  },

  /**
   * Submit customer feedback rating and comment.
   */
  async submitFeedback(data: FeedbackData): Promise<any> {
    const res = await apiClient.post('/api/feedback', data);
    return res.data;
  },

  /**
   * Fetch aggregated support tickets analytics.
   */
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await apiClient.get<AnalyticsData>('/api/analytics');
    return res.data;
  },

  /**
   * Upload documentation file (PDF/TXT) for RAG context extraction.
   */
  async uploadDocument(file: File): Promise<{ filename: string; document_id: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  /**
   * Streams AI chat tokens from API and triggers incremental updates.
   */
  async chatStream(
    sessionId: string,
    message: string,
    onToken: (token: string) => void,
    onChatIdDetected: (chatId: number) => void,
    onError: (err: any) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Check if the chunk contains the [CHAT_ID:x] metadata marker
        if (chunk.includes('[CHAT_ID:')) {
          const match = chunk.match(/\[CHAT_ID:(\d+)\]/);
          if (match && match[1]) {
            onChatIdDetected(parseInt(match[1], 10));
          }
          // Strip the chat ID tag from the output display
          const cleanChunk = chunk.replace(/\[CHAT_ID:\d+\]/, '');
          if (cleanChunk) onToken(cleanChunk);
        } else if (chunk.includes('[ERROR:')) {
          const match = chunk.match(/\[ERROR:\s*(.+?)\]/);
          const errMsg = match ? match[1] : 'Error generating response';
          throw new Error(errMsg);
        } else {
          onToken(chunk);
        }
      }
    } catch (err: any) {
      logger.error('Streaming connection failed:', err);
      onError(err);
    }
  },
};

const logger = {
  error: (msg: string, err: any) => {
    console.error(`[SupportIQ Client API] ${msg}`, err);
  },
};
