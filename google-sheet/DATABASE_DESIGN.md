# Google Sheet Database Design

ออกแบบนี้ใช้ Google Sheet เป็นฐานข้อมูลของเว็บ OEE Production Entry โดยให้ `production_logs` เป็นตารางหลักแบบ append-only และใช้ตาราง master สำหรับ dropdown/report

## 1. production_logs

ใช้เก็บรายการที่ผู้ใช้กดบันทึกจากหน้าเว็บ 1 แถวต่อ 1 record

| Column | Type | Required | Source | Purpose |
|---|---:|:---:|---|---|
| id | text | yes | app / Apps Script | primary key ของ log |
| date | date `yyyy-mm-dd` | yes | form | วันที่ผลิต |
| shift | text | yes | form | กะ เช่น Day / Night หรือค่าจาก Excel |
| machineId | text | yes | form/master | รหัสเครื่อง |
| machineName | text | yes | master | ชื่อเครื่องที่แสดงใน dashboard |
| productName | text | yes | form/master | ชื่อรุ่นสินค้า |
| partNo | text | yes | form/master | Part No. |
| step | text | no | form/master | Step งาน |
| workMinutes | number | yes | form | เวลาตามกะที่ตั้งเองได้ |
| timeSlots | number | yes | form | จำนวนช่องเวลา |
| minutesPerSlot | number | yes | form | นาทีต่อ 1 ช่อง ค่าเริ่มต้น 5 |
| machineSpeed | number | no | form | ความเร็วเครื่องจักร ชิ้น/นาที |
| normalMinutes | number | yes | calculated | เวลาผลิตจริง = workMinutes - downtime |
| changeoverMinutes | number | no | form | เปลี่ยนรุ่น |
| inspectionMinutes | number | no | form | ตรวจสอบ |
| equipmentRepairMinutes | number | no | form | ซ่อมเครื่อง |
| moldRepairMinutes | number | no | form | ซ่อมแม่พิมพ์ |
| materialChangeMinutes | number | no | form | เปลี่ยนวัตถุดิบ |
| emergencyStopMinutes | number | no | form | หยุดไม่ทราบสาเหตุ |
| meetingMinutes | number | no | form | ประชุม / 5S / เปลี่ยนกะ |
| plannedStopMinutes | number | no | form | หยุดตามแผน |
| goodQty | number | yes | form | จำนวน Good |
| ngQty | number | yes | form | จำนวน NG |
| testQty | number | yes | form | จำนวน Test |
| note | text | no | form | หมายเหตุ |
| createdAt | datetime ISO | yes | app / Apps Script | เวลาที่บันทึก |
| source | text | yes | app / Apps Script | `google-sheet`, `local`, `excel-seed` |

Recommended formula/helper columns can be created in a separate report sheet, not inside raw logs:

| Metric | Formula idea |
|---|---|
| totalOutput | `goodQty + ngQty + testQty` |
| downtimeMinutes | sum of all `*Minutes` downtime fields |
| quality | `goodQty / (goodQty + ngQty)` |
| availability | `normalMinutes / (normalMinutes + downtimeMinutes)` |
| oee | `quality * availability` |

## 2. machines

นำเข้าจาก `google-sheet/machines.csv` หรือจากข้อมูลที่ generate จากไฟล์ Excel

| Column | Type | Purpose |
|---|---:|---|
| id | text | primary key ของเครื่อง |
| name | text | ชื่อเครื่อง |
| capacityUnits | number | จำนวน slot/หน่วยมาตรฐานจาก Excel |
| capacityMinutes | number | เวลามาตรฐานของเครื่อง |
| hasStep | boolean | รุ่นนี้มี Step หรือไม่ |
| rowCount | number | จำนวนรายการ master ที่ผูกกับเครื่อง |
| active | boolean | ใช้แสดง/ซ่อนใน dropdown |

## 3. product_master

นำเข้าจาก `google-sheet/product_master.csv`

| Column | Type | Purpose |
|---|---:|---|
| id | text | primary key ของ master |
| machineId | text | foreign key ไป `machines.id` |
| machineName | text | ชื่อเครื่องสำหรับค้นหา |
| productName | text | ชื่อรุ่น |
| partNo | text | Part No. |
| step | text | Step |
| sampleGoodQty | number | ค่า Good ตัวอย่างจาก Excel |
| sampleNgQty | number | ค่า NG ตัวอย่างจาก Excel |
| sampleTestQty | number | ค่า Test ตัวอย่างจาก Excel |
| active | boolean | ใช้แสดง/ซ่อนใน dropdown |

## 4. downtime_catalog

ตารางเล็กสำหรับอธิบาย field downtime ให้คนดู Sheet เข้าใจตรงกับหน้าเว็บ

| key | thLabel | enLabel | sortOrder |
|---|---|---|---:|
| changeoverMinutes | เปลี่ยนรุ่น | Changeover | 10 |
| inspectionMinutes | ตรวจสอบ | Inspection | 20 |
| equipmentRepairMinutes | ซ่อมเครื่อง | Equipment repair | 30 |
| moldRepairMinutes | ซ่อมแม่พิมพ์ | Mold repair | 40 |
| materialChangeMinutes | เปลี่ยนวัตถุดิบ | Material change | 50 |
| emergencyStopMinutes | หยุดไม่ทราบสาเหตุ | Emergency stop | 60 |
| meetingMinutes | ประชุม / 5S / เปลี่ยนกะ | Meeting or shift break | 70 |
| plannedStopMinutes | หยุดตามแผน | Planned stop | 80 |

## 5. users

ใช้เฉพาะถ้าต้องการย้ายระบบผู้ใช้งานจาก localStorage ไปไว้ใน Google Sheet

| Column | Type | Purpose |
|---|---:|---|
| username | text | primary key |
| displayName | text | ชื่อที่แสดง |
| role | text | `admin`, `operator`, `viewer` |
| passwordHash | text | เก็บ hash เท่านั้น ไม่เก็บรหัสผ่านจริง |
| active | boolean | เปิด/ปิดผู้ใช้ |
| createdAt | datetime ISO | วันที่สร้าง |
| updatedAt | datetime ISO | วันที่แก้ไขล่าสุด |

## 6. sync_audit

ใช้ตรวจสอบการนำเข้าข้อมูลหรือ sync

| Column | Type | Purpose |
|---|---:|---|
| timestamp | datetime ISO | เวลา event |
| action | text | เช่น `appendLog`, `setupWorkbook`, `importMaster` |
| status | text | `ok` หรือ `error` |
| message | text | รายละเอียด |
| actor | text | ผู้ทำรายการ ถ้ามี |

## Rules

- เก็บ raw data ใน `production_logs` เป็นตัวเลขจริง ไม่ใส่ comma หรือคำว่า "นาที" ใน cell
- ห้ามแก้ `id`, `createdAt`, `source` ด้วยมือหลังบันทึกแล้ว
- ถ้าต้องทำ dashboard ใน Google Sheet ให้สร้าง sheet ใหม่ เช่น `dashboard` หรือ `pivot_oee` แล้วอ้างอิงจาก `production_logs`
- ถ้ามีข้อมูลเก่าอยู่แล้ว ให้รัน `setupProductionWorkbook()` หลังวาง `Code.gs` เวอร์ชันใหม่ สคริปต์จะ rebuild header โดยอิงชื่อคอลัมน์เดิมเพื่อไม่ให้ตัวเลขเก่าเลื่อนผิดช่อง
- `machines` และ `product_master` เป็น master data สามารถ import จาก CSV ได้ และควรล็อกหัวตารางกับคอลัมน์ key
