import debug from 'debug';
import util from 'util';

console.log(process.env.DEBUG);

function createDebugger(namespace: string): debug.Debugger {
  const log: debug.Debugger = debug(namespace);
  //log.log = console.log.bind(console);
  return log;
}

export const log: debug.Debugger = createDebugger('app');
export const error: debug.Debugger = createDebugger(`app:error`);
export const custom = (namespace: string): debug.Debugger => createDebugger(namespace);