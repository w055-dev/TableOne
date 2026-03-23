const API_URL = 'http://localhost:3001/api';

class ApiClient {
    constructor() {
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshTokenValue = localStorage.getItem('refreshToken');
    }

    setTokens(accessToken, refreshToken) {
        this.accessToken = accessToken;
        this.refreshTokenValue = refreshToken;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }

    clearTokens() {
        this.accessToken = null;
        this.refreshTokenValue = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        try {
            let response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });

            if (response.status === 403) {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    headers['Authorization'] = `Bearer ${this.accessToken}`;
                    response = await fetch(`${API_URL}${endpoint}`, {
                        ...options,
                        headers
                    });
                } else {
                    this.clearTokens();
                    window.location.href = '/login';
                    throw new Error('Сессия истекла');
                }
            }

            return response;
        } catch (error) {
            throw error;
        }
    }

    async refreshToken() {
        if (!this.refreshTokenValue) return false;

        try {
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshTokenValue })
            });

            if (response.ok) {
                const data = await response.json();
                this.setTokens(data.accessToken, data.refreshToken);
                return true;
            }
        } catch (error) {
            console.error('Refresh token error:', error);
        }
        return false;
    }

    async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            this.setTokens(data.accessToken, data.refreshToken);
            return data.user;
        }
        
        const error = await response.json();
        throw new Error(error.error || 'Ошибка входа');
    }

    async register(name, email, password) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        if (response.ok) {
            return await response.json();
        }
        
        throw new Error('Ошибка регистрации');
    }

    async logout() {
        try {
            if (this.refreshTokenValue) {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                    body: JSON.stringify({ refreshToken: this.refreshTokenValue })
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearTokens();
        }
    }

    async getMenu() {
        const response = await fetch(`${API_URL}/menu`);
        return response.json();
    }

    async getTables() {
        const response = await this.request('/tables');
        return response.json();
    }

    async bookTable(tableId, timeSlot) {
        const response = await this.request(`/tables/${tableId}/book`, {
            method: 'POST',
            body: JSON.stringify({ timeSlot })
        });
        return response.json();
    }

    async createOrder(tableId, timeSlot, dishes, clientName) {
        const response = await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify({ tableId, timeSlot, dishes, clientName })
        });
        return response.json();
    }

    async getOrders() {
        const response = await this.request('/orders');
        return response.json();
    }

    async serveDish(orderId, dishIndex) {
        const response = await this.request(`/orders/${orderId}/dish/${dishIndex}/serve`, {
            method: 'PUT'
        });
        return response.json();
    }

    async getKitchenQueue() {
        const response = await this.request('/kitchen/queue');
        return response.json();
    }

    async getRecipe(dishId) {
        const response = await this.request(`/kitchen/recipe/${dishId}`);
        return response.json();
    }

    async getUsers() {
        const response = await this.request('/users');
        return response.json();
    }

    async createEmployee(name, email, password, role) {
        const response = await this.request('/users/employee', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role })
        });
        return response.json();
    }

    async updateUser(userId, data) {
        const response = await this.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response.json();
    }

    async blockUser(userId) {
        const response = await this.request(`/users/${userId}`, {
            method: 'DELETE'
        });
        return response.json();
    }

    async getAdminStats() {
        const response = await this.request('/admin/stats');
        return response.json();
    }

    async completeDish(queueId) {
        const response = await this.request(`/kitchen/dish/${queueId}/complete`, {
            method: 'PUT'
        });
        return response.json();
    }

    async startCooking(queueId) {
        const response = await this.request(`/kitchen/dish/${queueId}/start`, {
            method: 'PUT'
        });
        return response.json();
    }

    async updateDish(dishId, data) {
        const response = await this.request(`/menu/${dishId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response.json();
    }

    async createDish(dishData) {
        const response = await this.request('/menu', {
            method: 'POST',
            body: JSON.stringify(dishData)
        });
        return response.json();
    }

    async deleteDish(dishId) {
        const response = await this.request(`/menu/${dishId}`, {
            method: 'DELETE'
        });
        return response.json();
    }
}

export default new ApiClient();