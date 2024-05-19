import "../css/style.css";
import { useRef, useCallback, useEffect, useState } from "react";
import { useLoaderData, useOutletContext } from "react-router-dom";
import * as globals from "./Globals"

function ProblemInfoFetcher({ lastJsonMessage, problemInfo, setProblemInfo, requestKey }) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage));
    }, [lastJsonMessage]);

    useEffect(() => {
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((message, index) => {
			console.log(message);
			if (message /*&& 'type' in message && 'content' in message && 'problem_number' in message.content && 'difficulty' in message.content && 'problem_name' in message.content && 'problem_statement' in message.content && message.type === "problem_statement" && 'request_key' in message.content*/) {
				console.log(message);
				if(message.request_key == requestKey)
				{
					setProblemInfo({
						problem_number: message.content.problem_number as number,
						difficulty: message.content.difficulty as number,
						problem_name: message.content.problem_name as string,
						problem_statement: message.content.problem_statement as string[]
					});
					delete _websocketMessageHistory[index];
				}
			}
        });

        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory]);
    return <div></div>;
}

export default function ProblemMain() {
    const { problemNumber } = useLoaderData();
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    const { sendJsonMessage, lastJsonMessage } = useOutletContext();
    const [problemInfo, setProblemInfo] = useState({});
    const [requestKey, setRequestKey] = useState("");

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage));
    }, [lastJsonMessage]);

    const handleLoadProblemInfo = useCallback(() => {
        const _requestKey = globals.randomUUID();
        sendJsonMessage({
            type: "problem_statement",
            content: {
                problem_number: problemNumber,
                request_key: _requestKey
            }
        });

        return _requestKey;
    }, [problemNumber]);

    useEffect(() => {
        setRequestKey(handleLoadProblemInfo());
    }, [handleLoadProblemInfo]);

    return <>
        {
            problemInfo && problemInfo.problem_statement
                ?
                problemInfo.problem_statement.map((statement, index) => (
                    <p key={index}>{statement}</p>
                )
                )
                :
                <></>
        }
        <ProblemInfoFetcher
            lastJsonMessage={lastJsonMessage}
			setProblemInfo={setProblemInfo}
            problemInfo={problemInfo}
            requestKey={requestKey} />
    </>;
}