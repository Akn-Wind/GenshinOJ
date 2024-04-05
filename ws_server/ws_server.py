import os, gc, abc, json, enum, random, typing, importlib

import asyncio, websockets.server

import server

# gc.disable()

sessions = dict()

def generate_session_token(session_token_seed: int) -> str:
    if session_token_seed > 1:
        generated_session_token = ''
        generated_session_token =                    \
        generated_session_token                      \
        +                                            \
        chr(session_token_seed * 1  % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 3  % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 5  % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 7  % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 9  % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 11 % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 13 % 26 + ord('a')) \
        +                                            \
        chr(session_token_seed * 15 % 26 + ord('a'))
        return generated_session_token + generate_session_token(int(session_token_seed / 5))
    else:
        return 's'

WS_SERVER_CONFIG_JSON_PATH = os.getcwd() + '/ws_server/ws_server_config.json'
class ws_server:
    def __init__(self, server_instance: server.server, server_host = '0.0.0.0', server_port = 9982) -> None:
        # Necessary Initialization
        self.server_instance = server_instance
        self.server_instance.working_loads['ws_server']['instance'] = self
        
        self.sessions = dict()
        with open(WS_SERVER_CONFIG_JSON_PATH, 'r') as ws_server_config_json_file:
            self.ws_server_config = json.load(ws_server_config_json_file)
        
        self.ws_server_applications_config = self.ws_server_config['ws_server_applications']
        self.ws_server_applications: list[ws_server_application_protocol] = []
        if self.ws_server_config['enable_default_ws_server_application']:
            self.ws_server_applications.append(simple_ws_server_application(self))
        
        for ws_server_application_config in self.ws_server_applications_config:
            if ws_server_application_config['enabled']:
                self.ws_server_applications.append(getattr(getattr(getattr(importlib.__import__(ws_server_application_config['path']), 'ws_server_applications'), ws_server_application_config['id']), ws_server_application_config['id'])(self))
        
        self.ws_server = websockets.server.serve(self.receive, server_host, server_port)
        self.main_loop = asyncio.get_event_loop()
        self.main_loop.run_until_complete(self.ws_server)

    def __del__(self) -> None:
        pass
        
    async def receive(self, websocket_protocol: websockets.server.WebSocketServerProtocol):
        try:
            async for original_message in websocket_protocol:
                message = json.loads(original_message)
                print("Received: {}".format(message))
                try:
                    for ws_server_application in self.ws_server_applications:
                        try:
                            print('Called {}.'.format('on_' + message['type']))
                            await getattr(ws_server_application, format('on_' + message['type']))(websocket_protocol, message['content'])
                            await asyncio.sleep(0)
                        except AttributeError as e:
                            pass
                        except Exception as e:
                            raise e
                except Exception as e:
                    raise e
                
                await asyncio.sleep(0)
        except Exception as e:
            if type(e) is not websockets.exceptions.ConnectionClosedOK:
                raise e
            
            for ws_server_application in self.ws_server_applications:
                ws_server_application.on_quit()
                
        await asyncio.sleep(0)

class ws_server_log_level(enum.Enum):
    LEVEL_INFO = 0
    LEVEL_DEBUG = 1
    LEVEL_WARNING = 2
    LEVEL_ERROR = 3

class ws_server_application_protocol:
    """
    Base class for any implementations of additional websocket server applications
    """
    @typing.final
    def __init__(
        self, 
        ws_server_instance: ws_server
    ):
        self.ws_server_instance: ws_server = ws_server_instance
    
    @abc.abstractmethod
    def log(
        self, 
        log: str, 
        log_level: ws_server_log_level = ws_server_log_level.LEVEL_INFO
    ):
        """
        Logging method
        Args:
            log (str): Log information
            log_level (ws_server_log_level): Logging level
        Info:
            It is suggested that you should override this method to distinguish between the official application and yours.
        """
        if log_level is ws_server_log_level.LEVEL_INFO:
            print('[WS_SERVER] [INFO] {}'.format(log))
        if log_level is ws_server_log_level.LEVEL_DEBUG:
            print('[WS_SERVER] [DEBUG] {}'.format(log))
        if log_level is ws_server_log_level.LEVEL_WARNING:
            print('[WS_SERVER] [WARNING] {}'.format(log))
        if log_level is ws_server_log_level.LEVEL_ERROR:
            print('[WS_SERVER] [ERROR] {}'.format(log))
    
    @abc.abstractmethod
    async def on_login(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        content: dict
    ):
        """
        Callback method `on_login`
        Args:
            websocket_protocol (websockets.server.WebSocketServerProtocol): the protocol of a websocket connection
            username (str): the login username
            password (str): the login password
        Info:
            You need to implement this method to do the specific actions you want whenever a user tries to login.
        """
        self.log('{} tries to login with the password: {}'.format(content['username'], content['password']))

    @abc.abstractmethod
    async def on_quit(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        content: dict
    ):
        """ 
        Callback method `on_quit`
        Info:
            You need to implement this method to do the specific actions you want whenever a user tries to quit.
        """
        self.log('{} quitted with session token: {}'.format(content['username'], content['session_token']))

