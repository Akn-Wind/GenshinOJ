import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, useOutletContext } from "react-router-dom";
import * as globals from "./Globals"
import PopupDialog from "./PopupDialog";
import { CheckmarkCircleRegular, ErrorCircleRegular } from "@fluentui/react-icons";
import { Spinner, Tag } from "@fluentui/react-components";

interface SubmissionInfoFromLoader {
    submissionId: string;
}

function SubmissionStatusFetcher({ submissionId, lastJsonMessage, setSubmissionResult }: {
    submissionId: string;
    lastJsonMessage: unknown;
    setSubmissionResult: React.Dispatch<React.SetStateAction<string>>;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, _index) => {
            interface SubmissionResult {
                type: string;
                content: {
                    submission_id: number;
                    result: string;
                    score: number;
                };
            }

            function isSubmissionResult(x: object) {
                if ('type' in x && 'content' in x && typeof x.content === 'object') {
                    return 'submission_id' in (x.content as object) &&
                        'result' in (x.content as object) &&
                        'score' in (x.content as object);
                }

                return false;
            }

            if (_message && isSubmissionResult(_message)) {
                const message = _message as SubmissionResult;
                console.log(message);
                if (message.content.submission_id.toString() == submissionId) {
                    setSubmissionResult(message.content.result);
                    delete _websocketMessageHistory[_index];
                }
            }
        });

        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, submissionId, setSubmissionResult]);

    return <div></div>;
}

export default function Submission() {
    const { submissionId } = (useLoaderData() as SubmissionInfoFromLoader);
    const [submissionResult, setSubmissionResult] = useState("Pending...");
    const [, setWebsocketMessageHistory] = useState([]);
    const { lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!globals.fetchData("isLoggedIn"))
            setDialogRequireLoginOpenState(true);
    }, []);

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    return <div style={{ display: "inline", padding: "4px" }}>
        {
            submissionResult === "Pending..."
                ?
                <Spinner size="tiny" label={submissionResult} />
                :
                (
                    submissionResult === "Accepted"
                        ?
                        <Tag appearance="outline" icon={<CheckmarkCircleRegular style={{ fontSize: "1.2em", color: "#3AAF00" }} />}>Accepted</Tag>
                        :
                        (
                            submissionResult === "Compile Error"
                                ?
                                <Tag appearance="outline" icon={<ErrorCircleRegular style={{ fontSize: "1.2em", color: "#FDDB10" }} />}>Compile Error</Tag>
                                :
                                <Tag appearance="outline" icon={<ErrorCircleRegular style={{ fontSize: "1.2em", color: "#DA3737" }} />}>Wrong Answer</Tag>
                        )

                )
        }
        <PopupDialog
            open={dialogRequireLoginOpenState}
            setPopupDialogOpenState={setDialogRequireLoginOpenState}
            text="Please login first."
            onClose={() => navigate("/login")} />
        <SubmissionStatusFetcher
            submissionId={submissionId}
            lastJsonMessage={lastJsonMessage}
            setSubmissionResult={setSubmissionResult}
        />
    </div>;
}