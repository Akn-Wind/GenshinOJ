export let cache = new Map();

export function clearCache(type: string) {
    if (type == "@all") cache = new Map();
    else cache.delete(type);
}

export function fetchData(type: string) {
    if (!cache.has(type) || !cache.get(type)) cache.set(type, initData(type));
    return cache.get(type);
}

export function setData(type: string, data: unknown) {
    if (data == undefined) cache.delete(type);
    cache.set(type, data);
}

function initData(type: string) {
    if (type === "isLoggedIn") return false;
    if (type === "loginUsername") return undefined;
    throw Error("Not implemented yet: " + type);
}

export function useWrapPromise(promise: { status: string; value: any; reason: any; then: (arg0: (result: any) => void, arg1: (reason: any) => void) => void; }) {
    if (promise.status === 'fulfilled') {
        return promise.value;
    } else if (promise.status === 'rejected') {
        throw promise.reason;
    } else if (promise.status === 'pending') {
        throw promise;
    } else {
        promise.status = 'pending';
        promise.then(
            result => {
                promise.status = 'fulfilled';
                promise.value = result;
            },
            reason => {
                promise.status = 'rejected';
                promise.reason = reason;
            },
        );
        throw promise;
    }
}

export function randomUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function getProperty(obj: unknown, key: string) {
    if (typeof obj === "object" && obj !== null) {
        return (obj as { [k: string]: unknown })[key];
    } else {
        return undefined;
    }
}

function isObject(object: unknown) {
    return object != null && typeof object === 'object';
}

function deepEqual(object1: object, object2: object) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (let index = 0; index < keys1.length; index++) {
        const val1 = getProperty(object1, keys1[index]), val2 = getProperty(object2, keys2[index]), areObjects = isObject(val1) && isObject(val2);
        if ((areObjects && !deepEqual(val1 as object, val2 as object)) ||
            !areObjects && val1 !== val2) {
            return false;
        }
    }

    return true;
}


export function compareArray(a: unknown[], b: unknown[]) {
    return (a.length === b.length) && (a.every((v, i) => (isObject(v) && isObject(b[i])) ? deepEqual(v as object, b[i] as object) : (v === b[i])));
}

export declare type WebSocketMessage = string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView;
export declare type SendMessage = (message: WebSocketMessage, keep?: boolean) => void;
export declare type SendJsonMessage = <T = unknown>(jsonMessage: T, keep?: boolean) => void;
export declare type WebSocketLike = WebSocket | EventSource;

export declare type WebSocketHook<T = unknown, P = WebSocketEventMap['message'] | null> = {
    sendMessage: SendMessage;
    sendJsonMessage: SendJsonMessage;
    lastMessage: P;
    lastJsonMessage: T;
    readyState: ReadyState;
    getWebSocket: () => (WebSocketLike | null);
};