class simple_ws_server_application(ws_server_application_protocol):
    """
    A simple, official implementation of websocket server application, providing some simple plugins.
    """
    def log(
        self, 
        log: str, 
        log_level: ws_server_log_level = ws_server_log_level.LEVEL_INFO
    ):
        return super().log(log, log_level)

    async def on_login(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        content: dict
    ):
        """
        Official callback method for login with a authentication plugin.
        """
        password_hash = self.get_md5(content['password'])
        self.log('The user {} try to login with the hash: {}.'.format(content['username'], password_hash))
        self.ws_server_instance.server_instance.get_module_instance('db_connector').database_cursor.execute('SELECT password FROM users WHERE username = \'{}\';'.format(content['username']))
        tmp = self.ws_server_instance.server_instance.get_module_instance('db_connector').database_cursor.fetchone()
        try:
            real_password_hash = tmp[0]
        except:
            self.log('The user {} failed to login.'.format(content['username']), ws_server_log_level.LEVEL_ERROR)
            response = {
                'type': 'quit',
                'content': 'authentication_failure'
            }
            await websocket_protocol.send(json.dumps(response)); response.clear();

        if real_password_hash != None and real_password_hash == password_hash:
            new_session_token = generate_session_token(random.randint(1000000000000000, 10000000000000000))
            response = {'type': 'session_token', 'content': new_session_token}
            self.log('The user {} logged in successfully.'.format(content['username']))
            self.ws_server_instance.sessions[new_session_token] = content['username']
            self.log('The session token: {}'.format(new_session_token));
            await websocket_protocol.send(json.dumps(response)); response.clear();
        else:
            self.log('The user {} failed to login.'.format(content['username']), ws_server_log_level.LEVEL_ERROR)
            response = {'type': 'quit', 'content': 'authentication_failure'}
            await websocket_protocol.send(json.dumps(response)); response.clear();

    async def on_quit(
        self, 
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        content: dict
    ):
        super().on_quit(self, websocket_protocol, content)
        await websocket_protocol.close()
        self.log('{} quitted with session token: {}'.format(content['username'], content['session_token']))

    def get_md5(self, data):
        import hashlib
        hash = hashlib.md5('add-some-salt'.encode('utf-8'))
        hash.update(data.encode('utf-8'))
        return hash.hexdigest()

    async def on_register(
        self,
        websocket_protocol: websockets.server.WebSocketServerProtocol, 
        content: dict
    ):
        """
        Official callback method for registration
        """
        response = dict(); username = content['username']; password = content['password']; password_hash = self.get_md5(password)
        self.log('The user {} try to register with hash: {}.'.format(username, password_hash))
        self.ws_server_instance.server_instance.get_module_instance('db_connector').database_cursor.execute(f'SELECT password FROM users WHERE username = \'{username}\';')
        tmp = self.ws_server_instance.server_instance.get_module_instance('db_connector').database_cursor.fetchone()
        if tmp == None:
            try:
                self.ws_server_instance.server_instance.get_module_instance('db_connector').database_cursor.execute(f'INSERT INTO users (username, password) VALUES (\'{username}\', \'{password_hash}\');')
                self.ws_server_instance.server_instance.get_module_instance('db_connector').database.commit()
                self.log('The user {} registered successfully.'.format(username))
            except:
                self.ws_server_instance.server_instance.get_module_instance('db_connector').database.rollback()

            response = {'type': 'quit', 'content': 'registration_success'}    
            await websocket_protocol.send(json.dumps(response)); response.clear();
        else:
            self.log('The user {} failed to register.'.format(username), ws_server_log_level.LEVEL_ERROR)
            response = {'type': 'quit', 'content': 'registration_failure'}    
            await websocket_protocol.send(json.dumps(response)); response.clear();
            
    async def on_problem_statement(
        self,
        websocket_protocol: websockets.server.WebSocketServerProtocol,
        content: dict
    ):
        response = dict(); response['type'] = 'problem_statement'
        try:
            with open(self.ws_server_instance.server_instance.get_module_instance('global_message_queue').get_problem_statement_json_path(content['problem_number']), 'r') as problem_statement_json_file:
                response = json.load(problem_statement_json_file)
            
        except Exception as e:
            self.log('problem_statement.json is not found!', ws_server_log_level.LEVEL_ERROR)
        
        await websocket_protocol.send(json.dumps(response)); response.clear();
        
    async def on_problem_set(
        self,
        websocket_protocol: websockets.server.WebSocketServerProtocol,
        content: dict
    ):
    
        response = dict(); response['type'] = 'problem_set'; response['problem_set'] = []
        try:
            with open(self.ws_server_instance.server_instance.get_module_instance('global_message_queue').get_problem_set_json_path(), 'r') as problem_set_json_file:
                response['problem_set'] = json.load(problem_set_json_file)['problem_set']
        except:
            self.log('problem_set.json is not found!', ws_server_log_level.LEVEL_ERROR)
            
        await websocket_protocol.send(json.dumps(response)); response.clear();

    async def on_online_user(
        self,
        websocket_protocol: websockets.server.WebSocketServerProtocol,
        content: dict
    ):
        response = dict(); response['type'] = 'online_user'; response['content'] = []
        for session_username in self.ws_server_instance.sessions.values():
            response['content'].append(session_username)
        
        await websocket_protocol.send(json.dumps(response)); response.clear();