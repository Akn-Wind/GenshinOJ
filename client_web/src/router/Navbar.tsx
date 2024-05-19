import { Divider, Label, Avatar, makeStyles } from "@fluentui/react-components";
import { Link } from "react-router-dom";

import "../css/style.css"

const useStyles = makeStyles({
    root: {
        rowGap: "4px",
        columnGap: "4px",
    },
});

export default function NavBar() {
    return (
        <>
            <div className={useStyles().root}>
                <nav>
                    <Avatar size={24} image={{ src: "https://img.atcoder.jp/icons/373e4eb93e4b8e5f441eeeea55e5ac84.jpg" }}></Avatar>
                    <Label size="large"> | </Label>
                    <Link to={`/home`}>
                        <Label size="large">Genshin OJ</Label>
                    </Link>
                    <Label size="large"> | </Label>
                    <Link to={`/problem`}>
                        <Label size="large">Problem</Label>
                    </Link>
                    <Label size="large"> | </Label>
                    <Link to={`/chat`}>
                        <Label size="large">Chat</Label>
                    </Link>
                    <Label size="large"> | </Label>
                    <Link to={`/login`}>
                        <Label size="large">Sign in</Label>
                    </Link>
                    <Label size="large"> | </Label>
                    <Link to={`/register`}><Label size="large">Sign up</Label></Link>
                    <Label size="large"> | </Label>
                    <Link to={`/logout`}>
                        <Label size="large">Sign out</Label>
                    </Link>
                </nav>
                <Divider />
            </div>
        </>
    );
}