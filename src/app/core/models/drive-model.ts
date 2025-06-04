export interface DriveModel{
    Name:string,
    Label:string,
    TotalSpace:number,
    AvailableSpace:number,
}

export function defaultDriveModel():DriveModel{
    return {
        Name:"C:",
        Label:"C",
        TotalSpace:100,
        AvailableSpace:100
    }
}