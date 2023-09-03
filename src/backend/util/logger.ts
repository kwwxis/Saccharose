import debug from 'debug';

function createDebugger(namespace: string): debug.Debugger {
  const log: debug.Debugger = debug(namespace);
  //log.log = console.log.bind(console);
  return log;
}

export const log: debug.Debugger = createDebugger('app');
export const error: debug.Debugger = createDebugger(`app:error`);
export const logInit: debug.Debugger = createDebugger('init');
export const logInitData: debug.Debugger = createDebugger('init:data');
export const logShutdown: debug.Debugger = createDebugger('shutdown');
export const custom = (namespace: string): debug.Debugger => createDebugger(namespace);