## 1. On connection

Server `connection`:

```json
{ "message": "Connected", "success": true }
```

---

## 2. List serials

Client: `listSerials`

Server: `listSerialsData`

```json
{
  "message": ["/dev/cu.Bluetooth-Incoming-Port", "/dev/cu.usbmodem544401"],
  "success": true
}
```

---

## 3. Begin serial

Client: `beginSerial`

```json
{
  "portName": "/dev/tty.usbmodem544401",
  "baud": 115200,
  "autoConnect": false
}
```

Server:

```json
{
  "message": "Port initialized",
  "success": true
}
```

---

## 4. Connect or disconnect

Client: `connectSerial` or `disconnectSerial`

Server:

```json
{
  "message": "Connected to /dev/tty.usbmodem544401",
  "success": true
}
```

```json
{
  "message": "Disconnected",
  "success": true
}
```

Example errors

```json
{
  "message": "\"path\" is not defined: ",
  "success": false
}

{
    "message": "Serial port already open",
    "success": false
}
```

---

## 5. Receiving data

Server:

```json
{
  "message": "hello",
  "success": true
}
```

---

## 6. Upload a sketch

Prerequisite: `beginSerial` has been called

Client: `compileAndUploadSketch`

```json
{
  "sketchPath": "/Desktop/sketch"
}
```

Server:

```json
{
  "message": "Sketch uses 1960 bytes (6%) of program storage space. Maximum is 32256 bytes.\nGlobal variables use 194 bytes (9%) of dynamic memory, leaving 1854 bytes for local variables. Maximum is 2048 bytes.\n",
  "success": true
}
```

---

## 6. Upload code

Prerequisite: `beginSerial` has been called

Client: `compileAndUploadCode`

```json
{
  "code": "void setup()\n{\n    Serial.begin(115200);\n    pinMode(LED_BUILTIN, OUTPUT);\n}\n\nvoid loop()\n{\n    digitalWrite(LED_BUILTIN, HIGH);\n    delay(100);\n    digitalWrite(LED_BUILTIN, LOW);\n    delay(100);\n    Serial.println(\"hello\");\n}"
}
```

Server:

```json
{
  "message": "Sketch uses 1960 bytes (6%) of program storage space. Maximum is 32256 bytes.\nGlobal variables use 194 bytes (9%) of dynamic memory, leaving 1854 bytes for local variables. Maximum is 2048 bytes.\n",
  "success": true
}
```
