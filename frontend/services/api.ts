import axios from 'axios';

const getApiUrl = (): string => {
  // 1. Prioritize environment variable if explicitly configured
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. Client-side runtime detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If running on localhost/127.0.0.1, target the local backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
  }
  
  // 3. Live production fallback (must be HTTPS to prevent Mixed Content block on Vercel)
  return 'https://chatbot01-1.onrender.com';
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

        buffer += decoder.decode(value, { stream: true });
        
        // Split by standard Server-Sent Events double-newline delimiter
        const lines = buffer.split('\n\n');
        // Save any partial line left at the end to assemble with the next read chunk
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          
          try {
            const jsonStr = trimmed.substring(6); // Extract everything after 'data: '
            const parsed = JSON.parse(jsonStr);
            
            if (parsed.type === 'token') {
              onToken(parsed.content);
            } else if (parsed.type === 'chat_id') {
              onChatIdDetected(parsed.content);
            } else if (parsed.type === 'error') {
              throw new Error(parsed.content);
            }
          } catch (jsonErr) {
            logger.error('Failed to parse SSE payload line:', jsonErr);
          }
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
