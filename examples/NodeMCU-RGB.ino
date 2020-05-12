#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <ArduinoJson.h>

// GitHub Page = https://github.com/Tommrodrigues/homebridge-web-rgb

// GND = Ground
// D5 = Red
// D6 = Green
// D7 = Blue
// D8 = White (if enabled below)

/////////////////// CHANGE THESE VALUES //////////////////////
const char* ssid = "SSID"; // Name of your network
const char* password = "PASSWORD"; // Password for your network
const char* mdns = "rgb"; // mDNS name
String hexString = "FFFFFF"; // Initial HEX color (FFFFFF = White)
int brightNumber = 100; // Initial Brightness (%)
const bool rgbw = false; // Whether or not to support a white channel (D8)
const float STEPS = 100; // Number of steps while fading (lower is faster)
//////////////////////////////////////////////////////////////

const int redPin = 14;
const int grnPin = 12;
const int bluPin = 13;
const int whtPin = 15;

bool state = false;
int actualR = 0, actualG = 0, actualB = 0, actualW = 0;
String oldHexString;
int r, g, b, w;

ESP8266WebServer server(80);

void setup() {
  pinMode(redPin, OUTPUT);
  pinMode(grnPin, OUTPUT);
  pinMode(bluPin, OUTPUT);
  pinMode(whtPin, OUTPUT);

  Serial.begin(115200);
  delay(10);

  // Connect to WiFi network
  Serial.println();
  Serial.println();
  Serial.println("Connecting to \"" + String(ssid) + "\"");

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int i = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(String(++i) + " ");
  }
  Serial.println();
  Serial.println("Connected successfully");

  // Print the IP address
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  if (!MDNS.begin(mdns)) {
    Serial.println("Error setting up MDNS responder!");
  }
  Serial.println("mDNS address: " + String(mdns) + ".local");

  server.on("/status", []() {
    size_t capacity = JSON_OBJECT_SIZE(3) + 51;
    DynamicJsonDocument doc(capacity);

    doc["currentState"] = state;
    doc["currentBrightness"] = brightNumber;
    doc["currentColor"] = hexString;

    String json;
    serializeJson(doc, json);
    server.send(200, "application/json", json);
  });

  server.on("/setColor", []() {
    hexString = server.arg("value");
    setLEDs();
    server.send(200);
  });

  server.on("/setBrightness", []() {
    brightNumber = server.arg("value").toInt();
    setLEDs();
    server.send(200);
  });

  server.on("/setState", []() {
    if (server.arg("value") == "true") {
      state = true;
      setLEDs();
    } else {
      oldHexString = hexString;
      hexString = "000000";
      setLEDs();
      hexString = oldHexString;
      state = false;
    }
    server.send(200);
  });
  
  // Start the server
  server.begin();
}

void setLEDs() {

  long number = (long) strtol( &hexString[0], NULL, 16);
  r = ((number >> 16) * brightNumber) / 100;
  g = ((number >> 8 & 0xFF) * brightNumber) / 100;
  b = ((number & 0xFF) * brightNumber) / 100;

  if (hexString.equals("FFFFFF") && rgbw) {
    r = 0;
    g = 0;
    b = 0;
    w = (255 * brightNumber) / 100;
  } else {
    w = 0;
  }

  float deltaR = (r - actualR) / STEPS;
  float deltaG = (g - actualG) / STEPS;
  float deltaB = (b - actualB) / STEPS;
  float deltaW = (w - actualW) / STEPS;

  if (state) {
    for (float f = 0; f < STEPS; f++) {
      analogWrite(redPin, map((actualR + (deltaR * f)), 0, 255, 0, 1023));
      analogWrite(grnPin, map((actualG + (deltaG * f)), 0, 255, 0, 1023));
      analogWrite(bluPin, map((actualB + (deltaB * f)), 0, 255, 0, 1023));
      analogWrite(whtPin, map((actualW + (deltaW * f)), 0, 255, 0, 1023));
      delay(2);
    }
    analogWrite(redPin, map(r, 0, 255, 0, 1023));
    analogWrite(grnPin, map(g, 0, 255, 0, 1023));
    analogWrite(bluPin, map(b, 0, 255, 0, 1023));
    analogWrite(whtPin, map(w, 0, 255, 0, 1023));
    actualR = r;
    actualG = g;
    actualB = b;
    actualW = w;
  }
}

void loop() {
  server.handleClient();
  MDNS.update();
}
