import os, sys, json, typing, importlib

try:
    import asyncio
except:
    print('Installing dependencies...')
    os.system('pip install asyncio nest-asyncio')
    try:
        import asyncio
    except ImportError:
        print('Dependencies installation failed.')
        sys.exit(-1)


class server:

    def __init__(self) -> None:
        self.working_loads: dict = dict()
        self.MODULE_CONFIG_JSON_PATH: str = os.getcwd() + '/module_config.json'
        self.tasks: list = []
        asyncio.get_event_loop_policy().get_event_loop().set_debug(True)
        asyncio.get_event_loop().run_until_complete(self.async_main())

    def __del__(self) -> None:
        print('Server stopped.')

    async def async_main(self):
        print('Server started.')
        with open(self.MODULE_CONFIG_JSON_PATH,
                  'r') as self.module_config_json_file:
            self.module_config = json.load(self.module_config_json_file)

        self.working_loads_config = self.module_config['working_load']
        for working_load_config in self.working_loads_config:
            if working_load_config['enabled']:
                print('Loading {} (id: {})...'.format(
                    working_load_config['name'], working_load_config['id']))
                dependencies_satisfied_flag = True
                for dependency in working_load_config['dependencies']:
                    print('Checking dependency: {}'.format(dependency))
                    # print(self.working_loads[dependency])
                    if not dependency in self.working_loads:
                        dependencies_satisfied_flag = False
                        break

                if not dependencies_satisfied_flag:
                    print(
                        'Module {} (id: {}) do not have all its dependencies, so it will be ignored.'
                        .format(working_load_config['name'],
                                working_load_config['id']))
                    continue

                # self.get_module_instance('global_message_queue')
                print('Loaded {} (id: {}).'.format(working_load_config['name'],
                                                   working_load_config['id']))
                self.working_loads[
                    working_load_config['id']] = working_load_config
                getattr(
                    getattr(importlib.__import__(working_load_config['path']),
                            working_load_config['id']),
                    working_load_config['id'])(self)

        await asyncio.gather(*tuple(self.tasks))
        asyncio.get_event_loop().run_forever()

    def get_module_instance(self, module_id: str) -> typing.Any:
        # print('Now working loads: {}'.format(self.working_loads))
        return self.working_loads[module_id]['instance']


if __name__ == '__main__':  # Main
    server()
