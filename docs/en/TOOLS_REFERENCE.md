# Tools Reference (Suite Modules)

Stella Rikka currently consists of **8 interconnected modules**. This document serves as a technical manual and usage guide to understand the purpose and capabilities of each tool.

---

## 1. Project Hub (Document Manager)
**Main Route:** `/hub`
**Purpose:** Acts as the project's nerve center. Allows organizing all documentation in a structured flow (Ideation, Development, Testing, etc.).
**Key Features:**
* **Flexible Nodes:** Create notes in Markdown format, attach files, or link web resources.
* **Interconnectivity:** A Hub node can directly open another tool in the suite (e.g., linking a node to a specific Kanban Board).
* **Dossier Export:** Compiles all texts and links from nodes into a single Markdown (`.md`) document for quick reporting.

## 2. Eisenhower Matrix
**Main Route:** `/eisenhower/seleccion`
**Purpose:** Time and task management based on urgency and importance. Ideal for daily prioritization.
**Key Features:**
* **4 Drag & Drop Quadrants:** Do (Urgent/Important), Plan, Delegate, and Eliminate.
* **Visual Statistics:** Pie charts generated with Chart.js showing performance and task completion.
* **Excel Import:** Allows massive ingestion of tasks from `.xlsx` files.

## 3. MoSCoW Matrix
**Main Route:** `/moscow/seleccion`
**Purpose:** Agile prioritization of software requirements and product features.
**Key Features:**
* **Classification Columns:** Must Have (Mandatory), Should Have (Important), Could Have (Desirable), and Won't Have (Discarded).
* **Effort Estimation:** Each card allows setting the expected technical effort level, helping to plan Sprints.

## 4. Kanban Board
**Main Route:** `/kanban/seleccion`
**Purpose:** Workflow and continuous visual progress management.
**Key Features:**
* **Classic Flow:** Backlog, To Do, In Progress, Review, and Done columns.
* **Statuses and Assignees:** Detailed tracking of who is in charge of which card.

## 5. Lean Canvas
**Main Route:** `/leancanvas/seleccion`
**Purpose:** Business model modeling and validation (based on Ash Maurya).
**Key Features:**
* **9 Fundamental Blocks:** Problem, Solution, Value Proposition, Metrics, Unfair Advantage, Channels, Segments, Costs, and Revenues.
* **Hypothesis and Validation System:** Every note added to the canvas has a color state (Hypothesis [Gray], Validating [Orange], Validated [Green]).
* **Version History:** Allows saving "v1", "v2" versions and comparing changes between business model pivots.

## 6. Flowcharts
**Main Route:** `/diagramas/seleccion`
**Purpose:** Mapping of logical processes, algorithms, and user flows.
**Key Features:**
* **Snap-to-Grid:** Canvas with magnetic grid snapping.
* **Smart Nodes:** Default shapes (Start, Process, Condition, End) that can be dynamically connected using SVG vector arrows.

## 7. Database Diagrams (DBML / ER)
**Main Route:** `/dbdiagrams/seleccion`
**Purpose:** Visual design and architecture of relational database models.
**Key Features:**
* **Code Auto-Generation:** Allows pasting `SQL` or `DBML` (Database Markup Language) code, and the engine will automatically render tables and their relationships (1:N, N:M) on the canvas.
* **Dynamic Connections:** Lines between foreign and primary keys are automatically rerouted when moving tables.

## 8. Use Cases (UML)
**Main Route:** `/casosdeuso/seleccion`
**Purpose:** Modeling system behavior and user (actor) interaction.
**Key Features:**
* **Interactive Infinite Canvas:** Native Pan and Zoom for complex UML diagrams.
* **Standardized Elements:** Rendering of Actors (stickmen), Use Cases (ovals), and System Boundaries (rectangular).

---

## Summary of Universal Functions
Across all 8 tools, the following patterns have been standardized:
- **Global Navigation Bar (Topbar):** Uniform design in all modules with quick access to home and theme switching.
- **`.rikka` Format:** All tools include a `Download .rikka` button, generating a JSON payload with all project metadata for offline portability.
- **Contextual Help Modal:** The `❓ Help` button always invokes an interactive modal with "Prime" rules and tips on how to use the current methodology or tool.
