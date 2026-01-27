export const login = (token, user) => {
    const expirationDate = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours
    localStorage.setItem('token', token); // Assuming the API returns a token separately, or we just rely on user presence if no token is returned yet, but user asked for token creation. Wait, the user said "criar um token local". If the backend doesn't return one, we might mock it or just rely on the session data. The prompt says "criar o protocolos... para oder criar um token local". Let's assume we create a dummy token if none exists, or just manage the expiration logic.
    // Actually the current login page just saves 'user'. Let's strictly follow the plan: save token and expiration.
    // If the API doesn't return a token, I will generate a simple timestamp-based one or just use the user object presence + timestamp.
    // Reviewing LoginPage.js: `localStorage.setItem('user', JSON.stringify(data.user));`
    // I will modify this to save expiration.

    const session = {
        token: token || 'mock-token-' + new Date().getTime(), // Fallback if no token from API
        user: user,
        expiration: expirationDate
    };
    localStorage.setItem('session', JSON.stringify(session));
    // Clean up old 'user' item if it exists to avoid confusion
    localStorage.removeItem('user');
};

export const logout = () => {
    localStorage.removeItem('session');
    localStorage.removeItem('user'); // Legacy cleanup
};

export const getSession = () => {
    const sessionStr = localStorage.getItem('session');
    if (!sessionStr) return null;
    try {
        const session = JSON.parse(sessionStr);
        return session;
    } catch (e) {
        return null;
    }
};

export const isAuthenticated = () => {
    const session = getSession();
    if (!session) return false;

    const now = new Date().getTime();
    if (now > session.expiration) {
        logout();
        return false;
    }
    return true;
};

export const getToken = () => {
    const session = getSession();
    return session ? session.token : null;
};

export const getUser = () => {
    const session = getSession();
    return session ? session.user : null;
};
