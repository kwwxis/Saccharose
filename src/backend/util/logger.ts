import debug from 'debug';

function createDebugger(namespace: string): debug.Debugger {
  if (namespace.includes(',')) {
    const debuggers: debug.Debugger[] = [];
    for (let ns of namespace.split(',').map(ns => ns.trim()).filter(ns => !!ns)) {
      const log: debug.Debugger = debug(ns);
      log.log = console.log.bind(console);
      debuggers.push(log);
    }
    return new Proxy(function () {} as any, {
      has: function(_self, field) {
        return debuggers.every(d => field in d);
      },
      get: function(_self, field) {
        if (debuggers.every(d => field in d && typeof d[field] === 'function')) {
          return function(... args: any[]) {
            debuggers.forEach(d => d[field](... args));
          }
        } else {
          return undefined;
        }
      },
      apply: function(_self, _thisArg, argList: any[]) {
        for (let d of debuggers) {
          d.apply(d, argList);
        }
      }
    });
  } else {
    const log: debug.Debugger = debug(namespace);
    log.log = console.log.bind(console);
    return log;
  }
}

export const log: debug.Debugger = createDebugger('app');
export const error: debug.Debugger = createDebugger(`app:error`);
export const logInit: debug.Debugger = createDebugger('init');
export const logInitData: debug.Debugger = createDebugger('init:data');
export const logInitCache: debug.Debugger = createDebugger('init:cache');
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
