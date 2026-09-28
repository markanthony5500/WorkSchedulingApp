// Wrapper to allow user data to be accessed and updated by all child components

import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../../api/apiHelper";


const AuthContext = createContext(null)

// This allows us to wrap child components in order to give them all access to user data (user, setUser, loading)
export function AuthProvider({children}){
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser(){
            try{
                const data = await apiRequest("/auth/me");
                setUser(data);
            }
            catch(e){
                setUser(null);
                console.error("Error in Auth Provider Context: ", e);
            }
            finally{
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    return(
        <AuthContext.Provider value={{user, setUser, loading}}>
            {children}
        </AuthContext.Provider>
    );
}

// Allows AuthContext to be read by calling useAuth
export const useAuth = () => useContext(AuthContext);
