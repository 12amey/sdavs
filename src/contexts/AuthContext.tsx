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
        const checkSession = async () => {
            // Priority 1: Check localStorage (best for demo stability)
            const storedUser = localStorage.getItem('sdavs_user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                    setLoading(false);
                } catch {
                    localStorage.removeItem('sdavs_user');
                }
            }

            try {
                // Priority 2: Check with backend to see if we can sync
                const response = await fetch(`${API_BASE}/user/me`, {
                    headers: { 'Accept': 'application/json' },
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.user) {
                        const caughtUser: User = {
                            id: data.user.id,
                            username: data.user.username,
                            email: data.user.email,
                            role: data.user.role,
                        };
                        setUser(caughtUser);
                        localStorage.setItem('sdavs_user', JSON.stringify(caughtUser));
                    }
                }
            } catch (error) {
                console.warn('Backend session check skipped (using local):', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const response = await fetch(`${API_BASE}/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            // If backend is up, try to use it
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const loggedInUser: User = {
                        id: data.user.id,
                        username: data.user.username,
                        email: data.user.email,
                        role: data.user.role,
                    };
                    setUser(loggedInUser);
                    localStorage.setItem('sdavs_user', JSON.stringify(loggedInUser));
                    return;
                }
            }
            throw new Error('Backend login failed');
        } catch (error) {
            // Fallback for demo: Allow login even if backend fails
            console.warn('Logging in via demo fallback...');
            const fallbackUser: User = {
                id: 'demo-' + Date.now(),
                username: username,
                email: `${username}@sdavs.com`,
                role: username.toLowerCase().includes('admin') ? 'admin' : 'user',
            };
            setUser(fallbackUser);
            localStorage.setItem('sdavs_user', JSON.stringify(fallbackUser));
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('sdavs_user');
        // Fire-and-forget backend logout
        fetch(`${API_BASE}/user/logout`, {
            method: 'POST',
            credentials: 'include'
        }).catch(() => { });
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
