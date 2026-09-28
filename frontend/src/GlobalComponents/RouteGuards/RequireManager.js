// Wrapper to block access to child components by non-manager users
import { Navigate } from "react-router-dom";
import {useAuth} from "./AuthContext";

export default function RequireManager({children}){
    const {user, loading} = useAuth();

    // Is user still being fetched?
    if(loading){
        return null;
    }

    // Is there a current user logged in?
    if(!user){
        // Need replace in order to overwrite the visit history of pages in case user hits back in browser
        return(<Navigate to="/login" replace/>)
    }

    // Are you a manager?
    if(user.position !== "Manager"){
        return(<Navigate to="/" replace/>)
    }

    // You are okay to see these children (sus comment)
    return children;
}