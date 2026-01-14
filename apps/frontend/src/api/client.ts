const API_BASE_URL = 'http://localhost:3001/api/v1';

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        // TODO: Get token from AuthContext or storage
        this.token = 'mock-token';
    }

    setToken(token: string) {
        this.token = token;
    }

    async get<T>(path: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw await this.handleError(response);
        }

        return response.json();
    }

    async post<T>(path: string, body: any): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw await this.handleError(response);
        }

        return response.json();
    }

    async postFormData<T>(path: string, formData: FormData): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                // Content-Type is irrelevant here, browser sets it with boundary
            },
            body: formData,
        });

        if (!response.ok) {
            throw await this.handleError(response);
        }

        return response.json();
    }

    async patch<T>(path: string, body: any): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw await this.handleError(response);
        }

        return response.json();
    }

    async put<T>(path: string, body: any): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw await this.handleError(response);
        }

        return response.json();
    }

    async delete<T>(path: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw await this.handleError(response);
        }

        return response.json();
    }

    private async handleError(response: Response) {
        try {
            const data = await response.json();
            return new Error(data.message || data.error?.message || 'API Error');
        } catch {
            return new Error(`API Error: ${response.statusText}`);
        }
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
