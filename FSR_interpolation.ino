/*
  FSR (Force Sensitive Resistor) -> Force (Newtons) conversion (12-bit ADC)

  Assumes a voltage divider:
    Vcc --- FSR ---+--- R_FIXED --- GND
                   |
                  ADC (A0)

  Then:
    Vout = Vcc * (R_FIXED / (R_FIXED + R_FSR))
    => R_FSR = R_FIXED * (Vcc / Vout - 1)

  Force model (typical for FSRs):  F(N) = A * (R_FSR ^ B)
  where A and B come from YOUR calibration.

  If your wiring is reversed (R_FIXED on top, FSR to GND), the formula changes.
*/

const int   ADC_PIN = A0;

// ---- Hardware parameters ----
const float VCC      = 5;       // volts (set to 5.0 if using 5V Arduino + AREF=Vcc)
const int   ADC_MAX  = 4095;      // 12-bit ADC range (0..4095). If your board is 10-bit, set to 1023.
const float R_FIXED  = 10000.0;   // ohms (your fixed resistor value, e.g. 10k)

// ---- Calibration parameters (REPLACE THESE) ----
// Power-law: F = A * R^B
// Typical B is negative (force increases -> resistance decreases).
const float A = 1.0e6;     // placeholder
const float B = -1.0;      // placeholder

// ---- Filtering (simple exponential smoothing) ----
const float ALPHA = 0.2;   // 0..1 (higher = less smoothing)
float forceFiltN = 0.0;

void setup() {
  Serial.begin(115200);

  // If your Arduino supports 12-bit reads, enable it (example: many SAMD, ESP32, etc.)
  // On some boards this does nothing; on others it sets the ADC resolution.
  analogReadResolution(12);
}

float adcToVoltage(int adc) {
  return (VCC * (float)adc) / (float)ADC_MAX;
}

float voltageToRfsr(float vout) {
  // Guard against divide-by-zero and saturations
  if (vout <= 0.001) return 1e9;            // ~open circuit
  if (vout >= VCC - 0.001) return 1.0;      // ~short

  // For wiring: Vcc--FSR--(ADC)--R_FIXED--GND
  return R_FIXED * (VCC / vout - 1.0);
}

float rfsrToForceN(float rfsr) {
  // Power-law model. Clamp to avoid NaNs.
  if (rfsr <= 0) return 0.0;

  float f = A * pow(rfsr, B);

  // Clamp any negative/insane values
  if (f < 0) f = 0;
  if (f > 5000) f = 5000; // safety clamp (~500 kgf)
  return f;
}

void loop() {
  int adc = analogRead(ADC_PIN);

  float vout = adcToVoltage(adc);
  float rfsr = voltageToRfsr(vout);
  float forceN = rfsrToForceN(rfsr);

  // simple smoothing
  forceFiltN = (ALPHA * forceN) + ((1.0 - ALPHA) * forceFiltN);

  Serial.print("ADC=");
  Serial.print(adc);
  Serial.print("  Vout=");
  Serial.print(vout, 4);
  Serial.print("V  Rfsr=");
  Serial.print(rfsr, 1);
  Serial.print("ohm  Force=");
  Serial.print(forceN, 2);
  Serial.print("N  ForceFilt=");
  Serial.print(forceFiltN, 2);
  Serial.println("N");

  delay(20); // ~50 Hz
}
