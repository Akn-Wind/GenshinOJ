import {
    makeStyles,
    Input,
    Field,
    Button,
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
        maxWidth: "250px",
    },
});

function RegisterChecker({ setDialogRegisterSuccessOpenState, setDialogRegisterFailureOpenState, requestKey, lastJsonMessage }: {
    setDialogRegisterSuccessOpenState: React.Dispatch<React.SetStateAction<boolean>>;
    setDialogRegisterFailureOpenState: React.Dispatch<React.SetStateAction<boolean>>;
    requestKey: string;
    lastJsonMessage: unknown;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);

    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        const _websocketMessageHistory = websocketMessageHistory;
        websocketMessageHistory.map((_message, index) => {
            interface RegisterSessionResult {
                type: string;
                content: {
                    reason: string,
                    request_key: string
                };
            }

            function isRegisterSession(x: object) {
                if ('type' in x && 'content' in x && typeof x.content === 'object') {
                    return 'request_key' in (x.content as object) && 'reason' in (x.content as object) && x.type === 'quit';
                }

                return false;
            }
            if (_message && isRegisterSession(_message)) {
                const message = _message as RegisterSessionResult;
                if (message.content.reason == "registration_success") {
                    setDialogRegisterSuccessOpenState(true);
                    globals.setData("isLoggedIn", false);
                    delete _websocketMessageHistory[index];
                }

                if (message.type == "quit" && message.content.reason == "registration_failure") {
                    setDialogRegisterFailureOpenState(true);
                    globals.setData("isLoggedIn", false);
                    delete _websocketMessageHistory[index];
                }
            }
        });
    }, [websocketMessageHistory, requestKey, setDialogRegisterFailureOpenState, setDialogRegisterSuccessOpenState]);

    return <div></div>;
}

export default function Register() {
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [requestKey, setRequestKey] = useState("");
    const [registerUsername, setRegisterUsername] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
    const [dialogLoggedInOpenState, setDialogLoggedInOpenState] = useState(false);
    const [dialogPasswordInputAndConfirmNotTheSameOpenState, setDialogPasswordInputAndConfirmNotTheSameOpenState] = useState(false);
    const [dialogRegisterFailureOpenState, setDialogRegisterFailureOpenState] = useState(false);
    const [dialogRegisterSuccessOpenState, setDialogRegisterSuccessOpenState] = useState(false);
    const navigate = useNavigate();

    const handleClickRegisterSession = () => {
        const request_key = globals.randomUUID();
        sendJsonMessage({
            type: "register",
            content: {
                username: registerUsername,
                password: registerPassword,
                request_key: request_key
            }
        });
        return request_key;
    };

    useEffect(() => { if (globals.fetchData("isLoggedIn")) setDialogLoggedInOpenState(true); }, []);
    return (
        <>
            <div className={useStyles().root}>
                <form>
                    <Field label="Register Username" required>
                        <Input contentBefore={<PersonRegular />}
                            onChange={(props) => setRegisterUsername(props.target.value)} />
                    </Field>
                    <Field label="Register Password" required>
                        <Input contentBefore={<PasswordRegular />} type="password"
                            onChange={(props) => setRegisterPassword(props.target.value)} />
                    </Field>
                    <Field label="Confirm Register Password" required>
                        <Input contentBefore={<PasswordRegular />} type="password"
                            onChange={(props) => setRegisterPasswordConfirm(props.target.value)} />
                    </Field>
                    <br />
                    <Button appearance="primary" onClick={() => {
                        if (registerPassword != registerPasswordConfirm)
                            setDialogPasswordInputAndConfirmNotTheSameOpenState(true);
                        else
                            setRequestKey(handleClickRegisterSession());
                    }}>Register</Button>
                </form>
                <PopupDialog
                    open={dialogLoggedInOpenState && !dialogRegisterSuccessOpenState}
                    setPopupDialogOpenState={setDialogLoggedInOpenState}
                    text="You have already logged in."
                    onClose={() => navigate("/home")} />
                <PopupDialog
                    open={dialogPasswordInputAndConfirmNotTheSameOpenState}
                    setPopupDialogOpenState={setDialogPasswordInputAndConfirmNotTheSameOpenState}
                    text="You input the password which is not the same as confirmed."
                    onClose={undefined} />
                <PopupDialog
                    open={dialogRegisterFailureOpenState}
                    setPopupDialogOpenState={setDialogRegisterFailureOpenState}
                    text="Registration failed. Maybe you registered an existed username or something went wrong."
                    onClose={undefined} />
                <PopupDialog
                    open={dialogRegisterSuccessOpenState}
                    setPopupDialogOpenState={setDialogRegisterSuccessOpenState}
                    text="Registration succeeded."
                    onClose={() => navigate("/login")} />
                <RegisterChecker
                    setDialogRegisterFailureOpenState={setDialogRegisterFailureOpenState}
                    setDialogRegisterSuccessOpenState={setDialogRegisterSuccessOpenState}
                    requestKey={requestKey}
                    lastJsonMessage={lastJsonMessage} />
            </div>
        </>
    );
}