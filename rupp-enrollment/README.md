# RUPP Enrollment & Entrance Examination System

Royal University of Phnom Penh – admission, entrance exam and results management.

- **Frontend:** Next.js 14 (App Router, TypeScript) + Tailwind CSS → `frontend/`
- **Backend:** Spring Boot 3.3 (Java 17) REST API, Spring Security + JWT, JPA → `backend/`
- **Database:** H2 file database by default (zero setup); PostgreSQL via the `postgres` profile

## Run it

### 1. Backend (http://localhost:8080)
```bash
cd C:\Users\RITH\Downloads\rupp-enrollment\rupp-enrollment\backend
mvn spring-boot:run
# PostgreSQL instead of H2:
# DB_URL=jdbc:postgresql://localhost:5432/rupp DB_USER=postgres DB_PASSWORD=... mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```
On first start the database is seeded with demo data.

### 2. Frontend (http://localhost:3000)
```bash
cd C:\Users\RITH\Downloads\rupp-enrollment\rupp-enrollment\frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8080/api
npm install
npm run dev
```

### Demo accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@rupp.edu.kh | Admin@123 |
| Officer | officer@rupp.edu.kh | Officer@123 |
| Student | student@rupp.edu.kh | Student@123 |

Seeded programs: Computer Science, Engineering, Business Administration – each with a sample entrance exam (multiple-choice + one written question).

## How the flow maps to the system

**Student:** register → profile → choose faculty/major → application + documents (transcript, ID, photo) → submit (`PENDING_REVIEW`) → officer review (`ELIGIBLE` or `INCOMPLETE` → fix & resubmit) → exam schedule notification (`EXAM_SCHEDULED`) → take exam (timed, auto-submit) → `EXAM_COMPLETED` → result when published (`ADMITTED` / `PENDING` / `NOT_ADMITTED`).

**Admin / Officer:** dashboard → faculties & majors (seats, min grade) → create exam + questions (per subject; MCQ auto-graded, written graded manually) → assign exam to a major → schedule (window + eligible applicants) → monitor attempts → grade → auto-evaluate admission → override if needed → publish results (applicants are notified).

**Shared exam engine:** one `Exam`/`Question`/`ExamAttempt` model; every major simply owns its own exam, subjects, duration, pass mark and questions.

**Admission rule (Auto-evaluate):** applicant qualifies if exam score ≥ exam pass % **and** high-school grade ≥ major min grade. Qualified applicants are ranked by score: top *N* (seats left) → `ADMITTED`, the rest → `PENDING` (waitlist); others → `NOT_ADMITTED`. Decisions stay hidden from students until **Publish**.

## Modules → code
| Module | Backend | Frontend |
|---|---|---|
| Authentication | `AuthService`, `AuthController`, `security/*` | `/login`, `/register`, `/forgot-password` |
| Student management | `StudentService` (profile) | `/student/profile` |
| Faculty & major | `AdminService`, `/api/admin/faculties|majors` | `/admin/programs` |
| Enrollment | `StudentService`, `ProcessService.review` | `/student/application`, `/admin/applications` |
| Examination | `AdminService` (exams/questions), `ProcessService` (schedules/monitor), `StudentService` (attempts) | `/admin/exams`, `/admin/schedules`, `/student/exam` |
| Grading | `StudentService.submitExam` (auto), `ProcessService.grade` (manual) | `/admin/grading` |
| Admission | `ProcessService.evaluate/decide/publish` | `/admin/admission`, `/student/result` |
| Notifications | `NotificationService` | `/student/notifications` |
| Reports | `ReportService` | `/admin`, `/admin/reports` (CSV export) |

## API overview
- `POST /api/auth/register|login|forgot-password|reset-password`, `GET /api/public/faculties|majors`
- `/api/student/**` (role STUDENT): `profile`, `application`, `application/documents`, `application/submit`, `exam`, `exam/start`, `exam/submit`, `result`, `notifications`
- `/api/admin/**` (role ADMIN/OFFICER): `faculties`, `majors`, `exams`, `exams/{id}/questions`, `applications`, `applications/{id}/review`, `documents/{id}`, `schedules`, `schedules/{id}/monitor`, `attempts`, `attempts/{id}/grade`, `admission/{majorId}` (+`/evaluate`, `/publish`), `admission/applications/{id}/decide`, `reports/summary`

## Known limitations / before going to production
- **Password reset** generates a token and prints it in the backend log; plug in an email/SMS sender in `AuthService.forgotPassword`. There is no email-verification step yet.
- Exam answers are saved on submit only; refreshing mid-exam keeps the timer (server-side deadline) but loses unsaved answers.
- Change `app.jwt.secret` (use the `JWT_SECRET` env var), serve over HTTPS, and set `app.cors-origin` to your real frontend URL.
- Uploaded documents are stored on local disk (`./uploads`); use object storage for multi-server deployments.
- Admin accounts are seeded; there is no UI yet to create officers.
- No automated tests are included.
