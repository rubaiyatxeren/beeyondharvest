import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState
} from "react";

export const NavCtx = createContext(null);

export function NavProvider({ children }) {
    const [page, setPageRaw] = useState("home");
    const [searchQuery, setSearchQuery] = useState("");

    const setPage = useCallback((p) => {
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

        const newUrl = params.toString()
            ? `?${params.toString()}`
            : window.location.pathname;

        window.history.pushState({}, "", newUrl);
    }, []);

    const value = useMemo(() => ({
        page,
        setPage,
        searchQuery,
        setSearchQuery
    }), [page, setPage, searchQuery]);

    return (
        <NavCtx.Provider value={value}>
            {children}
        </NavCtx.Provider>
    );
}

export const useNav = () => {
    const ctx = useContext(NavCtx);
    if (!ctx) throw new Error("useNav must be used within NavProvider");
    return ctx;
};
