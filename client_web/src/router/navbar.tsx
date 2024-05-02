import { Divider, Dialog, Button, Label, Avatar, useRestoreFocusTarget, DialogSurface, DialogBody, DialogContent, DialogTrigger, DialogActions } from "@fluentui/react-components";
import { Link, useNavigate } from "react-router-dom";

import "../css/style.css"
import React from "react";

export default function NavBar() {
    const restoreFocusTargetAttribute = useRestoreFocusTarget();
    return (
        <>
            <div>
                <nav>
                    <Avatar size={24} image={{ src: "https://img.atcoder.jp/icons/373e4eb93e4b8e5f441eeeea55e5ac84.jpg" }}></Avatar>
                    <Label size="large"> | </Label>
                    <Link to={`/home`} {...restoreFocusTargetAttribute}>
                        <Label size="large">Genshin OJ</Label>
                    </Link>
                    <Label size="large"> | </Label>
                    <Link to={`/login`} {...restoreFocusTargetAttribute}>
                        <Label size="large">Sign in</Label>
                    </Link>
                    <Label size="large"> | </Label>
                    <Link to={`/register`}><Label size="large">Sign up</Label></Link>
                </nav>
                <Divider />
            </div>
        </>
    );
}