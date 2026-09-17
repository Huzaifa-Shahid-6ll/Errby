# Errby screen index
17 September 2026 · 16 distinct concept views, including two theme alternatives.
The generated images appear in the conversation. This archive contains design documentation, tokens and prompts; it does not contain image binaries or app code.

| ID | View | Route | Revision |
| --- | --- | --- | --- |
| 01-home | Student home | / | 1 |
| 02-setup | Learner setup | /setup | 1 |
| 03-join | Join a class | /join | 1 |
| 04-prepare | Prepare a lesson | /prepare/:id | 1 |
| 05-lesson | School lesson detail | /lessons/:id | 1 |
| 06-session | Teaching session and supervisor | /sessions/:id | 2 |
| 07-results | Student results | /sessions/:id/results | 1 |
| 08-classes | Teacher classes | /teacher/classes | 1 |
| 09-roster | Class roster and lessons | /teacher/classes/:id | 1 |
| 10-materials | Upload and review curriculum | /teacher/classes/:id/materials | 1 |
| 11-student-detail | Student evidence detail | /teacher/classes/:id/students/:id | 1 |
| 12-settings | Settings and accessibility | /settings | 1 |
| 13-home-dark | Home, dark alternative | / · dark variant | 1 |
| 14-session-dark | Session, dark alternative | /sessions/:id · dark variant | 2 |
| 15-sign-in | Sign in | /sign-in · supporting screen | 1 |
| 16-uncertainty | Supervisor uncertainty | /sessions/:id · uncertainty state | 2 |

## Review notes
All 16 initial concepts were visually reviewed. The light teaching session, dark teaching session and uncertainty screen were revised to strengthen role labels and separate student/Errby/Supervisor styling. Use the revised versions of 06, 14 and 16.

These are concept images. During implementation use exact tokens and content specifications over incidental generated details:
- Reserve amber panels/shields for supervision or explicit review. Neutralize decorative amber panels on join/sign-in; use teal for a completed teacher review.
- Use neutral student surfaces and a person/initial icon in teacher evidence comparisons; the robot icon under “Student explanation” in image 11 must become a student icon.
- Use stable labelled navigation and a consistent active route. Several concepts highlight Home on deeper views; correct this when building. Mobile layouts must collapse the rail and stack the session panels; no phone-specific screenshot is included.
- Image 10 mentions Word files. The MVP contract remains text and text-based PDFs; use that exact upload label unless DOCX ingestion is deliberately added and verified. Generated UI text does not expand scope.
- In source previews describe spontaneous/net heat transfer from warmer to cooler surroundings rather than an unrestricted “always” claim. Final example sources need teacher review.
- The dark home composer is shown white as a visual variant. For the consistent dark reading theme use the specified dark surface and matching text tokens.
- Form boundaries in raster concepts are sometimes faint. Apply contrast-qualified control borders, visible keyboard focus and accessible labels in the app.
- The uncertainty screen illustrates a separate experiment scenario; do not infer that its three goal names are the same lesson instance as the melting session.
- Completion and accuracy metrics are sample data, scoped to one session. Retain explicit student evidence and do not mark a corrected goal explained until the learner explains it again.
- Username recovery through a teacher applies to class-managed learners. Independent accounts need the recovery path from the account specification.
- Claims on screens are sample UI copy; the teacher review action is an in-app review request, not an instruction to send external messages.

## Coverage limits
Each screen shows a representative desktop state. Error, empty, loading, mobile and keyboard states remain specified in the implementation documentation and need implementation testing. A visual review and token contrast calculations do not certify accessibility or learning effectiveness.
