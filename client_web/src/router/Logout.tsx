import { Link } from "react-router-dom";
import * as globals from "./Globals.ts";
import { useEffect } from "react";

export default function Logout() {
    useEffect(() => {
        globals.clearCache("@all");
    }, [])

    return <Link to="/login" />;
}