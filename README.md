# Arduino Server

A simple server that allows to compile and upload sketches on Arduino via socket.io, as well as to listen to serial output.

## Arduino-cli Example

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

## Simple serial

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

## Websockets

To see the ws protocol, refer to [this](./ws.md).
