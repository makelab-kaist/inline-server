import fs from 'fs';
import { Server, Socket } from 'socket.io';
import { SimpleSerial, SerialOptions } from './serial';
import { ArduinoBoard, ArduinoCli, ArduinoPlatform } from './arduino-cli';
import { ArduinoAck } from './arduino-ack';
import 'console-info';

// Helpers

const io = new Server(3000, { cors: { origin: '*' } });

/*
io.on('connection', function (socket) {
  emitInfo(socket, 'Connected');

  // On disconnect
  socket.on('disconnect', function () {
    console.log('Disconnected');
  });

  // List serial ports
  socket.on('listSerials', async function () {
    const {
      message,
      success,
    }: Ack = await ArduinoCli.getInstance().listAvailablePorts();
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
    emitInfo(socket, 'disconnected');
  });

  // Compile and Upload
  socket.on(
    'compileAndUploadSketch',
    ({ sketchPath }: { sketchPath: string }) => {
      ArduinoCli.getInstance()
        .compileAndUpload(sketchPath)
        .then((ack: Ack) => {
          console.log('====>', ack);

          emitInfo(socket, ack.message as string);
        })
        .catch((ack: Ack) => emitError(socket, ack.message as string));
    }
  );
});
*/

// var path = require('path');

// // CONNECT

// Helpers

type Message = {
  message: any;
  success: boolean;
};

function emitError(socket: Socket, message: string) {
  const m = {
    message,
    success: false,
  };
  socket.emit('error', m);
  console.log('error:', m);
}

function emitInfo(socket: Socket, message: string) {
  const m = {
    message,
    success: true,
  };
  socket.emit('info', m);
  console.log('info:', m);
}

function emitResult(socket: Socket, tag: string, message: Message) {
  socket.emit(tag, message);
  console.log(tag, ':', message);
}
