
# Aura Task: Final Project Blueprint (Definitive Edition)

## Part 1: Common Project Principles

This section outlines the shared vision, architecture, and goals that govern the entire Aura Task project.

### 1.1. Project Vision

To build an intelligent task management application named Aura Task. The system's core feature is its ability to parse natural language from both single-line inputs and long-form meeting transcripts, converting unstructured text into structured, actionable tasks.

### 1.2. Architectural Approach: Decoupled (Headless)

**What it is:** We are building the application as two distinct, separate projects: a Backend API (the "brain") and a Frontend Client (the "face").

**Why we are using this approach:**
- **Parallel Development:** It allows the backend (built in Cursor) and the frontend (built by @lovable.dev) to be developed, tested, and deployed simultaneously and independently.
- **Scalability & Maintainability:** Each part can be scaled or updated without impacting the other.
- **Technology Flexibility:** It allows us to use the absolute best technology for each job: Python/FastAPI for data processing and React/TypeScript for rich user interfaces.
- **Future-Proofing:** The backend API becomes a reusable asset that can later serve other clients (e.g., a native mobile app).

### 1.3. The API as a Contract

The bridge between the frontend and backend is a strictly defined REST API. The Backend Proposal (Part 2) defines this contract. The Frontend Proposal (Part 3) details how to consume it. This contract is the single source of truth for all data interaction.

### 1.4. Phased Development Plan

**Phase 1 (MVP - This Document):** Our entire focus is on building the core functionality in a single-user context. The final product of this phase will be a fully working application without user accounts. It will operate as a single, shared task board. The database schema, however, will be pre-built to accommodate future user functionality.

**Phase 2 (Authentication - Future):** The architecture is explicitly designed to make adding a full user authentication system a straightforward upgrade.

### 1.5. Data Strategy for AI Systems

We will always store the original user input (original_text). This is non-negotiable for debugging AI parsing errors, performing audits, and having the ability to re-process data with future, improved AI models.

---

## Part 2: Backend Development Proposal

This document specifies the complete technical plan for building the Aura Task API.

### 2.1. Objective

To build a secure, high-performance, and well-documented REST API using Python that serves as the brain for the Aura Task application.

### 2.2. Technology Stack

- **Language/Framework:** Python 3.10+ with FastAPI
- **Data Validation:** Pydantic
- **AI Service:** OpenAI API with gpt-3.5-turbo (using JSON Mode)
- **Database:** Supabase (Hosted PostgreSQL)
- **Server:** Uvicorn

### 2.3. Definitive Database Schema

The database will be hosted on Supabase. For the MVP, we will create a single table named `tasks`. It includes a `user_id` column from day one to ensure a seamless future upgrade path.

**Table: tasks**

| Column Name | Data Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| id | UUID | Primary Key, default: uuid_generate_v4() | The unique identifier for each task. |
| task_name | TEXT | NOT NULL | The core action or title of the task. |
| assignee | TEXT | NULLABLE | The name of the person assigned to the task. |
| due_date | TIMESTAMPTZ | NULLABLE | The deadline as a full timestamp with timezone. |
| priority | TEXT | NOT NULL, default: 'P3' | Priority level ('P1', 'P2', 'P3', 'P4'). |
| status | TEXT | NOT NULL, default: 'To Do' | The current workflow state of the task. |
| original_text| TEXT | NULLABLE | The original, raw text input from the user. |
| source | TEXT | NOT NULL | How it was created ('single\task' or 'transcript'). |
| created_at | TIMESTAMPTZ| NOT NULL, default: now() | Timestamp of when the record was created. |
| user_id | UUID | NULLABLE | Future Auth: Will hold user's ID. Kept NULL for MVP. |

### 2.4. Detailed Backend Processing Logic

**A. Core Data Handling:**
- **user_id in the MVP:** For every task created during this phase, the user_id field will be deliberately set to NULL in the database. The column exists purely to avoid a complex database migration in the future.
- **original_text for Transcripts:** If a single transcript generates four tasks, the entire, identical transcript text will be saved in the original_text column for all four of those task rows.

**B. Pydantic Model Definition** (`/app/models/task.py`)

