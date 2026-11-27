const getSystemXApiUrl = () => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:8000`;
  }
  return 'http://localhost:8000';
};

export interface UserFieldState {
  body_type: string;
  m: number;
  c: number;
  k: number;
  beta: number;
  phase: number;
  energy: number;
  wave_amplitudes: {
    action: number;
    thought: number;
    feeling: number;
  };
  is_collapsing: boolean;
}

export interface UserState {
  user_id: string;
  total_energy: number;
  coherence_index: number;
  phase_variance: number;
  fields: Record<string, UserFieldState>;
}

export interface OracleResponse {
  user_id: string;
  question: string;
  dominant_body: string;
  total_energy: number;
  coherence_index: number;
  phase_variance: number;
  collapsing_fields: string[];
  guidance: string;
  fields: Record<string, UserFieldState>;
}

export class SystemXClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getSystemXApiUrl();
  }

  private async fetchWithErrorHandling(url: string, options?: RequestInit): Promise<any> {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('SystemX API Error:', error);
      throw error;
    }
  }

  async createUser(userId: string, chartData?: any): Promise<{ status: string; user_id: string }> {
    return this.fetchWithErrorHandling(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, chart_data: chartData })
    });
  }

  async getUserState(userId: string): Promise<UserState> {
    return this.fetchWithErrorHandling(`${this.baseUrl}/users/${userId}`);
  }

  async queryOracle(userId: string, question: string): Promise<OracleResponse> {
    return this.fetchWithErrorHandling(`${this.baseUrl}/oracle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, question })
    });
  }

  async getNetworkCoherence(): Promise<{ network_coherence: number; active_users: number }> {
    return this.fetchWithErrorHandling(`${this.baseUrl}/network/coherence`);
  }

  async networkStep(): Promise<any> {
    return this.fetchWithErrorHandling(`${this.baseUrl}/network/step`, {
      method: 'POST'
    });
  }
}

export const systemXClient = new SystemXClient();
