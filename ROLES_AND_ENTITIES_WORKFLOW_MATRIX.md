# 🩸 RED PULSE — ROLE WORKFLOWS & ENTITY IMPORTANCE SPECIFICATION

> **Document Version:** 1.0.0  
> **Target Audience:** Product Owners, Developers, QA Engineers, System Architects, Compliance Officers  
> **Platform:** Red Pulse — Emergency Blood Donation & Inventory Management System  

---

## 📌 Executive Summary

**Red Pulse** is an end-to-end blood donation, emergency dispatch, and hospital blood bank inventory ecosystem. The platform coordinates between life-saving voluntary donors, patients/families in urgent need, verified medical facilities, and platform administrators.

This document serves as the **single source of truth** detailing:
1. **The 4 System Roles (+ Public Guest)** and all the role-specific work, features, and workflows they can perform.
2. **The 10 Core Domain Entities** and their strict technical, operational, and life-critical importance to each role.
3. **The Role-to-Entity Access & Criticality Matrix** mapping CRUD permissions and business impact.
4. **The End-to-End Cross-Role Operational Workflows** demonstrating how entities flow across the platform.

---

## 👥 1. System Roles & Capabilities Overview

Red Pulse defines **4 authenticated roles** (governed by Spring Security `@PreAuthorize` and React route guards) and **1 unauthenticated Public Persona**:

```text
                  ┌──────────────────────────────────────────────┐
                  │                 RED PULSE                    │
                  └──────┬──────────────┬──────────────┬─────────┘
                         │              │              │
           ┌─────────────▼───┐   ┌──────▼──────┐  ┌────▼────────┐
           │      DONOR      │   │  REQUESTER  │  │  HOSPITAL   │
           │ (Voluntary Aid) │   │ (In Need)   │  │ (Medical)   │
           └─────────────┬───┘   └──────┬──────┘  └────┬────────┘
                         │              │              │
                         └───────┬──────┴──────┬───────┘
                                 │             │
                       ┌─────────▼────────┐ ┌──▼──────────┐
                       │      ADMIN       │ │ PUBLIC/SOS  │
                       │ (Supervision)    │ │ (Emergency) │
                       └──────────────────┘ └─────────────┘
```

---

## 🛠️ 2. Detailed Role-Wise Work & Workflow Breakdown

---

### 🟢 Role 1: DONOR (Life-Saving Volunteer)

#### Profile & Persona
Voluntary individuals registered to donate blood, respond to routine or urgent matching broadcasts, schedule appointments at partner hospitals, and monitor their donation history and community impact.

