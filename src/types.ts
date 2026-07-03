export type ShiftCode = "白" | "夜" | "D" | "N" | "A" | "B" | string;

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

export type ProductionOrder = {
  rowNumber?: number;
  machineId?: string;
  machineName: string;
  no?: string;
  openedDate?: string;
  orderNo: string;
  productName: string;
  partNo: string;
  rmNo?: string;
  orderQty?: number;
  unit?: string;
  dueDate?: string;
  shift?: string;
  kpi85?: number;
  dailyTarget?: number;
  expectedDoneDate?: string;
  expectedDoneTime?: string;
  startDate?: string;
  endDate?: string;
  producedQty?: number;
  readyForPainting?: number;
  backlogQty?: number;
  ngRework?: number;
  status?: string;
  progress?: string;
  stock?: string;
  updatedBy?: string;
};

export type ProductionLog = {
  id: string;
  recordDate?: string;
  recordTime?: string;
  entryUser?: string;
  submittedAt?: string;
  buttonDetails?: string;
  date: string;
  shift: ShiftCode;
  shiftStartAt?: string;
  shiftEndAt?: string;
  machineId: string;
  machineName: string;
  productName: string;
  partNo: string;
  step: string;
  materialOfProduction?: string;
  productionOrderRowNumber?: number;
  productionOrderNo?: string;
  productionOrderQty?: number;
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
  newModelMinutes?: number;
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
