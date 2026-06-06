# 🏆 Capstone 3 — Full-Stack Application

> **Semester:** 3 | **Weeks:** 15–16  
> **Estimated time:** 30 hours  
> **Languages:** Java 17 (backend) · TypeScript + React 18 (frontend) · SQL (PostgreSQL) · Docker

---

## 🎯 Business Requirement (The PM Brief)

*Build "DevBoard" — a developer productivity dashboard where engineers can track their GitHub-style personal task boards. Users can create projects, add tasks with priorities and tags, track time, and view analytics.*

---

## 📋 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    DevBoard                         │
│                                                     │
│  React 18 + TypeScript          Spring Boot 3 API   │
│  ┌──────────────────┐          ┌─────────────────┐  │
│  │  React Query     │◄────────►│ REST Controllers │  │
│  │  Zustand (UI)    │  JWT API │ Spring Security  │  │
│  │  Vite build      │          │ JPA + PostgreSQL │  │
│  └──────────────────┘          └─────────────────┘  │
│           │                           │             │
│           └─────── Docker Compose ────┘             │
│                      + GitHub Actions CI            │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Domain Model

### Entities

**`User`** — name, email, password (BCrypt), role, createdAt  
**`Project`** — name, description, ownerId, color, status (ACTIVE/ARCHIVED)  
**`Task`** — title, description, projectId, assigneeId, priority (LOW/MEDIUM/HIGH/CRITICAL), status (TODO/IN_PROGRESS/REVIEW/DONE), dueDate, tags  
**`TimeEntry`** — taskId, userId, startedAt, endedAt, durationMinutes, description  

### Business Rules
- A `Project` belongs to one owner; collaborators can be invited
- A `Task` must belong to a `Project`
- `TimeEntry.durationMinutes` = `endedAt - startedAt` (auto-calculated)
- Total time logged per task = sum of all `TimeEntry` durations for that task

---

## 📋 Backend API Spec (Spring Boot 3)

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/projects` | My projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/{id}/tasks` | Tasks in project (filterable by status, priority) |
| POST | `/api/projects/{id}/tasks` | Create task |
| PATCH | `/api/tasks/{id}/status` | Move task to new status |
| POST | `/api/tasks/{id}/time-entries` | Start a time entry |
| PUT | `/api/time-entries/{id}/stop` | Stop time entry |
| GET | `/api/analytics/summary` | Dashboard stats: tasks done today, total time logged this week |

---

## 📋 Frontend Features (React 18 + TypeScript)

### Pages
1. **Login / Register** — auth forms with validation
2. **Dashboard** — summary cards (tasks due today, time logged this week, project health)
3. **Project Board** — Kanban board (TODO / IN_PROGRESS / REVIEW / DONE columns, drag-to-move tasks)
4. **Task Detail** — edit task, log time, view time history
5. **Analytics** — charts (tasks completed per day, time by project)

### Required Tech
- `React Query` for all API calls (no raw `fetch` in components)
- `Zustand` for UI state (selected project, board filters)
- `react-beautiful-dnd` or `@dnd-kit/core` for Kanban drag-and-drop
- `recharts` for analytics charts
- TypeScript strict mode — no `any` types

---

## 📝 Skeleton Code

### Backend — `Task.java`
```java
package com.devboard.domain.task;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "tasks")
public class Task {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
    
    @Enumerated(EnumType.STRING)
    private Priority priority;
    
    @Enumerated(EnumType.STRING)
    private TaskStatus status;
    
    private LocalDate dueDate;
    
    @ElementCollection
    @CollectionTable(name = "task_tags", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "tag")
    private Set<String> tags = new HashSet<>();
    
    // Domain method: move task to new status with validation
    public void moveTo(TaskStatus newStatus) {
        // TODO: validate valid transitions (e.g., cannot go from DONE back to TODO without reason)
        this.status = newStatus;
    }
    
    // Domain method: check if task is overdue
    public boolean isOverdue() {
        return dueDate != null && LocalDate.now().isAfter(dueDate) && status != TaskStatus.DONE;
    }
}
```

### Frontend — `useProjects.ts`
```typescript
// src/hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Project {
  id: number;
  name: string;
  description: string;
  color: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  color: string;
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/api/projects').then(r => r.data),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectRequest) =>
      api.post<Project>('/api/projects', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

### Frontend — `KanbanBoard.tsx`
```tsx
// src/pages/KanbanBoard.tsx
import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

interface Task {
  id: number;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: TaskStatus;
  dueDate?: string;
  tags: string[];
}

const COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export function KanbanBoard({ projectId }: { projectId: number }) {
  // TODO: use useQuery to load tasks for projectId
  // TODO: group tasks by status into columns
  // TODO: onDragEnd: call PATCH /api/tasks/{id}/status with new status
  
  const handleDragEnd = (result: DropResult) => {
    // TODO: if dragged to different column, update task status via mutation
    //       use optimistic update for instant UI feedback
  };
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {COLUMNS.map(status => (
          <Droppable droppableId={status} key={status}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{ minWidth: 250, background: '#f5f5f5', padding: '1rem', borderRadius: 8 }}
              >
                <h3>{status.replace('_', ' ')}</h3>
                {/* TODO: render TaskCard for each task in this column */}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
```

---

## ✅ Acceptance Criteria

- [ ] Register + Login flow works end-to-end with JWT
- [ ] Kanban board shows tasks grouped by status
- [ ] Drag-and-drop moves task to new status (persisted to backend)
- [ ] Time tracking: start timer → stop timer → see duration on task
- [ ] Analytics dashboard shows real data from API
- [ ] Docker Compose runs: frontend + backend + PostgreSQL
- [ ] GitHub Actions pipeline: test → build → push Docker image
- [ ] All TypeScript — zero `any` types
- [ ] Backend: 80%+ test coverage (JUnit 5 + MockMvc)

---

## 🔴 Failure Scenarios & Erklärungen

| Mistake | Why | Fix |
|---|---|---|
| JWT stored in `localStorage` | XSS attacks can steal tokens | Store in `httpOnly` cookie — inaccessible to JS |
| `useEffect(() => { fetch(url) })` directly in components | Race conditions, no deduplication, no caching | Use React Query `useQuery` — handles all this |
| CORS not configured in Spring | Frontend blocked by browser | Add `@CrossOrigin` or configure `CorsConfigurationSource` in `SecurityConfig` |
| No optimistic update on drag | Board flickers on status change (API latency) | Use React Query's `onMutate` for optimistic updates |
| `TimeEntry.durationMinutes` set by frontend | Client can send arbitrary duration | Always calculate server-side: `endedAt - startedAt` |

---

## 🚀 Extension Challenges

1. **Real-time collaboration:** WebSocket/SSE push when a teammate moves a task
2. **GitHub integration:** Show recent commits for a project via GitHub API
3. **Recurring tasks:** Tasks that reset to TODO every week
4. **Export:** Export task list + time log as CSV

---

[← Back to Semester 3 Guide](../../00_CURRICULUM/SEMESTER_3_GUIDE.md)
