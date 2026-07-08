# Data model

Entity relationships. Schema lives in `src/lib/db/schema.ts`; generated SQL in
`drizzle/`.

```mermaid
erDiagram
    PROJECT ||--o{ SHOT : has
    SHOT    ||--o{ VERSION : has
    VERSION ||--o{ NOTE : has

    PROJECT {
        text id PK
        text name
        text description
        int  createdAt
    }
    SHOT {
        text id PK
        text projectId FK
        text code
        text description
        text status "WIP|NEEDS_REVIEW|APPROVED|REJECTED"
        int  createdAt
    }
    VERSION {
        text id PK
        text shotId FK
        int  number "auto per shot -> v001…"
        text label
        text status
        text sourceType "mov|seq"
        text sourcePath
        text seqPattern
        int  frameStart
        int  frameEnd
        int  fps
        text nukeScriptPath
        int  renderedAt
        text proxyStatus "pending|processing|ready|failed"
        text proxyError
        int  frameCount
        bool hasMp4
        int  createdAt
    }
    NOTE {
        text id PK
        text versionId FK
        int  frame "nullable = general"
        text body
        text drawing "vector-stroke JSON"
        bool hasDrawing
        bool resolved
        int  createdAt
    }
```

Cascade deletes flow down: deleting a project removes its shots → versions →
notes. Generated proxy media under `data/media/<versionId>/` is owned by the app
and is not represented in the DB (paths are derived from the version id).