**C. NLP and Validation Flow** (`/app/services/nlp_service.py` & API Endpoints)
1. **Receive Input:** An endpoint receives raw text (e.g., from POST /api/tasks/parse-single).
2. **Construct Prompt:** It builds the highly-specific system prompt to instruct the AI to return a JSON object with task_name, assignee, due_date, and priority.
3. **Call AI:** It calls the OpenAI API with response_format={ "type": "json_object" } to guarantee a valid JSON string response.
4. **Validate (Pydantic Gate):** The app attempts to load the AI's JSON output into the TaskParsed model. This is our critical validation step.
5. **Handling Improper Prompts:** If the user input is gibberish and the AI returns {"task_name": ""}, Pydantic's min_length=1 constraint raises a ValidationError. If the AI hallucinates an invalid priority, the pattern constraint fails.
6. **Error Response:** The API will catch any ValidationError, stop processing, and return a 422 Unprocessable Entity HTTP error. No invalid data reaches the database.
7. **Enrich and Save:** If validation passes, the logic creates a TaskCreate object, adding source, original_text, and explicitly setting user_id=None. This object is then saved to the database.
8. **Respond:** The API returns the complete TaskInDB object with a 201 Created status code.

### 2.5. API Endpoint Specification (The Contract)

| Method | Endpoint | Description | Success Response |
| :--- | :--- | :--- | :--- |
| POST | /api/tasks/parse-single | Parses one line of text, creates one task. | 201 Created, TaskInDB object |
| POST | /api/tasks/parse-transcript | Parses a transcript, creates multiple tasks. | 201 Created, List[TaskInDB] |
| GET | /api/tasks | Fetches all tasks. | 200 OK, List[TaskInDB] |
| PUT | /api/tasks/{task_id} | Updates a task. | 200 OK, updated TaskInDB object |
| DELETE | /api/tasks/{task_id} | Deletes a task by its UUID. | 204 No Content |

### 2.6. Deployment Strategy

- **Platform:** Render.
- **Process:** On every git push to the main branch, a CI/CD pipeline will automatically deploy the latest version of the FastAPI application.
- **Connectivity:** The API will use CORS middleware configured to only accept requests from the official deployed frontend domain, ensuring security. All secrets will be managed as secure environment variables in Render.

### 2.7. Future Authentication: The Backend Upgrade Path

The user_id column already exists, making the upgrade simple.

1. **Database:** Create a users table. Add a FOREIGN KEY constraint to the existing tasks.user_id column, pointing it to users.id.
2. **Code:** Create /auth endpoints for login/signup. Update the /tasks endpoints to require a token and use the user's ID from that token in all database queries (e.g., WHERE user_id = :current_user_id). Update the TaskCreate Pydantic model to make user_id a required field.

---

## Part 3: Frontend Development Proposal

This document specifies the complete requirements for the Aura Task user interface.

### 3.1. Objective

To build a visually appealing, fully responsive, and intuitive SPA that consumes the backend API specified in Part 2.

### 3.2. Technology Stack

- **Framework/Language:** React 18+ with TypeScript & Vite.
- **Styling:** Tailwind CSS.

### 3.3. UI/UX Design: Minimalist and Consistent

- **Principle:** Clean, uncluttered, and focused on tasks.
- **Responsiveness:** Mobile-first is a mandatory constraint. The layout must reflow intelligently from a 375px mobile screen to a large desktop.
- **Color Palette:** bg-slate-50 (Background), text-slate-900 (Text), bg-indigo-600 (Buttons), with color-coded priority badges (P1: red, P2: orange, P3: blue, P4: slate).

### 3.4. Component Architecture

The application will be built from small, reusable components. Key components include: InputContainer, SingleTaskInput, TranscriptInput, TaskBoard, TaskColumn, and TaskCard. Components should be "presentational," receiving data and functions as props.

### 3.5. Frontend API Interaction

- **API Service** (`src/services/api.ts`): All fetch calls will be centralized here in dedicated functions (getTasks, createSingleTask, etc.).
- **Data Model** (`src/types/index.ts`): The TypeScript interface will perfectly match the backend's TaskInDB model.

### 3.6. Deployment Strategy

- **Platform:** Vercel.
- **Process:** On every git push to main, Vercel will auto-build and deploy the frontend.
- **Connectivity:** A VITE_API_BASE_URL environment variable in Vercel will point to the live backend URL (e.g., https://aura-task-api.onrender.com), telling the frontend where to send API requests.

### 3.7. Future Authentication: The Frontend Upgrade Path

1. **Introduce AuthContext:** A global React Context will manage the user's auth state (token, user data) and provide login/logout functions.
2. **Update API Service:** The centralized API service will be modified to get the auth token from the AuthContext and add it to the Authorization header of every request. This is a single point of change.
3. **Add UI:** New routes for /login and /signup will be created. The header will display "Login" or the user's name based on the AuthContext state. The core task management UI will require minimal changes.
