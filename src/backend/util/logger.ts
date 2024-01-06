import debug from 'debug';

function createDebugger(namespace: string): debug.Debugger {
  const log: debug.Debugger = debug(namespace);
  log.log = console.log.bind(console);
  return log;
}

export const log: debug.Debugger = createDebugger('app');
export const error: debug.Debugger = createDebugger(`app:error`);
export const logInit: debug.Debugger = createDebugger('init');
export const logInitData: debug.Debugger = createDebugger('init:data');
export const logShutdown: debug.Debugger = createDebugger('shutdown');
export const custom = (namespace: string): debug.Debugger => createDebugger(namespace);

export interface AsyncLog {
  (... args: any[]): Promise<void>;
}

export function asyncLogForConsole(): AsyncLog {
  return (... args: any[]): Promise<void> => {
    console.log(... args);
    return Promise.resolve();
  };
}

export function asyncLogForDebugger(obj: debug.Debugger): AsyncLog {
  return (arg0: any, ... args: any[]): Promise<void> => {
    obj(arg0, ... args);
    return Promise.resolve();
  };
}
