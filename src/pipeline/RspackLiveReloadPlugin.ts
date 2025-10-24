import { Compiler, Stats } from '@rspack/core';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { WebSocketServer, WebSocket  } from 'ws';
import { RspackPluginInstance } from '@rspack/core';

export interface LiveReloadPluginOptions {
  port?: number;
  delay?: number;
  protocol?: 'http' | 'https';
  hostname?: string;
  key?: string;
  cert?: string;
  quiet?: boolean;
}

export class LiveReloadPlugin implements RspackPluginInstance{
  private readonly options: Required<LiveReloadPluginOptions>;
  private wss?: WebSocketServer;
  private httpServer?: http.Server | https.Server;
  private lastHash?: string;
  private firstBuild: boolean = true;

  constructor(options: LiveReloadPluginOptions = {}) {
    this.options = {
      port: options.port ?? 35729,
      delay: options.delay ?? 0,
      protocol: options.protocol ?? 'http',
      hostname: options.hostname ?? 'localhost',
      key: options.key ?? '',
      cert: options.cert ?? '',
      quiet: options.quiet ?? false,
    };
  }

  apply(compiler: Compiler): void {
    if (!compiler.options.watch) {
      return;
    }

    const { port, protocol, hostname, delay, key, cert, quiet } = this.options;

    // --- 1. Create HTTP(S) server for livereload.js + WebSocket upgrade ---
    if (!this.httpServer) {
      const serverOptions: https.ServerOptions | http.ServerOptions =
        protocol === 'https' && key && cert
          ? {
            key: fs.readFileSync(key),
            cert: fs.readFileSync(cert),
          }
          : {};

      const requestListener: http.RequestListener = (req, res) => {
        if (req.url === '/livereload.js') {
          res.writeHead(200, { 'Content-Type': 'application/javascript' });
          res.end(this.getClientScript());
        } else {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Live Reload server');
        }
      };

      if (protocol === 'https') {
        this.httpServer = https.createServer(serverOptions, requestListener);
      } else {
        this.httpServer = http.createServer(serverOptions, requestListener);
      }

      this.httpServer.on('error', (err) => {
        if (!quiet) console.error('[LiveReload] Server error:', err);
      });

      // --- 2. Attach WebSocket server ---
      this.wss = new WebSocketServer({ server: this.httpServer });

      // this.wss.on('connection', (ws) => {
      //   if (!quiet) console.log('[LiveReload] Client connected');
      // });

      this.wss.on('error', (err) => {
        if (!quiet) console.error('[LiveReload] WebSocket error:', err);
      });

      this.httpServer.listen(port, '0.0.0.0', () => {
        if (!quiet) console.log(`[LiveReload] Listening on port ${port}`);
      });
    }

    // --- 3. Hook into Rspack compiler build completion ---
    compiler.hooks.done.tap('LiveReloadPlugin', (stats: Stats) => {
      const newHash = stats.hash ?? '';

      // Skip reload on first build
      if (this.firstBuild) {
        this.firstBuild = false;
        this.lastHash = newHash;
        return;
      }

      const info = stats.toJson({ all: false, warnings: true, errors: true });

      if (info.errors?.length) {
        if (!quiet) console.error('[LiveReload] Build errors:', info.errors);
        // Optionally, could send overlay events to clients here.
      }

      if (info.warnings?.length) {
        if (!quiet) console.warn('[LiveReload] Build warnings:', info.warnings);
      }

      if (newHash && newHash !== this.lastHash) {
        this.lastHash = newHash;
        if (!quiet) console.log('[LiveReload] Detected changes, reloading...');
        setTimeout(() => this.broadcast({ type: 'reload' }), delay);
      } else {
        if (!quiet) console.log('[LiveReload] No changes, skipping reload.');
      }
    });
  }

  private broadcast(msg: unknown): void {
    if (!this.wss) return;
    const data = JSON.stringify(msg);
    for (const client of this.wss.clients) {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      } catch (err) {
        if (!this.options.quiet) console.error('[LiveReload] WebSocket send error:', err);
      }
    }
  }

  private getClientScript(): string {
    // language=JS
    return `
      (() => {
        const port = ${this.options.port};
        const hostname = '${this.options.hostname}';
        const protocol = location.protocol === 'https:' ? 'wss' : 'ws';

        let socket = null;
        let reconnectTimeout = 1000;
        const maxTimeout = 30000;

        const connect = () => {
          socket = new WebSocket(protocol + '://' + hostname + ':' + port);

          socket.addEventListener('open', () => {
            console.log('[LiveReload] Connected to server.');
            reconnectTimeout = 1000;
          });

          socket.addEventListener('message', (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'reload') location.reload();
          });

          socket.addEventListener('close', () => {
            console.warn('[LiveReload] Disconnected. Reconnecting in', reconnectTimeout, 'ms');
            setTimeout(connect, reconnectTimeout);
            reconnectTimeout = Math.min(reconnectTimeout * 2, maxTimeout);
          });

          socket.addEventListener('error', (err) => {
            console.error('[LiveReload] Connection error:', err);
            socket.close();
          });
        };

        connect();
      })();
    `;
  }
}
