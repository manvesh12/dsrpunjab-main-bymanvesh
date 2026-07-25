# DSR Technical Document - Hierarchy Plan

Status: Role hierarchy and project-initiation workflow confirmed  
Phase: Approved logical IDs; application accounts and RBAC implementation next

## 1. Document hierarchy

```text
DSR Technical Document
├── Title Page
├── Table of Contents
├── Executive Summary
├── Chapters
│   ├── Chapter 1
│   ├── Chapter 2
│   ├── Chapter 3
│   ├── Chapter 4
│   ├── Chapter 5
│   └── Chapter 6 / Security stage (crossed or tentative in source)
└── DSR Records / Versions
    ├── DSR I
    ├── DSR II
    ├── DSR III
    └── DSR IV
```

## 2. Confirmed responsibility hierarchy

The handwritten plan indicates section-level ownership rather than one user
editing the complete DSR.

| Document area | Proposed owner | Responsibility |
|---|---|---|
| Title Page | Admin | Project identity and document metadata |
| Table of Contents | System | Auto-generated after final report merge |
| Executive Summary | Admin / designated officer | Summary preparation and confirmation |
| Project initiation | DMO | Starts the DSR using one of the approved initiation paths |
| Technical preparation | COE SENSRS | Prepares, uploads and updates assigned technical content |
| Technical review | Reviewer | Reviews the submitted DSR and records observations |
| Final approval | Head Office | Approves, returns or finalizes the DSR |

## 3. DSR record hierarchy

The source shows a parent `DSR` node branching into records labelled I, II,
III and IV. These should be treated as sibling records under one project until
their exact business meaning is confirmed.

```text
Project
└── DSR Collection
    ├── DSR I
    ├── DSR II
    ├── DSR III
    └── DSR IV
```

Possible meanings to confirm before IDs are assigned:

- Report phases
- DSR versions
- District/mineral categories
- Workflow instances

## 4. DSR creation and approval workflow

```text
Select DSR record
├── Review / available notes
├── Upload new data
└── Create new
    └── Start blank

Upload/Create
└── Prefill
    └── Save Draft
        └── Submit
            └── Review Level
                └── Head Office Approval
                    └── Final DSR
```

## 5. Confirmed workflow role IDs

These are stable logical role IDs. They must be used consistently in the
database, API authorization, notifications, audit logs and frontend guards.

| Display name | Logical role ID | Primary responsibility |
|---|---|---|
| District Mining Officer | `DMO` | Project initiation and district-level control |
| COE SENSRS | `COE_SENSRS` | Technical preparation and document/data entry |
| Reviewer | `REVIEWER` | Technical scrutiny and revision observations |
| Head Office | `HEAD_OFFICE` | Final decision and approval |

One initial application account is required for each role. Account usernames,
emails and temporary passwords must be configured separately from these role
IDs and must not be embedded in the hierarchy model.

## 6. DMO project initiation dashboard

The DMO dashboard is the only operational dashboard that initiates a project.
It must show one primary action named `Initiate DSR Project`, followed by these
four mutually exclusive start paths:

```text
Initiate DSR Project
├── Import Previous DSR
├── Start Next Phase
├── Upload New DSR
└── Create Blank Project
```

### 6.1 Import Previous DSR

```text
Select/import previous DSR
→ Parse available structure and files
→ Create a new editable project draft
→ Preserve the imported report as source/version history
→ Assign technical preparation to COE SENSRS
```

### 6.2 Start Next Phase

```text
Select an existing eligible DSR
→ Validate that the current phase is approved/finalized
→ Clone the approved structure into the next phase
→ Carry forward allowed data and references
→ Reset workflow status to DRAFT
→ Assign technical preparation to COE SENSRS
```

### 6.3 Upload New DSR

```text
Upload a new DSR PDF/package
→ Parse front matter, chapters, plates and annexures
→ Show detected hierarchy for confirmation
→ Create the project draft
→ Assign technical preparation to COE SENSRS
```

### 6.4 Create Blank Project

```text
Enter district, year, mineral and project metadata
→ Create the standard empty DSR hierarchy
→ Set status to DRAFT
→ Assign technical preparation to COE SENSRS
```

The selected initiation type must be retained as project metadata:

```text
PREVIOUS_DSR_IMPORT
NEXT_PHASE
NEW_DSR_UPLOAD
BLANK_PROJECT
```

## 7. Role workflow

```text
DMO
  └── Initiates project and selects the start path

COE SENSRS
  └── Prepares technical content and submits the DSR

Reviewer
  └── Reviews submission and either clears it or requests revision

Head Office
  └── Approves, returns or finalizes the DSR
```

## 8. Confirmed end-to-end workflow

```text
DMO: Initiate Project
→ DMO: Select initiation path
→ System: Create DSR draft and audit initiation type
→ COE SENSRS: Prepare / upload / update technical content
→ COE SENSRS: Submit for review
→ Reviewer: Review
   ├── Revision Required → COE SENSRS
   └── Review Cleared → Head Office
→ Head Office
   ├── Return for Revision → Reviewer / COE SENSRS
   └── Approve → Finalize DSR
```

## 9. Recommended system model

```text
Project
├── DSR Record
│   ├── Document Structure
│   │   ├── Front Matter
│   │   ├── Executive Summary
│   │   └── Chapters
│   ├── Assigned Roles
│   ├── Uploaded Files
│   ├── Draft Versions
│   ├── Review Notes
│   ├── Approval History
│   └── Final Report
└── Additional DSR Records
```

## 10. States to retain

Every DSR record should retain:

- Current workflow status
- Current assignee
- Chapter/section owner
- Uploaded source document
- Prefilled data
- Draft revisions
- Reviewer observations
- Submission history
- Head Office decision
- Final generated PDF

Recommended state sequence:

```text
NEW
→ PREFILLED
→ DRAFT
→ SUBMITTED
→ UNDER_REVIEW
→ REVISION_REQUIRED (optional loop)
→ HEAD_OFFICE_REVIEW
→ APPROVED
→ FINALIZED
```

## 11. Entity ID convention

The four role IDs are now approved. Entity IDs will be defined for:

- Project
- DSR record
- Document section
- Chapter
- Role assignment
- Upload
- Draft/version
- Submission
- Review
- Approval
- Final report

The ID convention will be deterministic and readable, with database primary
keys kept separate from human-facing reference codes.

Recommended human-facing codes:

```text
Project:       DSR-{DISTRICT}-{YEAR}-{SEQUENCE}
Phase:         {PROJECT_CODE}-P{PHASE_NO}
Submission:    {PROJECT_CODE}-SUB-{SEQUENCE}
Review:        {PROJECT_CODE}-REV-{SEQUENCE}
Approval:      {PROJECT_CODE}-APR-{SEQUENCE}
Final report:  {PROJECT_CODE}-FINAL-{VERSION}
```

## 12. Permissions contract

| Capability | DMO | COE SENSRS | Reviewer | Head Office |
|---|---:|---:|---:|---:|
| Initiate project | Yes | No | No | No |
| Import previous DSR | Yes | No | No | No |
| Start next phase | Yes | No | No | No |
| Upload new DSR source | Yes | No | No | No |
| Create blank project | Yes | No | No | No |
| Prepare technical content | Limited oversight | Yes | No | No |
| Submit for review | No | Yes | No | No |
| Record review observations | No | No | Yes | No |
| Clear technical review | No | No | Yes | No |
| Final approval | No | No | No | Yes |
| Return for revision | No | No | Yes | Yes |
| Finalize/publish DSR | No | No | No | Yes |
