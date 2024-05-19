import "../css/style.css";
import { useCallback, useEffect, useState } from "react";
import { useLoaderData, useOutletContext } from "react-router-dom";
import * as globals from "./Globals"

function ChatMessageFetcher({ chatMessageList, setChatMessageList, fromUsername, lastJsonMessage }) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage));
    }, [lastJsonMessage]);

    useEffect(() => {
        let newChatMessageList = [], changed = false;
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((message, index) => {
            if (message && 'type' in message && 'from' in message && 'content' in message) {
                console.log(message);
                if (message.type === "chat_message" && message.from === fromUsername) {
                    changed = true;
                    newChatMessageList.push(message.content);
                    delete _websocketMessageHistory[index];
                }
            }
        });

        if (changed) setChatMessageList(chatMessageList.concat(newChatMessageList));
        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, fromUsername]);

    return <div></div>;
}

export default function ChatMainUser() {
    const { toUsername } = useLoaderData();
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    const { sendJsonMessage, lastJsonMessage } = useOutletContext();
    const [chatMessageList, setChatMessageList] = useState([]);
    const [chatMessageToSend, setChatMessageToSend] = useState("");

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage));
    }, [lastJsonMessage]);

    const handleClickSendChatMessage = useCallback(() => {
        const _requestKey = globals.randomUUID();
        sendJsonMessage({
            type: "chat_user",
            content: {
                from: globals.fetchData("loginUsername"),
                to: toUsername,
                messages: chatMessageToSend,
                session_token: globals.fetchData("sessionToken"),
                request_key: _requestKey
            }
        });

        setChatMessageToSend("");
        return _requestKey;
    }, [toUsername, chatMessageToSend]);

    return <>
        <ul>
            {
                chatMessageList.map((message, index) => <li key={index}>{message}</li>)
            }
        </ul>
        <form style={{ verticalAlign: "bottom" }}>
            <label htmlFor="chat-input">Input to chat </label>
            <input type="text" id="chat-input" value={chatMessageToSend} onChange={(props) => setChatMessageToSend(props.target.value)} />
            <input type="button" value="Send" onClick={handleClickSendChatMessage} />
        </form>
        <ChatMessageFetcher
            chatMessageList={chatMessageList}
            setChatMessageList={setChatMessageList}
            fromUsername={toUsername}
            lastJsonMessage={lastJsonMessage} />
    </>;
}