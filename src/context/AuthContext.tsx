import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { account, ID } from '../services/appwrite';
import { Models, OAuthProvider } from 'appwrite';

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => void;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    sendVerification: () => Promise<void>;
    verifyEmail: (userId: string, secret: string) => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;
    confirmPasswordReset: (userId: string, secret: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // After Google OAuth, Appwrite redirects back with ?type=oauth&userId=&secret= in the URL.
        // We exchange those params for a real session. This runs AFTER child effects (AppGate),
        // but AppGate bails early on type=oauth so the URL is still intact here.
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        const secret = params.get('secret');
        const type   = params.get('type');

        if (userId && secret && type === 'oauth') {
            // Clean the URL so params don't linger on refresh
            window.history.replaceState({}, '', window.location.pathname);
            // Exchange the token for a real session (no cross-origin cookie — works in Safari)
            account.createSession(userId, secret)
                .then(() => {
                    sessionStorage.setItem('alfred_just_logged_in', '1');
                    checkUserStatus();
                })
                .catch(() => {
                    setUser(null);
                    setLoading(false);
                });
        } else {
            checkUserStatus();
        }
    }, []);

    const checkUserStatus = useCallback(async () => {
        try {
            const currentAccount = await account.get();
            setUser(currentAccount);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        await account.createEmailPasswordSession(email, password);
        await checkUserStatus();
        sessionStorage.setItem('alfred_just_logged_in', '1');
    }, [checkUserStatus]);

    const loginWithGoogle = useCallback(() => {
        const origin = window.location.origin;
        account.createOAuth2Token(
            OAuthProvider.Google,
            origin + '/?type=oauth',
            origin + '/'
        );
    }, []);

    const register = useCallback(async (email: string, password: string, name: string) => {
        await account.create(ID.unique(), email, password, name);
        await login(email, password);
        try {
            await account.createVerification(window.location.origin);
        } catch {
            console.warn('[auth] Could not send verification email on signup');
        }
    }, [login]);

    const logout = useCallback(async () => {
        await account.deleteSession('current');
        setUser(null);
    }, []);

    const sendVerification = useCallback(async () => {
        await account.createVerification(window.location.origin);
    }, []);

    const verifyEmail = useCallback(async (userId: string, secret: string) => {
        await account.updateVerification(userId, secret);
        await checkUserStatus();
    }, [checkUserStatus]);

    const requestPasswordReset = useCallback(async (email: string) => {
        await account.createRecovery(email, window.location.origin + '?type=recovery');
    }, []);

    const confirmPasswordReset = useCallback(async (userId: string, secret: string, password: string) => {
        await account.updateRecovery(userId, secret, password);
    }, []);

    const value = useMemo(() => ({
        user, loading, login, loginWithGoogle, register, logout,
        sendVerification, verifyEmail, requestPasswordReset, confirmPasswordReset,
    }), [user, loading, login, loginWithGoogle, register, logout, sendVerification, verifyEmail, requestPasswordReset, confirmPasswordReset]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
