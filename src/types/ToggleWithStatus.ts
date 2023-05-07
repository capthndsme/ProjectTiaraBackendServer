import { DeviceBaseToggle } from "./DeviceBaseToggle";
import { ToggleResult } from "./ToggleResult";


export interface ToggleWithStatus extends DeviceBaseToggle {
   toggleResult: ToggleResult;
}