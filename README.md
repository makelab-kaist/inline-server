# Inline Server

A simple server that allows to compile and upload code sketches on Arduino via socket.io, as well as listening to serial output.

## Installation

- Clone the repository on your local drive and do `cd inline-server`
- Install dependencies with `npm install`
- Run `brew install arduino-cli`. For that, you need [homebrew](https://brew.sh) installed. For other systems, see the [arduino-cli docs](https://arduino.github.io/arduino-cli/0.33)
- Run `arduino-cli core update-index` and list your boards with `arduino-cli board list`
- Install some boards. For example, to install the Arduino UNO use `arduino-cli core install arduino:avr`
- Run the server with `npm run dev` (development) or `npm start` (release)

You can use the server with the Inline VSCode extension (client). Alternatively, you can write your own code (see the [Writing code to interface with the serve](#writing-code-to-interface-with-the-server) section).

## Writing code to interface with the server

These are examples of code snippets that can be used to interface with the server.

### Socket.io protocol

The Inline Server uses socket.io for communication. To see the ws protocol, refer to [this](./ws_protocol.md).

#### Arduino-cli Example

```js
ArduinoCli.getInstance()
  .listAvailablePorts()
  .then((a) => console.log(a));

ArduinoCli.getInstance().initialize(
  '/dev/cu.usbmodem544401',
  ArduinoBoard.Arduino_Uno
);

ArduinoCli.getInstance()
  .compileAndUpload('/Users/andrea/Desktop/aaa')
  .then((e) => console.log(e))
  .catch((e) => console.log(e));
```

### Simple serial

Examples of how to use the SimpleSerial (used by the server).

```js
SimpleSerial.getInstance().initialize({
  portName: '/dev/cu.usbmodem544401',
  baud: 115200,
  autoConnect: true,
  onIncomingData: function (data: string) {
    console.log(data);
  },
});

// To connect manually
SimpleSerial.getInstance()
  .connectSerial()
  .then((m) => console.log(m))
  .catch((e) => console.log(e));

setTimeout(() => {
  SimpleSerial.getInstance().disconnectSerial();
}, 10000);
```
