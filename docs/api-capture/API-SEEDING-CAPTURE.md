# API Seeding Capture: Local (`webims.meditab.local`, client 10003)

Captured 2026-09-25 by driving the app with `playwright-cli` and recording its own network calls.
Prod (`ehr.drcatalyst.com`) has **not** been captured yet.

## Common headers

Every `/api/*` call needs these three headers. Without `x-requestargs` the API returns **400**.

```bash
export URL=https://webims.meditab.local
export TOKEN='<x-token cookie value after login>'
H=(-H "x-token: $TOKEN"
   -H "accept: application/json, text/plain, */*"
   -H "content-type: application/json"
   -H "x-requestargs: iemoweb;0.0.1;<MODULE>;$(uuidgen);<route>")
```

`x-requestargs` = `app;version;MODULE;GUID;route`. **A freshly generated random GUID is accepted**, so the
GUIDs hardcoded in the tests can be replaced with `crypto.randomUUID()` per request.
Examples of `MODULE;route`: `PATIENTDEMOGRAPHICS;/app/patient/create`, `NOTESANDALERTS;/app/scheduler`.

Local uses a self-signed cert: add `-k` to curl (the tests already set `ignoreHTTPSErrors`).

## ID rules learned

- IDs are only unique **within a type**. For example `1000331` is both a facility and `AdjustmentType/WriteOff`, so always look up by (type, code) or by name.
- Static IDs appear to be `<clientId>` + a sequence number, e.g. `ScheduleStatus/Unconfirmed` is `100051311` on client 10005 and `100031311` on client 10003.
  That's why the old hardcoded values were for a different clinic.

## Lookups (read-only)

| Need | Request | Pick by | Local value |
|---|---|---|---|
| Sex | `GET /api/StaticMisc?staticMiscType=Gender` | `code=Male` | 10003814 |
| Address types | `GET /api/StaticMisc?staticMiscType=AddressType` (or `GET /api/patient/addresstypes`) | `code=Home` / `Work` | 1000316 / 1000323 |
| Contact preference types | `GET /api/StaticMisc?staticMiscType=ContactDetailPreferenceType` (or `GET /api/patient/preferencetypes`) | the UI sends 5 codes | 10003443, 448, 450, 454, 449 |
| Schedule status | `GET /api/StaticMisc?staticMiscType=ScheduleStatus` | `code=Unconfirmed` | 100031311 |
| Sign-off status | `GET /api/StaticMisc?staticMiscType=SignOffStatus` | `code=Pending` | 100031479 |
| Appointment type | `GET /api/StaticMisc?staticMiscType=AppointmentType` | `code=Appointment` | 1000380 |
| Service location type | `GET /api/StaticMisc?staticMiscType=ServiceLocationType` | `code=Facility` | 100031442 |
| Team role | `GET /api/miscValue?model=id&type=ParticipantType` | `code=PPRF` (Primary Performer) | 1000360 |
| Country | `GET /api/country?model=id&Code=US` | n/a | 1000350 |
| Clinic time zone | `GET /api/ClientConfig/profile?clinic=true&isDefaultFacility=true` | `data.result.clinic.timeZoneId` | 10003268 (the UI sent 10003117) |
| Facility | `GET /api/facility?model=id&search=&isActive=true&timeZone=true` | `name` | 1000328 "Carle Clinicc" (scheduler), 1000331 "Apollo Health Care" (patient default) |
| Provider | `GET /api/employee?model=id&facilityId=<fac>&isSchedulable=true&search=<name>&page=1&size=10` | name | 100031575 "Adre, Rush" |
| Provider specialty | `GET /api/employee/<providerId>` | `primaryFacilityDetail.employeeFacilityDetailSpecialty[isPrimary].specialtyId` | 10003255 (ABA Therapy) |
| Visit type | `GET /api/visitType?model=id&search=&page=1&size=10&facilityId=<fac>&specialtyId=<spec>&screenTypeCode=AppointmentType&isShowInDropDown=true` | name | 1000337 "Physical" |

Example:

```bash
curl -k "${H[@]}" "$URL/api/StaticMisc?staticMiscType=ScheduleStatus"
```

## Find-or-create the seed patient

Patients can't be deleted, so each test user gets a fixed seed patient that's reused across runs.

```bash
# find
curl -k "${H[@]}" -X POST "$URL/api/patient/fetch?page=1&size=20" \
  -d '{"firstName":"Worker1","lastName":"PWAuto","isActive":true}'
# -> data.result[0].id  (local: 10003173212, chart PT317AT)

# create (only if not found). The full UI body is in local-post-patient.body.json.
# The fields that vary per clinic are: facilityId, sexId, contactDetail.created[].addressTypeId,
# contactDetail.created[].contactAddress.countryId, timeZoneId, contactDetailPreference[].preferenceTypeId
curl -k "${H[@]}" -X POST "$URL/api/patient" -d @local-post-patient.body.json
# -> data.result.id
```

Local SSN (`uID`) is required. The seed patient uses `999001001` (the `999` prefix is never a real SSN).

## Create and delete an appointment (verified: both return 200)

```bash
curl -k "${H[@]}" -X POST "$URL/api/Schedule" -d '{
  "id": null, "fromTime": <epoch ms, now + 1h>, "duration": 15,
  "patientId": 10003173212, "facilityId": 1000328, "serviceLocationId": 1000328,
  "serviceLocationTypeId": 100031442, "visitTypeId": 1000337, "statusId": 100031311,
  "appointmentTypeId": 1000380, "providerId": 100031575, "clinicalSpecialtyId": 10003255,
  "isAuthorizationRequired": false, "isEncounter": true, "isBillable": true, "isServiceLocation": true,
  "reasonForVisit": {}, "eligibilityId": [], "customStatus": [],
  "patientForms": {"created": [], "updated": [], "deleted": []},
  "scheduleTeamMap": {"created": [{"id": null, "scheduleId": null, "employeeId": 100031575,
    "roleId": 1000360, "isSignOffRequired": true, "signOffStatusId": 100031479, "uid": 2,
    "highlighted": [], "markAsReviewed": [], "remark": [], "footNote": [], "comment": [], "verified": []}],
    "updated": [], "deleted": []}
}'
# -> data.result.id, data.result.lastModifiedDate

curl -k "${H[@]}" -X DELETE "$URL/api/Schedule/<id>" -d '{"id": <id>, "lastModifiedDate": <lmd>}'
```

Checked-in appointments can't be deleted, so the CICO test will leave one appointment behind per run.

## Still to capture

- **Prod**: the same lookups, plus confirming prod's names for facility, provider and visit type.
- **Face Sheet folder**: the documents folder lookup, to check "Patient Face Sheet" exists before the facesheet test runs.
