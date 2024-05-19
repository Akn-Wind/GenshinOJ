import logging
import warnings

import websockets

from .. import ws_server


class chat_ws_server_application(ws_server.ws_server_application_protocol):

    def log(self,
            log: str,
            log_level: ws_server.ws_server_log_level = ws_server.
            ws_server_log_level.LEVEL_INFO):
        if log_level is ws_server.ws_server_log_level.LEVEL_INFO:
            print('[CHAT_SERVER] [INFO] {}'.format(log))
        if log_level is ws_server.ws_server_log_level.LEVEL_DEBUG:
            print('[CHAT_SERVER] [DEBUG] {}'.format(log))
        if log_level is ws_server.ws_server_log_level.LEVEL_WARNING:
            print('[CHAT_SERVER] [WARNING] {}'.format(log))
        if log_level is ws_server.ws_server_log_level.LEVEL_ERROR:
            print('[CHAT_SERVER] [ERROR] {}'.format(log))

    async def on_login(
            self,
            websocket_protocol: websockets.server.WebSocketServerProtocol,
            content: dict):
        self.log('The user {} tries to login with the hash: {}'.format(
            content['username'], self.get_md5(content['password'])))
        self.ws_server_instance.server_instance.get_module_instance(
            'chat_server').message_box[content['username']] = dict()
        self.ws_server_instance.server_instance.get_module_instance(
            'chat_server').message_box[
                content['username']]['message_queue'] = []
        self.ws_server_instance.server_instance.get_module_instance(
            'chat_server').message_box[
                content['username']]['websocket_protocol'] = websocket_protocol

    async def on_close_connection(
        self,
        websocket_protocol: websockets.server.WebSocketServerProtocol,
    ):
        await super().on_close_connection(websocket_protocol)

    async def on_quit(
            self,
            websocket_protocol: websockets.server.WebSocketServerProtocol,
            content: dict):
        self.log('The user {} quitted with session token: {}'.format(
            content['username'], content['session_token']))
        del self.ws_server_instance.server_instance.get_module_instance(
            'chat_server').message_box[content['username']]

    def get_md5(self, data):
        import hashlib
        hash = hashlib.md5('add-some-salt'.encode('utf-8'))
        hash.update(data.encode('utf-8'))
        return hash.hexdigest()

    async def on_chat_short(
            self,
            websocket_protocol: websockets.server.WebSocketServerProtocol,
            content: dict):
        warnings.warn("on_chat_short is deprecated and will be removed in 1.2-mainstream.");
        try:
            if (content['from'] ==
                    self.ws_server_instance.server_instance.get_module_instance(
                        'ws_server').sessions[content['session_token']]):
                try:
                    self.ws_server_instance.server_instance.get_module_instance(
                        'chat_server').message_box[
                            content['to']]['message_queue'].append({
                                'from':
                                content['from'],
                                'messages':
                                content['messages']
                            })
                    self.log(
                        'The user {} tried to use session token: {} to send message.'
                        .format(content['from'], content['session_token']))
                except KeyError as e:
                    self.log(
                        'The user {} tried to send a message to whom is not online.'
                        .format(content['from']))
            else:
                self.log('The user {} tried to use a fake session token.'.format(
                    content['from']))
        except KeyError:
            self.log('The user {} tried to use a fake session token.'.format(
                    content['from']))

    async def on_chat_user(
            self,
            websocket_protocol: websockets.server.WebSocketServerProtocol,
            content: dict):
        try:
            if (content['from'] ==
                    self.ws_server_instance.server_instance.get_module_instance(
                        'ws_server').sessions[content['session_token']]):
                try:
                    self.ws_server_instance.server_instance.get_module_instance(
                        'chat_server').message_box[
                            content['to']]['message_queue'].append({
                                'from':
                                content['from'],
                                'messages':
                                content['messages']
                            })
                    self.log(
                        'The user {} tried to use session token: {} to send message.'
                        .format(content['from'], content['session_token']))
                except KeyError:
                    self.log(
                        'The user {} tried to send a message to whom is not online.'
                        .format(content['from']))
            else:
                self.log('The user {} tried to use a fake session token.'.format(
                    content['from']))
        except KeyError:
            self.log('The user {} tried to use a fake session token.'.format(
                    content['from']))