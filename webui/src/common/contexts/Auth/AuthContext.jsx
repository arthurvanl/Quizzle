import {createContext, useCallback, useContext, useEffect, useState} from "react";
import {postRequest, jsonRequest, setUnauthorizedHandler} from "@/common/utils/RequestUtil.js";

export const AuthContext = createContext({});

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const checkSession = useCallback(async () => {
        try {
            const data = await jsonRequest("/auth/me");
            if (data.authenticated) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    useEffect(() => {
        setUnauthorizedHandler(() => setUser(null));
        return () => setUnauthorizedHandler(null);
    }, []);

    const login = async (username, password) => {
        const data = await postRequest("/auth/login", {username, password});
        setUser(data.user);
        return data.user;
    };

    const register = async (username, password) => {
        await postRequest("/auth/register", {username, password});
    };

    const logout = async () => {
        try {
            await postRequest("/auth/logout");
        } catch { /* ignore */ }
        setUser(null);
    };

    const requireAuth = (action) => {
        if (user) {
            action();
        } else {
            setPendingAction(() => action);
            setShowLoginDialog(true);
        }
    };

    const handleLoginSuccess = () => {
        setShowLoginDialog(false);
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    };

    const closeLoginDialog = () => {
        setShowLoginDialog(false);
        setPendingAction(null);
    };

    const isAdmin = user?.role === 'admin';
    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{
            user, isAuthenticated, isAdmin, authLoading,
            login, register, logout, requireAuth, checkSession,
            showLoginDialog, handleLoginSuccess, closeLoginDialog
        }}>
            {children}
        </AuthContext.Provider>
    );
};
