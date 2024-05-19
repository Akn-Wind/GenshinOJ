import os, sys

try:
    import asyncio
except:
    print('Installing dependencies...')
    os.system('pip install asyncio')
    try:
        import asyncio
    except:
        print('Dependencies installation failed.')
        sys.exit(-1)

import server

# gc.disable()
class global_message_queue:
    def __init__(self, server_instance: server.server) -> None:
        # Necessary Initialization
        self.server_instance = server_instance
        self.server_instance.working_loads['global_message_queue']['instance'] = self
        
        self.message_queue = dict()

    def __del__(self) -> None:
        print('Global Message Queue unloaded.')

    def get_message_of(self, module_id: str) -> list:
        return self.message_queue[module_id]

    def push_message(self, to_module_id: str, message: dict) -> bool:
        self.message_queue[to_module_id].append(message)
    
    async def execute_command(self, command: str, timeout: int | float | None = None):
        try:
            async with asyncio.timeout(timeout):
                proc = await asyncio.create_subprocess_shell(
                    command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE)

                stdout, stderr = await proc.communicate()
                print(f'{command!r} exited with {proc.returncode}, pid={proc.pid}')
                return proc.returncode
        except TimeoutError:
            raise TimeoutError
        except Exception as e:
            raise e
