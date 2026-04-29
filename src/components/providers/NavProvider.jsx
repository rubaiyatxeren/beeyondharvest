import React, { createContext, useCallback, useContext, useState } from 'react';

export const NavCtx = createContext(null);

export function NavProvider({ children }) {
    const [page, setPageRaw] = useState("home");
    const [searchQuery, setSearchQuery] = useState("");

    // In NavProvider.jsx, update the setPage function
    const setPage = useCallback((p) => {
        console.log("NavProvider setPage called with:", p);
        setPageRaw(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
        const params = new URLSearchParams();

        if (p.startsWith("product:")) {
            params.set("page", "product");
            params.set("id", p.split(":")[1]);
        } else if (p.startsWith("blog:")) {
            params.set("page", "blog");
            params.set("id", p.split(":")[1]);
        } else if (p !== "home") {
            params.set("page", p);
        }

        const newUrl = params.toString() ? `?${params}` : window.location.pathname;
        window.history.pushState({}, "", newUrl);
    }, []);

    const value = {
        page,
        setPage,
        searchQuery,
        setSearchQuery
    };

    console.log("NavProvider current page:", page);

    return (
        <NavCtx.Provider value={value}>
            {children}
        </NavCtx.Provider>
    );
}

export const useNav = () => {
    const context = useContext(NavCtx);
    if (!context) {
        throw new Error('useNav must be used within a NavProvider');
    }
    return context;
};