import {useContext, useEffect} from "react";
import {postRequest} from "@/common/utils/RequestUtil.js";
import {AuthContext} from "@/common/contexts/Auth";
import toast from "react-hot-toast";

export const ResultsDialog = ({isOpen, onClose, practiceCode, onSuccess}) => {
    const {isAuthenticated, requireAuth} = useContext(AuthContext);

    useEffect(() => {
        if (!isOpen) return;

        const access = async () => {
            try {
                await postRequest(`/practice/${practiceCode}/results`, {});
                onClose();
                onSuccess(practiceCode);
            } catch (error) {
                if (error.message?.includes('404')) {
                    toast.error('Practice quiz not found');
                } else if (error.message?.includes('401')) {
                    toast.error('Login required');
                } else {
                    toast.error('Failed to load results');
                }
            }
        };

        if (isAuthenticated) {
            access();
        } else {
            requireAuth(access);
            onClose();
        }
    }, [isOpen]);

    return null;
};
