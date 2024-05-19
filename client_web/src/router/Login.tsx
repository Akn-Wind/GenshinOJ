import {
    makeStyles,
    Input,
    Field,
    Button
} from "@fluentui/react-components";

import {
    PersonRegular,
    PasswordRegular
} from "@fluentui/react-icons";

import { useEffect, useState } from "react";

import { useNavigate, useOutletContext } from "react-router-dom";

import "../css/style.css";

import * as globals from "./Globals";
import PopupDialog from "./PopupDialog";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        rowGap: "4px",
        columnGap: "4px",
        maxWidth: "300px",
    },
});

function LoginChecker({ setDialogLoginSuccessOpenState, setDialogLoginFailureOpenState, requestKey, loginUsername, lastJsonMessage }: {
    setDialogLoginSuccessOpenState: React.Dispatch<React.SetStateAction<boolean>>;
    setDialogLoginFailureOpenState: React.Dispatch<React.SetStateAction<boolean>>;
    requestKey: string;
    loginUsername: string;
    lastJsonMessage: unknown;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);

    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, index) => {
            interface LoginSessionResult {
                type: string;
                content: {
                    request_key: string
                };
            }

            interface LoginSessionResultSuccess extends LoginSessionResult {
                type: string;
                content: {
                    request_key: string,
                    session_token: string
                };
            }

            function isLoginSession(x: object) {
                if ('type' in x && 'content' in x && typeof x.content === 'object') {
                    return 'request_key' in (x.content as object);
                }

                return false;
            }

            if (_message && isLoginSession(_message)) {
                if ((_message as LoginSessionResult).content.request_key === requestKey) {
                    if ((_message as LoginSessionResult).type === "quit") {
                        setDialogLoginFailureOpenState(true);
                        globals.setData("isLoggedIn", false);
                    }
                    if ((_message as LoginSessionResult).type === "session_token") {
                        setDialogLoginSuccessOpenState(true);
                        globals.setData("isLoggedIn", true);
                        globals.setData("sessionToken", (_message as LoginSessionResultSuccess).content.session_token);
                        globals.setData("loginUsername", loginUsername);
                    }

                    delete _websocketMessageHistory[index];
                }
            }
        });

        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, requestKey, loginUsername, setDialogLoginFailureOpenState, setDialogLoginSuccessOpenState]);

    return <div></div>;
}

export default function Login() {
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [requestKey, setRequestKey] = useState("");
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [dialogLoggedInOpenState, setDialogLoggedInOpenState] = useState(false);
    const [dialogLoginFailureOpenState, setDialogLoginFailureOpenState] = useState(false);
    const [dialogLoginSuccessOpenState, setDialogLoginSuccessOpenState] = useState(false);
    const navigate = useNavigate();

    const handleClickLoginSession = () => {
        const _requestKey = globals.randomUUID();
        sendJsonMessage({
            type: "login",
            content: {
                username: loginUsername,
                password: loginPassword,
                request_key: _requestKey
            }
        });

        return _requestKey;
    };

    useEffect(() => { if (globals.fetchData("isLoggedIn")) setDialogLoggedInOpenState(true); }, []);
    return (
        <>
            <div className={useStyles().root}>
                <form>
                    <Field label="Login Username" required>
                        <Input contentBefore={<PersonRegular />}
                            onChange={(props) => setLoginUsername(props.target.value)} />
                    </Field>
                    <Field label="Login Password" required>
                        <Input contentBefore={<PasswordRegular />} type="password"
                            onChange={(props) => setLoginPassword(props.target.value)} />
                    </Field>
                    <br />
                    <Button appearance="primary"
                        onClick={() => { setRequestKey(handleClickLoginSession()); }}>Login</Button>
                </form>
                <PopupDialog
                    open={dialogLoggedInOpenState}
                    setPopupDialogOpenState={setDialogLoggedInOpenState}
                    text="You have already logged in."
                    onClose={() => navigate(-1)} />
                <PopupDialog
                    open={dialogLoginFailureOpenState}
                    setPopupDialogOpenState={setDialogLoginFailureOpenState}
                    text="Login failed. Maybe you used a wrong password or username?"
                    onClose={undefined} />
                <PopupDialog
                    open={dialogLoginSuccessOpenState}
                    setPopupDialogOpenState={setDialogLoginSuccessOpenState}
                    text="Login successfully."
                    onClose={() => navigate(-1)} />
                <LoginChecker
                    setDialogLoginFailureOpenState={setDialogLoginFailureOpenState}
                    setDialogLoginSuccessOpenState={setDialogLoginSuccessOpenState}
                    requestKey={requestKey}
                    loginUsername={loginUsername}
                    lastJsonMessage={lastJsonMessage} />
            </div>
        </>
    );
}