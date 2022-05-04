import fs from 'fs';
import temp from 'temp';
import path from 'path';
import { Server, Socket } from 'socket.io';
import { SimpleSerial, SerialOptions } from './serial';
import { ArduinoBoard, ArduinoCli, ArduinoPlatform } from './arduino-cli';
import { ArduinoAck } from './arduino-ack';
import 'console-info';
import 'console-error';
import 'console-warn';

const PORT = 3000;

const io = new Server(PORT, { cors: { origin: '*' } });
console.info(`listening on port ${PORT}`);

io.on('connection', function (socket) {
  emitInfo(socket, 'Connected');

  // On disconnect
  socket.on('disconnect', function () {
    console.warn('Disconnected');
  });

  // List serial ports
  socket.on('listSerials', async function () {
    const {
      message,
      success,
    }: ArduinoAck = await ArduinoCli.getInstance().listAvailablePorts();
    if (!success) {
      emitError(socket, message as string);
    } else {
      emitResult(socket, 'listSerialsData', { message, success });
    }
  });

  // Initialize serial
  socket.on(
    'beginSerial',
    ({ portName, baud = 115200, autoConnect = true }: SerialOptions) => {
      // connect to serial
      SimpleSerial.getInstance()
        .initialize({
          portName,
          baud,
          onIncomingData: (data: string) => {
            emitResult(socket, 'serialData', { message: data, success: true });
          },
          autoConnect,
        })
        .then((_) => {
          ArduinoCli.getInstance().initialize(
            portName,
            ArduinoBoard.Arduino_Uno
          );
          emitInfo(socket, 'Port initialized');
        })
        .catch((err) => emitError(socket, err));
    }
  );

  // Connect / disconnect serial
  socket.on('connectSerial', () => {
    SimpleSerial.getInstance()
      .connectSerial()
      .then((res) => emitInfo(socket, res))
      .catch((err) => emitError(socket, err));
  });

  socket.on('disconnectSerial', () => {
    SimpleSerial.getInstance().disconnectSerial();
    emitInfo(socket, 'Disconnected');
  });

  // Compile and Upload
  socket.on(
    'compileAndUploadSketch',
    ({ sketchPath }: { sketchPath: string }) => {
      ArduinoCli.getInstance()
        .compileAndUpload(sketchPath)
        .then(({ message }: ArduinoAck) => {
          emitInfo(socket, message as string);
        })
        .catch(({ message }: ArduinoAck) =>
          emitError(socket, message as string)
        );
    }
  );

  // Compile and upload a string of code (it creates a temporary sketch)
  socket.on('compileAndUploadCode', ({ code }: { code: string }) => {
    createTempSketch(code).then((sketchPath) => {
      ArduinoCli.getInstance()
        .compileAndUpload(sketchPath)
        .then(({ message }: ArduinoAck) => {
          emitInfo(socket, message as string);
        })
        .catch(({ message }: ArduinoAck) =>
          emitError(socket, message as string)
        );
    });
  });
});

// Helpers

function emitError(socket: Socket, message: string) {
  const m = {
    message,
    success: false,
  };
  socket.emit('error', m);
  console.error('error:', m);
}

function emitInfo(socket: Socket, message: string) {
  const m = {
    message,
    success: true,
  };
  socket.emit('info', m);
  console.info('info:', m);
}

function emitResult(socket: Socket, tag: string, message: ArduinoAck) {
  socket.emit(tag, message);
  console.log(tag, ':', message);
}

function createTempSketch(code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    temp.mkdir('sketch', function (err, dirPath) {
      const sketchName = path.basename(dirPath);
      const inputPath = path.join(dirPath, sketchName + '.ino');
      fs.writeFile(inputPath, code, function (err) {
        if (err) return reject(err.message);
        return resolve(dirPath);
      });
    });
  });
}
