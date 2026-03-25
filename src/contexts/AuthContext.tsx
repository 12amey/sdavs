import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    username: string;
    email: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore user session from localStorage
        const storedUser = localStorage.getItem('sdavs_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('sdavs_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const response = await fetch(`${API_BASE}/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Login failed');
            }

            const loggedInUser: User = {
                id: data.user.id,
                username: data.user.username,
                email: data.user.email,
                role: data.user.role,
            };

            setUser(loggedInUser);
            localStorage.setItem('sdavs_user', JSON.stringify(loggedInUser));
        } catch (error) {
            // Fallback to local auth if backend is unreachable
            if (error instanceof TypeError && error.message.includes('fetch')) {
                const fallbackUser: User = {
                    id: '1',
                    username: username,
                    email: `${username}@sdavs.com`,
                    role: username === 'admin' ? 'admin' : 'analyst',
                };
                setUser(fallbackUser);
                localStorage.setItem('sdavs_user', JSON.stringify(fallbackUser));
                return;
            }
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('sdavs_user');
        // Fire-and-forget backend logout
        fetch(`${API_BASE}/user/logout`, { method: 'POST' }).catch(() => { });
    };

    const value = {
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
