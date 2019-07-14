#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>

// GitHub Page = https://github.com/Tommrodrigues/homebridge-nodemcu-rgb

//GND = Ground
//D5 = Red
//D6 = Green
//D7 = Blue
//D8 = White (if enabled below)

/////////////////// CHANGE THESE VALUES //////////////////////
const char* ssid = "SSID"; //Name of your network
const char* password = "PASSWORD"; //Password for your network
const char* mdns = "rgb"; //mDNS name
String hexString = "FFFFFF"; //Initial HEX color (FFFFFF = White)
int brightNumber = 100; //Initial Brightness (%)
const bool rgbw = false; //Whether or not to support a white channel (D8)
const float STEPS = 100; //Number of steps while fading (lower is faster)
//////////////////////////////////////////////////////////////

const int redPin = 14;
const int grnPin = 12;
const int bluPin = 13;
const int whtPin = 15;

bool state = false;
int actualR = 0, actualG = 0, actualB = 0, actualW = 0;
String oldHexString;
int r, g, b, w;

WiFiServer server(80);

void setup() {
  Serial.begin(115200);
  delay(10);

  pinMode(redPin, OUTPUT);
  pinMode(grnPin, OUTPUT);
  pinMode(bluPin, OUTPUT);
  pinMode(whtPin, OUTPUT);

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

  // Start the server
  server.begin();

  // Print the IP address
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  if (!MDNS.begin(mdns)) {
    Serial.println("Error setting up MDNS responder!");
  }
  Serial.println("mDNS address: " + String(mdns) + ".local");
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

  MDNS.update();

  // Check if a client has connected
  WiFiClient client = server.available();
  if (!client) {
    return;
  }

  // Wait until the client sends some data
  Serial.println("New client");
  while (!client.available()) {
    delay(1);
  }

  // Read the first line of the request
  String request = client.readStringUntil('\r');
  Serial.println(request);
  client.flush();

  // Return the response
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: text/html");
  client.println();

  // Match the request
  if (request.indexOf("/status") != -1) {
    client.println("{\"currentState\": " + String(state) + ",");
    client.println("\"currentBrightness\": " + String(brightNumber) + ",");
    client.println("\"currentColor\": \"" + String(hexString) + "\"}");
  }

  if (request.indexOf("/setColor") != -1) {
    hexString = (request.substring(14, 20));
    setLEDs();
  }

  if (request.indexOf("/setBrightness") != -1) {
    brightNumber = request.substring(19, 22).toInt();
    setLEDs();
  }

  if (request.indexOf("/setState/true") != -1) {
    state = true;
    setLEDs();
  }

  if (request.indexOf("/setState/false") != -1) {
    oldHexString = hexString;
    hexString = "000000";
    setLEDs();
    hexString = oldHexString;
    state = false;
  }

  delay(1);
  Serial.println("Client disconnected");
  Serial.println();

}
