import {useContext, useEffect, useRef} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {AuthContext} from "@/common/contexts/Auth";

// Checked once on entry only, so an expiring session never throws away unsaved work on the page.
export const RequireAuth = ({children}) => {
    const {isAuthenticated, authLoading, requireAuth} = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const checked = useRef(false);

    useEffect(() => {
        if (authLoading || checked.current) return;
        checked.current = true;

        if (!isAuthenticated) {
            navigate("/", {replace: true});
            requireAuth(() => navigate(location.pathname));
        }
    }, [authLoading, isAuthenticated]);

    if (authLoading || (!checked.current && !isAuthenticated)) return null;

    return children;
};
