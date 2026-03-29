import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
        checkUserStatus();
    }, []);

    const checkUserStatus = async () => {
        try {
            const currentAccount = await account.get();
            setUser(currentAccount);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        await account.createEmailPasswordSession(email, password);
        await checkUserStatus();
        // Signal Dashboard to show a welcome toast on its first render
        sessionStorage.setItem('alfred_just_logged_in', '1');
    };

    const loginWithGoogle = () => {
        const origin = window.location.origin;
        account.createOAuth2Session(
            OAuthProvider.Google,
            origin + '/',   // success — back to the app
            origin + '/'    // failure — same, app will show auth screen
        );
    };

    const register = async (email: string, password: string, name: string) => {
        await account.create(ID.unique(), email, password, name);
        await login(email, password);
        // Send verification email after successful signup + login
        // Use window.location.origin so it works on both localhost and the live URL
        try {
            await account.createVerification(window.location.origin);
        } catch {
            // Non-fatal — user can resend from the verification screen
            console.warn('[auth] Could not send verification email on signup');
        }
    };

    const logout = async () => {
        await account.deleteSession('current');
        setUser(null);
    };

    // Send (or resend) a verification email to the current user
    const sendVerification = async () => {
        await account.createVerification(window.location.origin);
    };

    // Confirm verification using the userId + secret from the email link
    const verifyEmail = async (userId: string, secret: string) => {
        await account.updateVerification(userId, secret);
        // Re-fetch user so emailVerification flips to true
        await checkUserStatus();
    };

    // Send a password reset email to the given address
    const requestPasswordReset = async (email: string) => {
        await account.createRecovery(email, window.location.origin + '?type=recovery');
    };

    // Confirm the password reset using userId + secret from the email link
    const confirmPasswordReset = async (userId: string, secret: string, password: string) => {
        await account.updateRecovery(userId, secret, password);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, sendVerification, verifyEmail, requestPasswordReset, confirmPasswordReset }}>
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
