import SerialPort, { parsers } from 'serialport';

type SerialOptions = {
  portName: string;
  baud: number;
  onIncomingData?: (s: string) => void;
  delayAtStart?: number;
  autoConnect?: boolean;
};

class SimpleSerial {
  private static _instance: SimpleSerial;
  private _serialPort?: SerialPort;
  private _parser?: SerialPort.parsers.Readline;

  // options with defaults
  private _options: SerialOptions = {
    portName: '',
    baud: 115200,
    onIncomingData: (s: string) => {},
    delayAtStart: 50,
    autoConnect: false,
  };

  private constructor() {}

  static getInstance() {
    if (!SimpleSerial._instance) this._instance = new SimpleSerial();
    return this._instance;
  }

  initialize(options: SerialOptions): Promise<string> {
    if (options.portName === '') throw new Error('Not a valid port');
    this._options = { ...this._options, ...options };

    // autoconnect at initialize
    if (this._options.autoConnect) return this.connectSerial();
    return Promise.resolve('Initialized');
  }

  connectSerial(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Already connected?
      if (this.isSerialConnected()) {
        reject('Serial port already open');
        return;
      }

      try {
        this._serialPort = new SerialPort(
          this._options.portName,
          {
            baudRate: this._options.baud,
          },
          function (err) {
            if (err) {
              reject(err.message);
              return;
            }
          }
        );

        // After opening, register the callback
        this._serialPort.on('open', () => {
          setTimeout(() => {
            this._parser = this._serialPort!.pipe(
              new parsers.Readline({ delimiter: '\r\n' })
            );
            // Switches the port into "flowing mode"
            this._parser.on('data', (data) => {
              this._options.onIncomingData!(data);
            });

            // Resolve
            resolve(`Connected to ${this._options.portName}`);
            return;
          }, this._options.delayAtStart); // let's give it some time to wake up
        });
      } catch (err) {
        reject((err as Error).message);
      }
    });
  }

  disconnectSerial() {
    if (!this.isSerialConnected()) {
      return;
    }
    // stop listenting
    this._parser?.removeAllListeners();
    // close
    this._serialPort?.close();
  }

  isSerialConnected(): boolean {
    return this._serialPort?.isOpen || false;
  }

  send(commandString: string): void {
    this._serialPort?.write(`${commandString}\n\r`);
  }
}

export { SimpleSerial, SerialOptions };
