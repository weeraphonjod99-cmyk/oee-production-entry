export type ShiftCode = "白" | "夜" | "A" | "B" | string;

export type Machine = {
  id: string;
  name: string;
  capacityUnits: number;
  capacityMinutes: number;
  hasStep: boolean;
  rowCount: number;
};

export type ProductMaster = {
  id: string;
  machineId: string;
  machineName: string;
  productName: string;
  partNo: string;
  step: string;
  sampleGoodQty: number;
  sampleNgQty: number;
  sampleTestQty: number;
};

export type ProductionLog = {
  id: string;
  recordDate?: string;
  date: string;
  shift: ShiftCode;
  shiftStartAt?: string;
  shiftEndAt?: string;
  machineId: string;
  machineName: string;
  productName: string;
  partNo: string;
  step: string;
  workMinutes?: number;
  timeSlots?: number;
  minutesPerSlot?: number;
  machineSpeed?: number;
  cavityQty?: number;
  normalMinutes: number;
  changeoverMinutes: number;
  inspectionMinutes: number;
  equipmentRepairMinutes: number;
  moldRepairMinutes: number;
  materialChangeMinutes: number;
  emergencyStopMinutes: number;
  meetingMinutes: number;
  plannedStopMinutes: number;
  goodQty: number;
  ngQty: number;
  testQty: number;
  note: string;
  createdAt: string;
  updatedAt?: string;
  source: "excel-seed" | "local" | "google-sheet";
};

export type EntryDraft = Omit<
  ProductionLog,
  "id" | "createdAt" | "source" | "normalMinutes" | "machineName"
> & {
  workMinutes: number;
  timeSlots: number;
  minutesPerSlot: number;
  machineSpeed: number;
};