#### Role-Wise Work They Can Do:
1. **Onboarding & Eligibility Management:**
   - Register account with contact info, blood group (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`), and geo-location coordinates.
   - Toggle **Availability Status** (`Active` / `Unavailable` / `On Hold`) so they are not pinged when ineligible or recovering.
   - View their **Verification Badge** (`VERIFIED` vs `UNVERIFIED`) awarded by Admin after identity/health checks.

2. **Emergency & Match Response:**
   - Receive real-time geo-targeted notifications for patients needing compatible blood within a defined radius (e.g. 15–50 km).
   - Review incoming **Blood Requests** & **Emergency SOS Alerts** with hospital address, urgency level, and distance.
   - Accept or decline incoming donation invitations.

3. **Appointment Scheduling & Hospital Visits:**
   - Book an appointment at a target hospital linked to a specific blood request or as a voluntary walk-in donation.
   - Select date/time slots, view hospital directions and contact numbers.
   - Cancel or reschedule upcoming appointments.

4. **Contribution Tracking & Lifesaving Milestones:**
   - View complete history of all completed donations with date, hospital, and blood volume.
   - Track total lives impacted, badges earned, and eligibility countdown timer (e.g. 56 or 90 days cooldown between donations).
   - Download or view official donation receipts / certificates.

#### Accessible Frontend Views:
- `/donor/dashboard` — Overview of donation stats, urgent requests nearby, and availability toggle.
- `/donor/requests` & `/donor/requests/:id` — Matching blood requests within geographical reach.
- `/donor/appointments` — Calendar of booked, confirmed, and past visits.
- `/donor/donations` — Historical records of completed donations.
- `/donor/contributions` — Impact analytics, badges, certificates, and next eligible donation date.
- `/donor/notifications` — Alert inbox for emergency broadcasts.
- `/donor/profile` — Medical info, blood type, city/state, location pin, and phone.

---

### 🔵 Role 2: REQUESTER (Patient / Family / Requester in Need)

#### Profile & Persona
Individuals, patient relatives, or clinical attendants requiring blood units urgently or for upcoming surgeries. They initiate regular or emergency requests and locate compatible donors or inventory.

#### Role-Wise Work They Can Do:
1. **Create & Manage Blood Requests:**
   - Submit formal blood requests specifying patient details, required blood group, units needed, target hospital, required date, and clinical description.
   - Classify requests by urgency: `NORMAL`, `URGENT`, or `EMERGENCY`.
   - Update request requirements or cancel if units are procured elsewhere.

2. **Automated Algorithmic Donor Matching:**
   - Run the matching engine to find ranked lists of eligible, available, verified donors based on blood compatibility matrix (e.g., O- can donate to anyone) and Haversine distance ranking.
   - Filter matches by radius (15km, 30km, 50km).
   - Trigger instant notifications to matched candidate donors directly from the UI.

3. **Emergency Broadcasts & SOS Dispatch:**
   - Elevate a request to high-priority `EMERGENCY` broadcast.
   - Broadcast instant alerts to all active donors in the hospital's geographic area.
   - Track broadcast status: `OPEN` ➔ `ALERT_SENT` ➔ `RESOLVED`.

4. **Fulfillment Tracking:**
   - Monitor real-time progress: `PENDING` ➔ `MATCHED` ➔ `PARTIALLY_FULFILLED` ➔ `FULFILLED`.
   - View scheduled donor appointments arriving for their specific patient ticket.
   - Mark the request as `FULFILLED` once required units are collected.

#### Accessible Frontend Views:
- `/requester/dashboard` — Active requests counter, pending units required, matched donors overview.
- `/requester/create-request` — Multi-step wizard to register urgent blood demand.
- `/requester/requests` & `/requester/requests/:id` — Request tracking, timeline, and fulfillment meter.
- `/requester/find-donors` — Interactive search engine & map to scan compatible donors in proximity.
- `/requester/emergency` & `/requester/emergency/:id` — High-priority SOS broadcast center.
- `/requester/notifications` — Updates on donor acceptances and hospital confirmations.

---

### 🏥 Role 3: HOSPITAL (Medical Center / Blood Bank Manager)

#### Profile & Persona
Authorized clinical staff, blood bank technicians, and hospital administrators managing on-premise blood inventory, verifying donor donations, and scheduling clinical intake.

#### Role-Wise Work They Can Do:
1. **Blood Inventory & Cold-Chain Management:**
   - Monitor live stock levels across all 8 blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).
   - Track available units vs. reserved units (held for scheduled operating room procedures).
   - Record batch creation, expiration dates, and discard expired blood units.
   - Receive low-stock (`CRITICAL`, `LOW`, `ADEQUATE`) automated threshold alerts.

2. **Appointment Coordination & Screening:**
   - Review incoming appointment bookings from donors.
   - Change appointment status: `SCHEDULED` ➔ `CONFIRMED` ➔ `COMPLETED` or `NO_SHOW` / `CANCELLED`.
   - Attach clinical notes (e.g. pre-donation hemoglobin levels, screening pass/fail).

3. **Donation Intake & Automated Stock Increments:**
   - Record completed blood donation records upon successful phlebotomy.
   - When marking a donation as `COMPLETED`, the system **automatically increments** the corresponding blood group's `available_units` in `blood_inventory` and logs the donor's `total_donations` count and `last_donated_at`.

4. **Handling Patient Inquiries & Hospital Blood Demands:**
   - Receive patient requests routed to their hospital facility.
   - Reserve units from inventory against approved `blood_requests`.
   - Update fulfillment counters upon unit release.

#### Accessible Frontend Views:
- `/hospital/dashboard` — Live stock meters, today's appointments, pending intake queue.
- `/hospital/inventory` — Full stock batch table, low-stock alerts, expiry tracker, batch editor modal.
- `/hospital/appointments` — Queue of donor appointments with one-click `Confirm`, `Complete`, or `Cancel`.
- `/hospital/donations` — Historical log of units drawn on-site.
- `/hospital/requests` — Blood requests designated for this hospital.
- `/hospital/profile` — Hospital accreditation, address, emergency contact, coordinates.

---

### 🛡️ Role 4: ADMIN (Platform Super-Admin & Compliance Auditor)

#### Profile & Persona
System administrators, medical board officers, and compliance executives responsible for platform safety, verification standards, hospital credentialing, and fraud prevention.

#### Role-Wise Work They Can Do:
1. **User & Identity Governance:**
   - View all registered users across all roles (`DONOR`, `REQUESTER`, `HOSPITAL`, `ADMIN`).
   - Block malicious, fraudulent, or suspicious accounts (`ACTIVE` ➔ `BLOCKED`).
   - Create or assign administrative roles.

2. **Medical Credential Verification:**
   - Review donor health questionnaires and assign `VERIFIED` status.
   - Approve, activate, or deactivate hospitals (`PENDING` ➔ `ACTIVE` / `INACTIVE`).
   - Verify hospital license numbers, GPS coordinates, and contact details.

3. **System-Wide Operational Oversight:**
   - Monitor platform-wide metrics: total registered donors, units collected, fulfilled requests, active emergencies.
   - Access real-time drill-down reports across city, state, and blood group distribution.
   - Manage global blood request lifecycles and emergency escalations.

4. **Security & Regulatory Audit Trail:**
   - Inspect immutable **Audit Logs** for any critical action (logins, stock adjustments, role changes, verification updates, user blocks).
   - Track IP addresses, action timestamps, actor IDs, and payload changes for health privacy compliance.

#### Accessible Frontend Views:
- `/admin/dashboard` — High-level KPI widgets, emergency status banner, quick verification actions.
- `/admin/users` — User management grid with search, filter, role badge, and status switcher.
- `/admin/donors` — Donor roster with verification controls and health status.
- `/admin/hospitals` — Hospital registry approval, status toggle, and branch locations.
- `/admin/requests` — Global view of all blood requests with status override.
- `/admin/donations` — Master ledger of all completed donations across all facilities.
- `/admin/audit-logs` — Immutable event log table with actor, action, timestamp, and IP trace.
- `/admin/analytics` & `/admin/reports` — Exportable charts on supply vs. demand trends.

---

### 🚨 Role 5: PUBLIC / GUEST (Unauthenticated Emergency SOS)

#### Profile & Persona
Any citizen, bystander, or accident responder visiting the platform during a life-or-death crisis without an existing account.

#### Role-Wise Work They Can Do:
- **Instant SOS Dispatch via OTP:**
  - Submit an emergency request with patient name, required blood group, hospital location, and phone number.
  - Receive a fast SMS OTP (One-Time Password) to verify phone authenticity.
  - Upon OTP verification, system auto-provisions a requester profile and immediately fires donor matching broadcasts to all nearby compatible donors.
- **Find Nearest Hospitals:**
  - Search public registry of blood banks and verified hospital emergency rooms.
- **Self-Registration:**
  - Register as a new Donor or Requester.

---

## 🏛️ 3. Core System Entities & Their Importance by Role

Red Pulse is built on **10 foundational domain entities**. Below is a breakdown of each entity, why it matters, and how critical it is to each role.

---

### 1️⃣ Entity: `User` (`users`)
- **Technical Definition:** Core authentication and principal identity table storing BCrypt passwords, JWT claims, role classification (`DONOR`, `REQUESTER`, `HOSPITAL`, `ADMIN`), status (`ACTIVE`, `BLOCKED`, `PENDING`), and hospital associations.
- **Importance by Role:**

| Role | Criticality | Justification & Work Impact |
|---|:---:|---|
| **DONOR** | ⭐⭐⭐⭐ (High) | Governs their login, security credentials, and identity token. |
| **REQUESTER** | ⭐⭐⭐⭐ (High) | Required to authenticate, track personal requests, and receive updates. |
| **HOSPITAL** | ⭐⭐⭐⭐ (High) | Binds hospital staff accounts to their specific `hospital_id` facility. |
| **ADMIN** | ⭐⭐⭐⭐⭐ (Critical) | Primary target of admin governance; Admin reads, updates, and blocks user identities to protect system safety. |

---

### 2️⃣ Entity: `DonorProfile` (`donor_profiles`)
- **Technical Definition:** Extension entity in a 1-to-1 relationship with `User`. Stores blood group, GPS latitude/longitude, city, state, availability flag (`available`), verification status (`VERIFIED`, `UNVERIFIED`), last donation timestamp, and total donation count.
- **Importance by Role:**

| Role | Criticality | Justification & Work Impact |
|---|:---:|---|
| **DONOR** | ⭐⭐⭐⭐⭐ (Critical) | Represents their donor identity; controlling `available` lets them rest or participate; reflects their lifesaving achievements. |
| **REQUESTER** | ⭐⭐⭐⭐⭐ (Critical) | The target pool for matching; matching algorithm queries `blood_group`, `city`, and GPS coordinates to save the requester's patient. |
| **HOSPITAL** | ⭐⭐⭐⭐ (High) | Hospital relies on donor profiles to verify donor eligibility, age, blood group, and interval since `last_donated_at`. |
| **ADMIN** | ⭐⭐⭐⭐⭐ (Critical) | Admin audits medical credibility, verifies identity documents, and approves verification badges. |

---

### 3️⃣ Entity: `Hospital` (`hospitals`)
- **Technical Definition:** Institutional directory of licensed medical clinics and blood banks, with official names, contact phone/email, address, latitude/longitude, and operational status (`ACTIVE`, `INACTIVE`, `PENDING`).
- **Importance by Role:**

| Role | Criticality | Justification & Work Impact |
|---|:---:|---|
| **DONOR** | ⭐⭐⭐⭐ (High) | The destination where donors travel to donate; provides map coordinates, directions, and contact details. |
| **REQUESTER** | ⭐⭐⭐⭐⭐ (Critical) | Must designate the receiving hospital where the patient is admitted and where units must be delivered. |
| **HOSPITAL** | ⭐⭐⭐⭐⭐ (Critical) | Represents the hospital's institutional entity; all inventory, appointments, and staff users are scoped to this record. |
| **ADMIN** | ⭐⭐⭐⭐⭐ (Critical) | Admin reviews hospital accreditation, approves newly registered facilities, and suspends non-compliant centers. |

---

### 4️⃣ Entity: `BloodInventory` (`blood_inventory`)
- **Technical Definition:** Real-time stock ledger storing units available, units reserved, expiration timestamp, and computed stock status (`ADEQUATE`, `LOW`, `CRITICAL`, `EXPIRED`) partitioned by `hospital_id` and `blood_group`.
- **Importance by Role:**

| Role | Criticality | Justification & Work Impact |
|---|:---:|---|
| **DONOR** | ⭐⭐ (Low) | Indirect interest; donor contributions ultimately feed this stock, but donors do not directly browse raw internal hospital inventory. |
| **REQUESTER** | ⭐⭐⭐⭐ (High) | When a requester needs blood, available hospital inventory can immediately fulfill the need without waiting for donor dispatch. |
| **HOSPITAL** | ⭐⭐⭐⭐⭐ (Critical) | Core daily operational workspace of hospital blood banks; prevents stockouts, manages wastage/expiries, and reserves units for surgeries. |
| **ADMIN** | ⭐⭐⭐⭐ (High) | Admin monitors aggregate regional supply to detect city-wide blood shortages and initiate disaster response. |

---

### 5️⃣ Entity: `BloodRequest` (`blood_requests`)
- **Technical Definition:** Clinical demand ticket initiated by requesters or hospitals, storing required blood group, units demanded, units fulfilled, urgency (`NORMAL`, `URGENT`, `EMERGENCY`), required-by date, and status (`PENDING`, `MATCHED`, `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED`).
- **Importance by Role:**

| Role | Criticality | Justification & Work Impact |
|---|:---:|---|
| **DONOR** | ⭐⭐⭐⭐⭐ (Critical) | The primary trigger for donation; donors browse these requests or receive match invitations to volunteer. |
| **REQUESTER** | ⭐⭐⭐⭐⭐ (Critical) | The requester's primary artifact; represents their active lifeline for procuring blood units for a patient. |
| **HOSPITAL** | ⭐⭐⭐⭐⭐ (Critical) | Hospitals fulfill blood requests using on-hand inventory or incoming donor appointments; tracks clinical patient demand. |
| **ADMIN** | ⭐⭐⭐⭐ (High) | Admin tracks fulfillment SLAs, monitors pending life-critical requests, and resolves disputes or stalled tickets. |

---

### 6️⃣ Entity: `EmergencyRequest` (`emergency_requests`)
- **Technical Definition:** High-priority broadcast alert linked optionally to a parent `BloodRequest`. Stores emergency severity level, approximate landmark/GPS, broadcast status (`OPEN`, `ALERT_SENT`, `RESOLVED`, `CANCELLED`), and triggers push/SMS notifications to all surrounding donors.
- **Importance by Role:**

| Role | Criticality | Justification & Work Impact |
|---|:---:|---|
| **DONOR** | ⭐⭐⭐⭐⭐ (Critical) | Sends urgent push notifications to donors when a critical trauma/surgery patient is dying nearby and needs immediate response. |
| **REQUESTER** | ⭐⭐⭐⭐⭐ (Critical) | Requester's emergency SOS tool to bypass standard queues and ping all donors within 50 km immediately. |
| **HOSPITAL** | ⭐⭐⭐⭐⭐ (Critical) | Trauma center staff monitor incoming emergencies to prepare transfusion bays and surgical inventory. |
| **ADMIN** | ⭐⭐⭐⭐⭐ (Critical) | High-visibility emergency monitoring to ensure fast resolution and prevent abuse of emergency sirens. |

---

### 7️⃣ Entity: `Appointment` (`appointments`)
- **Technical Definition:** Scheduled donation session between a specific donor and hospital. Stores appointment timestamp, status (`SCHEDULED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`), clinical notes, and optional link to a `BloodRequest`.
- **Importance by Role:**

| Role | Criticality | Justification & Work Impact |
|---|:---:|---|
| **DONOR** | ⭐⭐⭐⭐⭐ (Critical) | Secures donor's donation time slot; provides reminders, prevents long hospital wait times, and tracks commitment. |
| **REQUESTER** | ⭐⭐⭐ (Medium) | Requesters can see that donors have booked appointments to fulfill their patient's request, providing reassurance. |
| **HOSPITAL** | ⭐⭐⭐⭐⭐ (Critical) | Staff workload calendar; hospital verifies donor arrival, confirms appointments, screens donors, and transitions to phlebotomy. |
| **ADMIN** | ⭐⭐⭐ (Medium) | Operational metric for platform throughput and no-show rate analytics. |

---

### 8️⃣ Entity: `Donation` (`donations`)
- **Technical Definition:** Immutable legal and clinical record created upon donation completion. Stores donor ID, hospital ID, blood group, units donated, donation timestamp, and completion status. Crucially, **triggers inventory increment**.
- **Importance by Role:**

| Role | Criticality | Justification & Work Impact |
|---|:---:|---|
| **DONOR** | ⭐⭐⭐⭐⭐ (Critical) | Proof of life saved; updates donor's `total_donations`, resets recovery timer, and awards certificates/badges. |
| **REQUESTER** | ⭐⭐⭐⭐ (High) | Provides tangible proof that blood has been drawn and is ready for transfusion for their patient request. |
| **HOSPITAL** | ⭐⭐⭐⭐⭐ (Critical) | Official intake record; creates traceable batch in inventory and updates hospital phlebotomy metrics. |
| **ADMIN** | ⭐⭐⭐⭐⭐ (Critical) | Legal compliance ledger for blood collection; tracks health safety, units collected nationwide, and donor retention. |

---

### 9️⃣ Entity: `Notification` (`notifications`)
- **Technical Definition:** Real-time messaging and user alert store categorized by `type` (`EMERGENCY`, `BLOOD_REQUEST`, `DONATION_REQUEST`, `APPOINTMENT`, `DONATION_ACCEPTED`, `SYSTEM`), with title, message body, and read/unread status.
- **Importance by Role:**

| Role | Criticality | Justification & Work Impact |
|---|:---:|---|
| **DONOR** | ⭐⭐⭐⭐⭐ (Critical) | Immediate communication channel for urgent blood calls, appointment reminders, and thank-you badges. |
| **REQUESTER** | ⭐⭐⭐⭐⭐ (Critical) | Alerts requester when a donor matches, accepts an invite, or books an appointment. |
| **HOSPITAL** | ⭐⭐⭐⭐ (High) | Alerts clinical staff of new appointments booked or urgent stock depletion warnings. |
| **ADMIN** | ⭐⭐⭐ (Medium) | Broadcast channel to inform users or hospitals of system maintenance or regulatory policy updates. |

---

### 🔟 Entity: `AuditLog` (`audit_logs`)
- **Technical Definition:** Immutable compliance and forensic tracking log storing actor user ID, action code (e.g. `USER_BLOCKED`, `STOCK_ADJUSTED`, `DONATION_COMPLETED`), entity name, entity ID, JSON details payload, client IP address, and timestamp.
- **Importance by Role:**

| Role | Criticality | Justification & Work Impact |
|---|:---:|---|
| **DONOR** | ⭐ (None) | Transparent background security; no direct user visibility needed. |
| **REQUESTER** | ⭐ (None) | Transparent background security; no direct user visibility needed. |
| **HOSPITAL** | ⭐⭐ (Low) | Provides non-repudiation in case of internal stock discrepancies or disputed donations. |
| **ADMIN** | ⭐⭐⭐⭐⭐ (Critical) | Essential tool for governance, forensic investigation of unauthorized data edits, compliance reporting, and platform security. |

---

## 📊 4. Master Role vs. Entity Criticality Matrix

| Entity | Public / Guest | Donor | Requester | Hospital | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| **User** (`users`) | ⭐ (Register/Login) | ⭐⭐⭐⭐ (High) | ⭐⭐⭐⭐ (High) | ⭐⭐⭐⭐ (High) | ⭐⭐⭐⭐⭐ (Critical) |
| **DonorProfile** (`donor_profiles`) | ⭐ (Register) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐ (High) | ⭐⭐⭐⭐⭐ (Critical) |
| **Hospital** (`hospitals`) | ⭐⭐⭐ (Directory) | ⭐⭐⭐⭐ (High) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐⭐ (Critical) |
| **BloodInventory** (`blood_inventory`) | ❌ (No Access) | ⭐⭐ (Low) | ⭐⭐⭐⭐ (High) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐ (High) |
| **BloodRequest** (`blood_requests`) | ❌ (No Access) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐ (High) |
| **EmergencyRequest** (`emergency_requests`)| ⭐⭐⭐⭐⭐ (SOS Trigger)| ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐⭐ (Critical) |
| **Appointment** (`appointments`) | ❌ (No Access) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐ (Medium) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐ (Medium) |
| **Donation** (`donations`) | ❌ (No Access) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐ (High) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐⭐ (Critical) |
| **Notification** (`notifications`) | ❌ (No Access) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐ (High) | ⭐⭐⭐ (Medium) |
| **AuditLog** (`audit_logs`) | ❌ (No Access) | ❌ (No Access) | ❌ (No Access) | ⭐⭐ (Low) | ⭐⭐⭐⭐⭐ (Critical) |

---

## 🔐 5. Role-to-Entity CRUD Permission Matrix

| Entity | DONOR | REQUESTER | HOSPITAL | ADMIN |
|---|---|---|---|---|
| **User** | Read (Self), Update (Self) | Read (Self), Update (Self) | Read (Self), Update (Self) | Read (All), Update (Any), Block/Unblock |
| **DonorProfile** | Read (Self), Update (Self) | Read (Matched Donors only) | Read (Applicant/Donor) | Read (All), Update (Verify/Reject) |
| **Hospital** | Read (All active) | Read (All active) | Read (Self), Update (Self info) | Read (All), Create, Update (Approve) |
| **BloodInventory** | Read (Aggregated stock status) | Read (Stock availability check) | Read (Self), Create, Update, Adjust | Read (All facilities), Audit |
| **BloodRequest** | Read (Public/Matched), Respond | Create, Read (Self), Update, Cancel | Read (Assigned), Fulfill | Read (All), Override Status, Cancel |
| **EmergencyRequest**| Read, Accept/Respond | Create (SOS), Read (Self), Resolve | Read (Hospital area), Coordinate | Read (All), Resolve, Broadcast |
| **Appointment** | Create (Book), Read (Self), Cancel | Read (Linked to own request) | Read (Self facility), Confirm, Complete | Read (All), Cancel |
| **Donation** | Read (Own history/receipts) | Read (Linked to request) | Create (Intake), Complete (Draw blood) | Read (Master ledger), Audit |
| **Notification** | Read (Self), Mark Read, Delete | Read (Self), Mark Read, Delete | Read (Self), Mark Read | Create (Broadcast), Read (All) |
| **AuditLog** | No Access | No Access | Read (Self facility actions) | Read (All system logs, filter by IP/Actor) |

---

## 🔄 6. End-to-End Cross-Entity Workflow Lifecycle

The power of Red Pulse lies in how these entities seamlessly interact across all roles in real-time.

```text
[ 1. PATIENT IN NEED ]
       │ Requester creates BloodRequest (or Public SOS via OTP)
       ▼
[ 2. ALGORITHMIC ENGINE ]
       │ Queries DonorProfiles (matched blood compatibility + Haversine GPS radius)
       │ Queries BloodInventory (checks hospital on-shelf stock)
       ▼
[ 3. ALERT DISPATCH ]
       │ Generates Notifications & broadcasts to candidate Donors
       ▼
[ 4. DONOR ACTION ]
       │ Donor accepts and books an Appointment at target Hospital
       ▼
[ 5. HOSPITAL VERIFICATION & INTAKE ]
       │ Hospital confirms Appointment on arrival
       │ Phlebotomist draws unit and marks Donation as COMPLETED
       ▼
[ 6. AUTOMATED SYSTEM CASCADE ]
       │ 1. BloodInventory: available_units increments for that BloodGroup
       │ 2. BloodRequest: units_fulfilled increments (transitions to FULFILLED)
       │ 3. DonorProfile: total_donations increments; last_donated_at updates
       │ 4. AuditLog: Immutable record logged with actor, timestamp, and IP
       ▼
[ 7. AUDIT & ANALYTICS ]
       │ Admin Dashboard reflects real-time metrics and compliance logs
```

---

## 🎯 Summary

- **For Donors:** The platform revolves around **`BloodRequest`**, **`Appointment`**, and **`Donation`**, transforming volunteer willingness into concrete life-saving actions.
- **For Requesters:** The platform is an emergency procurement engine centered on **`BloodRequest`**, **`EmergencyRequest`**, and matching compatible **`DonorProfile`** records.
- **For Hospitals:** The system is an operational clinical management tool anchored by **`BloodInventory`**, **`Appointment`**, and **`Donation`**.
- **For Admins:** The platform is a high-reliability governance suite centered on **`User`**, **`Hospital`** verification, and compliance **`AuditLog`**.
