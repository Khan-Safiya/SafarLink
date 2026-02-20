import { useUser, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import api, { setupInterceptors } from "../api/axios";

export const SyncUser = () => {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();

    useEffect(() => {
        if (isLoaded && user) {
            setupInterceptors(getToken);

            const sync = async () => {
                try {
                    await api.post('/users/sync', {
                        email: user.primaryEmailAddress?.emailAddress,
                        name: user.fullName,
                    });
                    console.log("User synced with backend");
                } catch (error) {
                    console.error("Error syncing user:", error);
                }
            };

            sync();
        }
    }, [isLoaded, user, getToken]);

    return null;
};
