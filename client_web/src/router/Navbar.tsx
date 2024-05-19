import { Divider, Avatar, Tab } from "@fluentui/react-components";

import "../css/style.css"
import { useNavigate } from "react-router-dom";
import { ChartMultipleFilled, ChatFilled, ClipboardTaskListLtrFilled } from "@fluentui/react-icons";

import * as globals from "./Globals"

export default function NavBar() {
    const navigate = useNavigate();
    const onTabSelect = (value: string) => {
        // setSelectedValue(value);
        if (value === "root") navigate("/");
        if (value === "problem") navigate("/problem");
        if (value === "submission") navigate("/submission");
        if (value === "chat") navigate("/chat");
        if (value === "login") navigate("/login");
        if (value === "register") navigate("/register");
        if (value === "logout") navigate("/logout");
    };

    return (
        <>
            <div style={{ display: "inline" }}>
                {/* <TabList size="small" selectedValue={selectedValue} onTabSelect={onTabSelect}> */}
                <Tab onClick={() => onTabSelect("root")} style={{ float: "left", transform: "scale(1)" }} value="root" icon={<Avatar size={24} image={{ src: "https://img.atcoder.jp/icons/373e4eb93e4b8e5f441eeeea55e5ac84.jpg" }} />}>
                    Genshin OJ
                </Tab>
                <Tab onClick={() => onTabSelect("problem")} style={{ float: "left", transform: "scale(1)" }} value="problem" icon={<ClipboardTaskListLtrFilled />}>Problem</Tab>
                <Tab onClick={() => onTabSelect("submission")} style={{ float: "left", transform: "scale(1)" }} value="submission" icon={<ChartMultipleFilled />}>Submission</Tab>
                <Tab onClick={() => onTabSelect("chat")} style={{ float: "left", transform: "scale(1)" }} value="chat" icon={<ChatFilled />}>Chat</Tab>
                {
                    (globals.fetchData("isLoggedIn"))
                        ?
                        <Tab onClick={() => onTabSelect("logout")} style={{ float: "right", transform: "scale(1)" }} value="logout">Sign out</Tab>
                        :
                        <Tab onClick={() => onTabSelect("login")} style={{ float: "right", transform: "scale(1)" }} value="login">Sign in</Tab>
                }
                <Tab onClick={() => onTabSelect("register")} style={{ float: "right", transform: "scale(1)" }} value="register">Sign up</Tab>

                {/* </TabList> */}
                <Divider />
            </div>
        </>
    );
}