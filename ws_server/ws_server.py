import os, abc, json, enum, random, typing, logging, importlib

import asyncio, websockets.server

import server


def generate_session_token(session_token_seed: int) -> str:
    if session_token_seed > 1:
        generated_session_token = ""
        generated_session_token =                    \
        generated_session_token                      \
        +                                            \
        chr(session_token_seed * 1  % 26 + ord("a")) \
        +                                            \
        chr(session_token_seed * 3  % 26 + ord("a")) \
        +                                            \
        chr(session_token_seed * 5  % 26 + ord("a")) \
        +                                            \
        chr(session_token_seed * 7  % 26 + ord("a")) \
        +                                            \
        chr(session_token_seed * 9  % 26 + ord("a")) \
        +                                            \
        chr(session_token_seed * 11 % 26 + ord("a")) \
        +                                            \
        chr(session_token_seed * 13 % 26 + ord("a")) \
        +                                            \
        chr(session_token_seed * 15 % 26 + ord("a"))
        return generated_session_token + generate_session_token(
            int(session_token_seed / 5))
    else:
        return "s"


WS_SERVER_CONFIG_JSON_PATH = os.getcwd() + "/ws_server/ws_server_config.json"


class ws_server:

    def __init__(self,
                 server_instance: server.server,
                 server_host="0.0.0.0",
                 server_port=9982) -> None:
        # Necessary Initialization
        self.server_instance = server_instance
        self.server_instance.working_loads["ws_server"]["instance"] = self

        self.sessions = dict()
        with open(WS_SERVER_CONFIG_JSON_PATH,
                  "r") as ws_server_config_json_file:
            self.ws_server_config = json.load(ws_server_config_json_file)

        self.ws_server_applications_config = self.ws_server_config[
            "ws_server_applications"]
        self.ws_server_applications: list[ws_server_application_protocol] = []
        if self.ws_server_config["enable_default_ws_server_application"]:
            self.ws_server_applications.append(
                simple_ws_server_application(self))

        for ws_server_application_config in self.ws_server_applications_config:
            if ws_server_application_config["enabled"]:
                self.ws_server_applications.append(
                    getattr(
                        getattr(
                            getattr(
                                importlib.__import__(
                                    ws_server_application_config["path"]),
                                "ws_server_applications"),
                            ws_server_application_config["id"]),
                        ws_server_application_config["id"])(self))

        self.ws_server = websockets.server.serve(self.receive,
                                                 server_host,
                                                 server_port,
                                                 max_size=None)
        self.server_instance.tasks.append(self.ws_server)

    def __del__(self) -> None:
        print("Websocket Server unloaded.")

    async def receive(
            self,
            websocket_protocol: websockets.server.WebSocketServerProtocol):
        try:
            async for original_message in websocket_protocol:
                message = json.loads(original_message)
                if len(original_message) <= 500:
                    print(message)
                else:
                    print("TL; DR")

                try:
                    for ws_server_application in self.ws_server_applications:
                        try:
                            await getattr(ws_server_application,
                                          format("on_" + message["type"]))(
                                              websocket_protocol,
                                              message["content"])
                            await asyncio.sleep(0)
                        except AttributeError as e:
                            pass
                        except Exception as e:
                            raise e
                except Exception as e:
                    raise e

            await asyncio.sleep(0)
        except Exception as e:
            if type(e
                    ) is not websockets.exceptions.ConnectionClosedOK and type(
                        e) is not websockets.exceptions.ConnectionClosedError:
                raise e

            for ws_server_application in self.ws_server_applications:
                try:
                    await ws_server_application.on_close_connection(
                        websocket_protocol)
                    await asyncio.sleep(0)
                except AttributeError as e:
                    logging.critical("`on_close_connection` callback not found. Maybe you haven't implemented it yet?")
                    raise e
                except Exception as e:
                    raise e

            await websocket_protocol.close()
            return

        try:
            while True:
                await websocket_protocol.recv()
                await asyncio.sleep(0)

        except websockets.exceptions.ConnectionClosed:
            try:
                for ws_server_application in self.ws_server_applications:
                    try:
                        await ws_server_application.on_close_connection(
                            websocket_protocol)
                        await asyncio.sleep(0)
                    except AttributeError as e:
                        logging.critical("`on_close_connection` callback not found. Maybe you haven't implemented it yet?")
                        raise e
                    except Exception as e:
                        raise e
            except Exception as e:
                raise e
            
            await websocket_protocol.close()
        except Exception as e:
            raise e

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
    def __init__(self, ws_server_instance: ws_server):
        self.ws_server_instance: ws_server = ws_server_instance

    @abc.abstractmethod
    def log(self,
            log: str,
            log_level: ws_server_log_level = ws_server_log_level.LEVEL_INFO):
        """
        Logging method
        Args:
            log (str): Log information
            log_level (ws_server_log_level): Logging level
        Info:
            It is suggested that you should override this method to distinguish between the official application and yours.
        """
        if log_level is ws_server_log_level.LEVEL_INFO:
            print("[WS_SERVER] [INFO] {}".format(log))
        if log_level is ws_server_log_level.LEVEL_DEBUG:
            print("[WS_SERVER] [DEBUG] {}".format(log))
        if log_level is ws_server_log_level.LEVEL_WARNING:
            print("[WS_SERVER] [WARNING] {}".format(log))
        if log_level is ws_server_log_level.LEVEL_ERROR:
            print("[WS_SERVER] [ERROR] {}".format(log))

    @abc.abstractmethod
    async def on_close_connection(
        self,
        websocket_protocol: websockets.server.WebSocketServerProtocol,
    ):
        """ 
        Callback method `on_close_connection`
        Info:
            You need to implement this method to do the specific actions you want whenever a connection is being closed.
        """
        self.log("Closed connection from {}:{}".format(
            websocket_protocol.remote_address[0],
            websocket_protocol.remote_address[1]))
        await websocket_protocol.close()


