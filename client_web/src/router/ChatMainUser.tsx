import "../css/style.css";
import { useCallback, useEffect, useState } from "react";
import { useLoaderData, useOutletContext } from "react-router-dom";
import * as globals from "./Globals"
import { Input, Button, Field } from "@fluentui/react-components";

interface ChatMessage {
    message: string;
    fromMe: boolean;
}

function ChatMessageFetcher({ chatMessageList, setChatMessageList, fromUsername, lastJsonMessage }: {
    chatMessageList: ChatMessage[];
    setChatMessageList: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    fromUsername: string;
    lastJsonMessage: unknown;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        let changed = false;
        const newChatMessageList: ChatMessage[] = [];
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, index) => {
            interface ChatMessageFromFetch {
                type: string;
                from: string;
                content: string;
            }

            function isChatMessageFromFetch(x: object) {
                return 'type' in x && 'from' in x && 'content' in x;
            }

            if (_message && isChatMessageFromFetch(_message)) {
                const message = _message as ChatMessageFromFetch;
                console.log(message);
                if (message.type === "chat_message" && message.from === fromUsername) {
                    changed = true;
                    newChatMessageList.push(({ message: (message.content as string), fromMe: false } as ChatMessage));
                    delete _websocketMessageHistory[index];
                }
            }
        });

        if (changed) setChatMessageList(chatMessageList.concat(newChatMessageList));
        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, fromUsername, chatMessageList, setChatMessageList]);

    return <div></div>;
}

interface ChatInfo {
    toUsername: string;
}

export default function ChatMainUser() {
    const { toUsername } = (useLoaderData() as ChatInfo);
    const [, setWebsocketMessageHistory] = useState([]);
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [chatMessageList, setChatMessageList] = useState<ChatMessage[]>([]);
    const [chatMessageToSend, setChatMessageToSend] = useState("");

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    const handleClickSendChatMessage = useCallback(() => {
        const _requestKey = globals.randomUUID();
        sendJsonMessage({
            type: "chat_user",
            content: {
                from: globals.fetchData("loginUsername"),
                to: toUsername,
                messages: chatMessageToSend as string,
                session_token: globals.fetchData("sessionToken"),
                request_key: _requestKey
            }
        });

        setChatMessageToSend("");
        setChatMessageList(chatMessageList.concat({ message: chatMessageToSend, fromMe: true } as ChatMessage))
        return _requestKey;
    }, [toUsername, chatMessageToSend, sendJsonMessage, chatMessageList]);

    return <>
        <div style={{ display: "flex", flexDirection: "column", flexWrap: "wrap", width: "fill" }}>
            {
                chatMessageList.map((message) => <div style={{ alignItems: message.fromMe ? "right" : "left", justifyContent: message.fromMe ? "right" : "left", display: "flex", width: "fill" }}><ChatBubble text={message.message} fromMe={message.fromMe} /></div>)
            }
        </div>
        <div style={{ display: "flex", flexDirection: "row", width: "fill" }}>
            <form>
                <Field label="Input to chat" style={{ maxWidth: "300px", flex: 3 }}>
                    <Input type="text" id="chat-input" value={chatMessageToSend} onChange={(props) => setChatMessageToSend(props.target.value)} />
                </Field>
                <Button onClick={handleClickSendChatMessage} style={{ flex: 1 }}>Send</Button>
            </form>
        </div>
        <ChatMessageFetcher
            chatMessageList={chatMessageList}
            setChatMessageList={setChatMessageList as React.Dispatch<React.SetStateAction<ChatMessage[]>>}
            fromUsername={toUsername as string}
            lastJsonMessage={lastJsonMessage} />
    </>;
}

import "../css/chatBubble.css"

function ChatBubble({ text, fromMe }: {
    text: string;
    fromMe: boolean;
}) {
    if (fromMe)
        return <div className="chat-bubble chat-bubble--me">
            <p style={{ fontSize: "1em", color: "black" }}>{text}</p>
        </div>
    else
        return <div className="chat-bubble chat-bubble--not-me">
            <p style={{ fontSize: "1em", color: "white" }}>{text}</p>
        </div>
}