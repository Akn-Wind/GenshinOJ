import json

import logging, websockets

from .. import ws_server


class judge_ws_server_application(ws_server.ws_server_application_protocol):

    def log(self,
            log: str,
            log_level: ws_server.ws_server_log_level = ws_server.
            ws_server_log_level.LEVEL_INFO):
        if log_level is ws_server.ws_server_log_level.LEVEL_INFO:
            print('[JUDGE_SERVER] [INFO] {}'.format(log))
        if log_level is ws_server.ws_server_log_level.LEVEL_DEBUG:
            print('[JUDGE_SERVER] [DEBUG] {}'.format(log))
        if log_level is ws_server.ws_server_log_level.LEVEL_WARNING:
            print('[JUDGE_SERVER] [WARNING] {}'.format(log))
        if log_level is ws_server.ws_server_log_level.LEVEL_ERROR:
            print('[JUDGE_SERVER] [ERROR] {}'.format(log))

    async def on_login(
            self,
            websocket_protocol: websockets.server.WebSocketServerProtocol,
            content: dict):
        self.log('The user {} tries to login with the hash: {}'.format(
            content['username'], self.get_md5(content['password'])))

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

    def get_md5(self, data):
        import hashlib
        hash = hashlib.md5('add-some-salt'.encode('utf-8'))
        hash.update(data.encode('utf-8'))
        return hash.hexdigest()

    async def on_submission(
            self,
            websocket_protocol: websockets.server.WebSocketServerProtocol,
            content: dict):
        self.ws_server_instance.server_instance.get_module_instance(
            'judge'
        ).now_submission_id = self.ws_server_instance.server_instance.get_module_instance(
            'judge').now_submission_id + 1
        submission_code_path = self.ws_server_instance.server_instance.get_module_instance(
            'compilers_manager').get_file_path_by_filename_and_language(
                'submission_' + str(
                    self.ws_server_instance.server_instance.
                    get_module_instance('judge').now_submission_id),
                content['language'])
        print('Opening {}.'.format(submission_code_path))
        open(submission_code_path, 'w').close()  # Create
        submission_code = open(submission_code_path, 'w+')
        submission_code.seek(0)
        file_content = submission_code.read()
        new_file_content = '' + file_content
        submission_code.seek(0)
        submission_code.write(new_file_content)
        for line in content['code']:
            submission_code.write(line)

        submission_code.flush()
        submission_code.close()
        self.ws_server_instance.server_instance.get_module_instance(
            'judge').judgment_queue.append({
                'submission_id':
                self.ws_server_instance.server_instance.get_module_instance(
                    'judge').now_submission_id,
                'problem_number':
                content['problem_number'],
                'language':
                content['language'],
                'username':
                self.ws_server_instance.server_instance.get_module_instance(
                    'ws_server').sessions[content['session_token']],
                'websocket_protocol':
                websocket_protocol
            })
    
    async def on_problem_statement(
            self,
            websocket_protocol: websockets.server.WebSocketServerProtocol,
            content: dict):
        response = dict()
        response['type'] = 'problem_statement'
        response['content'] = dict()
        try:
            with open(
                    self.ws_server_instance.server_instance.
                    get_module_instance('judge').
                    get_problem_statement_json_path(content['problem_number']),
                    'r') as problem_statement_json_file:
                response['content'].update(json.load(problem_statement_json_file))

            response['content'].update({'request_key': content['request_key']})
            await websocket_protocol.send(json.dumps(response))
            response.clear()
        except FileNotFoundError as e:
            self.log('problem_statement.json({}) is not found!'.format(self.ws_server_instance.server_instance.
                    get_module_instance('judge').
                    get_problem_statement_json_path(content['problem_number'])),
                     ws_server.ws_server_log_level.LEVEL_ERROR)
            response['content'].update({
                'problem_number':
                -1,
                'difficulty':
                -1,
                'problem_name':
                'Problem Not Found',
                'problem_statement':
                ['You tried to request a problem not existed.'],
                'request_key':
                content['request_key']
            })
            await websocket_protocol.send(json.dumps(response))
            response.clear()
        except Exception as e:
            raise e

    async def on_problem_set(
            self,
            websocket_protocol: websockets.server.WebSocketServerProtocol,
            content: dict):

        response = dict()
        response['type'] = 'problem_set'
        response['content'] = dict()
        response['content']['request_key'] = content['request_key']
        try:
            with open(
                    self.ws_server_instance.server_instance.
                    get_module_instance(
                        'judge').get_problem_set_json_path(),
                    'r') as problem_set_json_file:
                response['content']['problem_set'] = json.load(
                    problem_set_json_file)['problem_set']
        except:
            self.log('problem_set.json({}) is not found!'.format(self.ws_server_instance.server_instance.
                    get_module_instance(
                        'judge').get_problem_set_json_path()),
                     ws_server.ws_server_log_level.LEVEL_ERROR)

        await websocket_protocol.send(json.dumps(response))
        response.clear()
