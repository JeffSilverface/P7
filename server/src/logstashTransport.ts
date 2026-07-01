import Transport from 'winston-transport';
import net from 'node:net';

export class LogstashTransport extends Transport {
  private socket: net.Socket | null = null;
  private readonly host: string;
  private readonly port: number;
  private connected = false;
  private buffer: string[] = [];

  constructor(opts: Transport.TransportStreamOptions & { host: string; port: number }) {
    super(opts);
    this.host = opts.host;
    this.port = opts.port;
    this.connect();
  }

  private connect() {
    this.socket = new net.Socket();

    this.socket.connect(this.port, this.host, () => {
      this.connected = true;
      // Flush buffered logs accumulated while disconnected
      this.buffer.forEach((line) => this.socket!.write(line));
      this.buffer = [];
    });

    this.socket.on('error', () => {
      this.connected = false;
    });

    this.socket.on('close', () => {
      this.connected = false;
      // Retry after 5s
      setTimeout(() => this.connect(), 5000);
    });
  }

  log(info: Record<string, unknown>, callback: () => void) {
    const line = JSON.stringify(info) + '\n';

    if (this.connected && this.socket) {
      this.socket.write(line);
    } else if (this.buffer.length < 100) {
      this.buffer.push(line);
    }

    callback();
  }
}
