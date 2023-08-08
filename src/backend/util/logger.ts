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


declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Console {
    inspect(... args: any[]): void;
  }
}

console.inspect = (... args: any[]): void => {
  let newArgs = [];
  for (let arg of args) {
    if (typeof arg === 'undefined' || arg === null || typeof arg === 'number' || typeof arg === 'boolean' || typeof arg === 'string') {
      newArgs.push(arg);
    } else {
      newArgs.push(util.inspect(arg, false, null, true))
    }
  }
  console.log(... newArgs);
};