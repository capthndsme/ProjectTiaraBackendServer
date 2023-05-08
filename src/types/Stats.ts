import { Thermometer } from "./DeviceSensors"

export enum MetricTypes {
   TEMP_COMBINED = "TEMP_COMBINED",
}


export type Stats<T> = {
   MetricID: number,
   Timestamp: number,
   MetricType: MetricTypes,
   MetricValue: T
}

// Unfortunately, our metrics is all small letters, opposed to our Thermometer Type..
export type ThermometerStat = {
   temperature?: number,
   humidity?: number
}
// Empty stat means a reading failure for a particular sensor.
export type EmptyStat = {

}
export type TempCombined = {
   inside: Thermometer | EmptyStat,
   outside: Thermometer | EmptyStat,
   // Our CPU sensor is a new addition, so we need to make sure we don't break anything.
   cpu?: Thermometer | EmptyStat 
}
