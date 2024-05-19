import {
    Outlet,
    useOutletContext,
} from "react-router-dom";

import {
    makeStyles,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableCell,
    TableBody,
    Skeleton,
    Divider,
} from "@fluentui/react-components";

import { useNavigate } from "react-router-dom";

import { useEffect, useState, Suspense, useCallback } from "react";

import "../css/style.css";

import * as globals from "./Globals";
import PopupDialog from "./PopupDialog";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "row",
        rowGap: "4px",
        columnGap: "4px",
        height: "fill",
    },
});

function ProblemListFetcher({ setProblemList, requestKey, lastJsonMessage }: {
    setProblemList: React.Dispatch<React.SetStateAction<string[]>>;
    requestKey: string;
    lastJsonMessage: unknown;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        let newProblemList: string[] = [], changed = false;
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, index) => {
            interface ProblemSet {
                type: string;
                content: {
                    problem_set: string[],
                    request_key: string
                };
            }

            function isProblemSet(x: object) {
                if ('type' in x && 'content' in x && typeof x.content === 'object') {
                    return 'problem_set' in (x.content as object) && 'request_key' in (x.content as object);
                }

                return false;
            }
            if (_message && isProblemSet(_message)) {
                const message = _message as ProblemSet;
                if (message.content.request_key === requestKey) {
                    changed = true;
                    newProblemList = message.content.problem_set;
                    delete _websocketMessageHistory[index];
                }
            }
        });

        if (changed) setProblemList(newProblemList);
        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, requestKey, setProblemList]);

    return <div></div>;
}

export function ProblemList({ sendJsonMessage, lastJsonMessage }: { sendJsonMessage: globals.SendJsonMessage, lastJsonMessage: unknown }) {
    const [, setWebsocketMessageHistory] = useState([]);
    const [problemList, setProblemList] = useState([]);
    const [requestKey, setRequestKey] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    const handleLoadProblemList = useCallback(() => {
        const _requestKey = globals.randomUUID();
        sendJsonMessage({
            type: "problem_set",
            content: {
                request_key: _requestKey
            }
        });

        return _requestKey;
    }, [sendJsonMessage]);

    useEffect(() => {
        setRequestKey(handleLoadProblemList());
    }, [handleLoadProblemList]);

    return <div>
        <Table size="medium">
            <TableHeader>
                <TableRow>
                    <TableHeaderCell>Problem List</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    problemList.map((problem_number: string) => (
                        <TableRow key={problem_number}>
                            <TableCell onClick={() => navigate("/problem/" + problem_number)} >{problem_number}</TableCell>
                        </TableRow>
                    )
                    )
                }
            </TableBody>
        </Table>
        <ProblemListFetcher
            setProblemList={setProblemList as React.Dispatch<React.SetStateAction<string[]>>}
            lastJsonMessage={lastJsonMessage}
            requestKey={requestKey} />
    </div>;
}

export default function Problem() {
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const navigate = useNavigate();
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);

    useEffect(() => {
        if (!globals.fetchData("isLoggedIn"))
            setDialogRequireLoginOpenState(true);
    }, []);

    return <div className={useStyles().root}>
        {
            globals.fetchData("isLoggedIn")
                ?
                <>
                    <div style={{ flex: 20 }}>
                        <Suspense fallback={<Skeleton />}>
                            <ProblemList
                                sendJsonMessage={sendJsonMessage}
                                lastJsonMessage={lastJsonMessage} />
                        </Suspense>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Divider vertical style={{ height: "100%" }} />
                    </div>
                    <div style={{ flex: 120 }}>
                        <Outlet context={{ sendJsonMessage, lastJsonMessage }} />
                    </div>
                </>
                :
                <></>
        }
        <PopupDialog
            open={dialogRequireLoginOpenState}
            setPopupDialogOpenState={setDialogRequireLoginOpenState}
            text="Please login first."
            onClose={() => navigate("/login")} />
    </div>
}