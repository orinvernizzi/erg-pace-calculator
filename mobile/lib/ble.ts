import { BleManager, type Device } from "react-native-ble-plx";
import { PM5_DISCOVERY_SERVICE, PM5_ROWING_SERVICE } from "./pm5";

let manager: BleManager | null = null;

export function getBleManager() {
  if (!manager) manager = new BleManager();
  return manager;
}

export function scanPm5(onDevice: (device: Device) => void): () => void {
  const ble = getBleManager();
  ble.startDeviceScan([PM5_DISCOVERY_SERVICE], { allowDuplicates: false }, (error, device) => {
    if (error || !device) return;
    onDevice(device);
  });
  return () => ble.stopDeviceScan();
}

export async function connectAndDiscover(device: Device) {
  const connected = await device.connect();
  await connected.discoverAllServicesAndCharacteristics();
  const services = await connected.services();
  const rowing = services.find((s) => s.uuid.toUpperCase() === PM5_ROWING_SERVICE);
  return { connected, rowing };
}
