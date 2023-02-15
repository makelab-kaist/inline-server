import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { ArduinoAck } from './arduino-ack';
const exec = promisify(require('child_process').exec);

// Default platforms
enum ArduinoPlatform {
  avr = 'arduino:avr',
  /* Feel free to add more */
}

// Default baords
enum ArduinoBoard {
  Arduino_Uno = 'arduino:avr:uno',
  Adafruit_CircuitPlayground = 'arduino:avr:circuitplay32u4cat',
  Arduino_BT = 'arduino:avr:bt',
  Arduino_Duemilanove_or_Diecimila = 'arduino:avr:diecimila',
  Arduino_Esplora = 'arduino:avr:esplora',
  Arduino_Ethernet = 'arduino:avr:ethernet',
  Arduino_Fio = 'arduino:avr:fio',
  Arduino_Gemma = 'arduino:avr:gemma',
  Arduino_Industrial_101 = 'arduino:avr:chiwawa',
  Arduino_Leonardo = 'arduino:avr:leonardo',
  Arduino_Leonardo_ETH = 'arduino:avr:leonardoeth',
  Arduino_Mega_ADK = 'arduino:avr:megaADK',
  Arduino_Mega_or_Mega_2560 = 'arduino:avr:mega',
  Arduino_Micro = 'arduino:avr:micro',
  Arduino_Mini = 'arduino:avr:mini',
  Arduino_NG_or_older = 'arduino:avr:atmegang',
  Arduino_Nano = 'arduino:avr:nano',
  Arduino_Pro_or_Pro_Mini = 'arduino:avr:pro',
  Arduino_Robot_Control = 'arduino:avr:robotControl',
  Arduino_Robot_Motor = 'arduino:avr:robotMotor',
  Arduino_Uno_Mini = 'arduino:avr:unomini',
  Arduino_Uno_WiFi = 'arduino:avr:unowifi',
  Arduino_Yun = 'arduino:avr:yun',
  Arduino_Yun_Mini = 'arduino:avr:yunmini',
  LilyPad_Arduino = 'arduino:avr:lilypad',
  LilyPad_Arduino_USB = 'arduino:avr:LilyPadUSB',
  Linino_One = 'arduino:avr:one',
}

type RawAck = {
  message: string;
  success: boolean;
};

class ArduinoCli {
  private static _instance: ArduinoCli;
  private _portName: string = '';
  private _fqbn: ArduinoBoard = ArduinoBoard.Arduino_Uno;

  private constructor() {}

  static getInstance() {
    if (!ArduinoCli._instance) this._instance = new ArduinoCli();
    return this._instance;
  }

  get platform(): string {
    return this._fqbn.toString();
  }

  set board(b: string) {
    const bd = (ArduinoBoard as any)[b];
    if (!bd) throw new Error('Selected board does not exist');
    this._fqbn = bd;
  }

  initialize(port: string, board: ArduinoBoard) {
    this._portName = port;
    this._fqbn = board;
  }

  version(): Promise<ArduinoAck> {
    return this.run(`version`, __dirname)
      .then((cli: any) => {
        return {
          success: true,
          message: cli.VersionString,
        };
      })
      .catch((e) => {
        return {
          success: false,
          message: 'arduino-cli not installed',
        };
      });
  }

  installPlatform(platform: ArduinoPlatform): Promise<ArduinoAck> {
    return this.run(`core install ${platform}`, __dirname)
      .then((cli: any) => {
        return {
          success: true,
          message: `${platform} installed`,
        };
      })
      .catch((e) => {
        return {
          success: false,
          message: `Unable to install ${platform}`,
        };
      });
  }

  installCurrentPlatform(): Promise<ArduinoAck> {
    const platform = this._fqbn
      .split(':')
      .slice(0, 2)
      .join(':') as ArduinoPlatform; // arduino:avr:uno -> arduino:avr

    return this.installPlatform(platform);
  }

  listAvailablePorts(): Promise<ArduinoAck> {
    return new Promise(async (resolve) => {
      const { message } = await this.run(`board list`, __dirname);
      const payload = JSON.parse(message);
      const ports = payload.map(({ port }: any) => port.address);

      resolve({
        success: true,
        message: ports,
      });
    });
  }

  listAvailableBoards(): Promise<ArduinoAck> {
    return new Promise(async (resolve) => {
      resolve({
        success: true,
        message: Object.keys(ArduinoBoard),
      });
    });
  }

  async compileAndUpload(sketchPath: string): Promise<ArduinoAck> {
    const compileRes = await this.compileSketch(sketchPath);
    if (!compileRes.success) throw compileRes;
    const uploadRes = await this.uploadSketch(sketchPath);
    if (!uploadRes.success) throw uploadRes;

    // Done - return the stats from the compiler
    return compileRes;
  }

  compileSketch(sketchPath: string): Promise<ArduinoAck> {
    return this.canCompile(sketchPath).then((_) => {
      const res = this.run(`compile -b ${this._fqbn}`, sketchPath);
      return res.then(({ message }) => {
        const { compiler_out, compiler_err, success } = JSON.parse(message);
        if (success)
          return {
            message: compiler_out,
            success,
          };
        else
          return {
            message: compiler_err,
            success,
          };
      });
    });
  }

  uploadSketch(sketchPath: string): Promise<ArduinoAck> {
    return this.canCompile(sketchPath).then((_) => {
      return this.run(
        `upload --port ${this._portName} --fqbn ${this._fqbn}`,
        sketchPath
      );
    });
  }

  // Private methods
  private canCompile(sketchPath: string): Promise<ArduinoAck> {
    return new Promise((resolve, reject) => {
      const sketchName = path.basename(sketchPath) + '.ino';

      if (
        !fs.existsSync(sketchPath) ||
        !fs.existsSync(path.join(sketchPath, sketchName)) // name.ino
      )
        return reject({
          success: false,
          message: `Sketch folder "${sketchPath}" is invalid or "${sketchName}" does not exist`,
        });

      if (!this.isReady())
        return reject({
          success: false,
          message: `Board not initialized`,
        });

      resolve({ success: true, message: 'Can compile' });
    });
  }

  private isReady(): boolean {
    return (
      this._portName !== undefined &&
      this._portName !== '' &&
      this._fqbn !== undefined
    );
  }

  /**
   *
   * @param command - the command to execute appended to `arduino-cli`
   * @param baseDirectoryPath - the location of the sketch (default none)
   * @returns Promise<any>
   */
  // This is used to interact with the output from ArduinoCLI
  private run(command: string, baseDirectoryPath: string): Promise<RawAck> {
    const workingDir = { cwd: baseDirectoryPath };
    return new Promise((resolve, reject) => {
      return exec(`arduino-cli ${command} --format json`, workingDir)
        .then(({ stdout }: any) => {
          const res = {
            message: stdout == '' ? 'OK' : stdout,
            success: true,
          };
          resolve(res);
        })
        .catch(({ stdout, stderr }: any) => {
          const res = {
            message: stdout == '' ? stderr : stdout,
            success: false,
          };
          resolve(res);
        });
    });
  }
}

export { ArduinoBoard, ArduinoCli, ArduinoPlatform };
