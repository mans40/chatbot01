import axios from 'axios';

const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If running locally, prioritize local backend unless NEXT_PUBLIC_API_URL is explicitly local on another port
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (process.env.NEXT_PUBLIC_API_URL?.includes('localhost') || process.env.NEXT_PUBLIC_API_URL?.includes('127.0.0.1')) {
        return process.env.NEXT_PUBLIC_API_URL;
      }
      return 'http://localhost:8000';
    }
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:8000';
};

const API_URL = getApiUrl();

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
  uploaded_documents: number;
  successful_responses: number;
  failed_queries: number;
}


// Axios Instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  baseUrl: API_URL,
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
   * Delete a chat session.
   */
  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/api/sessions/${sessionId}`);
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
   * Fetch list of all ingested PDF manuals.
   */
  async getDocuments(): Promise<Array<{ document_id: string; filename: string; file_path: string; chunk_count: number; ingested_at: string }>> {
    const res = await apiClient.get('/api/documents');
    return res.data;
  },

  /**
   * Delete an ingested document.
   */
  async deleteDocument(documentId: string): Promise<void> {
    await apiClient.delete(`/api/documents/${documentId}`);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);
      logger.error('Streaming connection failed:', err);
      if (err.name === 'AbortError') {
        onError(new Error('Connection timed out. The server took too long to respond. Please ensure the backend is running.'));
      } else {
        onError(err);
      }
    }
  },
};

const logger = {
  error: (msg: string, err: any) => {
    console.error(`[AuraChat Client API] ${msg}`, err);
  },
};
