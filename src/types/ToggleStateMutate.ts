export type ToggleStateMutate = { 
  // deviceId: string,  // This seems redundant, since the deviceId is already in the client's subscribed hwid.
                        // Additionally we are not really expecting clients to be able to toggle devices that arent called by "setActiveDevice" first.
   toggleName: string,
   toggleValue: boolean
}