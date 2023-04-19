export interface DeviceBaseToggle {
   toggleName: string,
   toggleDescription?: string,
   toggleValue: boolean,
   lastChanged?: number | undefined, // Null means the toggle has never been changed.
   hasLock?: boolean | undefined, // Null means the toggle has never been changed.
}