class simple_ws_server_application(ws_server_application_protocol):
    """
    A simple, official implementation of websocket server application, providing some simple plugins.
    """
    is_logged_in = False
    def log(self,
            log: str,
            log_level: ws_server_log_level = ws_server_log_level.LEVEL_INFO):
        return super().log(log, log_level)

    async def on_login(
        self,
        websocket_protocol: websockets.server.WebSocketServerProtocol,
        content: dict,
    ):
        """
        Official callback method for login with a authentication plugin.
        """
        setattr(self, "is_logged_in", False)
        password_hash = self.get_md5(content["password"])
        self.log("The user {} try to login with the hash: {}.".format(
            content["username"], password_hash))
        self.ws_server_instance.server_instance.get_module_instance(
            "db_connector").database_cursor.execute(
                "SELECT password FROM users WHERE username = \"{}\";".format(
                    content["username"]))
        tmp = self.ws_server_instance.server_instance.get_module_instance(
            "db_connector").database_cursor.fetchone()

        real_password_hash = None
        try:
            real_password_hash = tmp[0]
        except:
            self.log(
                "The user {} failed to login.".format(content["username"]),
                ws_server_log_level.LEVEL_ERROR)
            response = {
                "type": "quit",
                "content": {
                    "reason": "authentication_failure",
                    "request_key": content["request_key"]
                }
            }
            await websocket_protocol.send(json.dumps(response))
            response.clear()

        if real_password_hash != None and real_password_hash == password_hash:
            new_session_token = generate_session_token(
                random.randint(1000000000000000, 10000000000000000))

            self.log("The user {} logged in successfully.".format(
                content["username"]))
            self.ws_server_instance.sessions[new_session_token] = content[
                "username"]
            self.log("The session token: {}".format(new_session_token))
            setattr(self, "username", content["username"])
            setattr(self, "session_token", new_session_token)
            response = {
                "type": "session_token",
                "content": {
                    "session_token": new_session_token,
                    "request_key": content["request_key"]
                }
            }
            await websocket_protocol.send(json.dumps(response))
            response.clear()
        else:
            self.log(
                "The user {} failed to login.".format(content["username"]),
                ws_server_log_level.LEVEL_ERROR)
            response = {
                "type": "quit",
                "content": {
                    "reason": "authentication_failure",
                    "request_key": content["request_key"]
                }
            }
            await websocket_protocol.send(json.dumps(response))
            response.clear()

    async def on_close_connection(
        self,
        websocket_protocol: websockets.server.WebSocketServerProtocol,
    ):
        await super().on_close_connection(websocket_protocol)
        if self.is_logged_in:
            self.is_logged_in = False
            await self.on_quit(websocket_protocol, {
                "username": self.username,
                "session_token": self.session_token
            })
        else:
            await self.on_quit(websocket_protocol, None)

    async def on_quit(
            self,
            websocket_protocol: websockets.server.WebSocketServerProtocol,
            content: dict | None):
        if content != None:
            self.log("The user {} quitted with session token: {}".format(
                content["username"], content["session_token"]))
            try:
                del self.ws_server_instance.sessions[content["session_token"]]
            except KeyError as e:
                logging.exception(e)
            except AttributeError as e:
                logging.exception(e)
            except Exception as e:
                raise e

            await self.on_close_connection(websocket_protocol)

    def get_md5(self, data):
        import hashlib
        hash = hashlib.md5("add-some-salt".encode("utf-8"))
        hash.update(data.encode("utf-8"))
        return hash.hexdigest()

    async def on_register(
            self,
            websocket_protocol: websockets.server.WebSocketServerProtocol,
            content: dict):
        """
        Official callback method for registration
        """
        response = dict()
        username = content["username"]
        password = content["password"]
        password_hash = self.get_md5(password)
        self.log("The user {} try to register with hash: {}.".format(
            username, password_hash))
        self.ws_server_instance.server_instance.get_module_instance(
            "db_connector").database_cursor.execute(
                f"SELECT password FROM users WHERE username = \"{username}\";")
        tmp = self.ws_server_instance.server_instance.get_module_instance(
            "db_connector").database_cursor.fetchone()
        if tmp == None:
            try:
                self.ws_server_instance.server_instance.get_module_instance(
                    "db_connector"
                ).database_cursor.execute(
                    f"INSERT INTO users (username, password) VALUES (\"{username}\", \"{password_hash}\");"
                )
                self.ws_server_instance.server_instance.get_module_instance(
                    "db_connector").database.commit()
                self.log(
                    "The user {} registered successfully.".format(username))
            except:
                self.ws_server_instance.server_instance.get_module_instance(
                    "db_connector").database.rollback()

            response = {
                "type": "quit",
                "content": {
                    "reason": "registration_success",
                    "request_key": content["request_key"]
                }
            }
            await websocket_protocol.send(json.dumps(response))
            response.clear()
        else:
            self.log("The user {} failed to register.".format(username),
                     ws_server_log_level.LEVEL_ERROR)
            response = {
                "type": "quit",
                "content": {
                    "reason": "registration_failure",
                    "request_key": content["request_key"]
                }
            }
            await websocket_protocol.send(json.dumps(response))
            response.clear()

    async def on_online_user(
            self,
            websocket_protocol: websockets.server.WebSocketServerProtocol,
            content: dict):
        response = dict()
        response["type"] = "online_user"
        response["content"] = {
            "online_users": [],
            "request_key": content["request_key"]
        }
        for session_username in self.ws_server_instance.sessions.values():
            response["content"]["online_users"].append(session_username)

        await websocket_protocol.send(json.dumps(response))
        response.clear()
