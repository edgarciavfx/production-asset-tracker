# Publish → proxy → review pipeline

From a Nuke publish (or curl / manual form) to a frame-accurate review.

```mermaid
sequenceDiagram
    participant Nuke as Nuke button / curl
    participant API as POST /api/publish
    participant Ingest as ingestVersion()
    participant DB as SQLite
    participant Worker as proxy worker
    participant FF as ffmpeg
    participant UI as ShotReview (browser)

    Nuke->>API: JSON payload (project, shot, source, frames, fps, .nk)
    API->>API: validate (publish-schema.ts)
    API->>Ingest: create version (pending)
    Ingest->>DB: upsert project/shot, insert version
    Ingest->>Worker: enqueueProxyJob(versionId)
    API-->>Nuke: 201 { versionId, reviewUrl }

    Worker->>DB: status = processing
    Worker->>FF: frames/%04d.jpg  (+ thumb, best-effort mp4)
    FF-->>Worker: exit code
    alt success
        Worker->>DB: status = ready, frameCount, hasMp4
    else failure
        Worker->>DB: status = failed, proxyError
    end

    UI->>API: GET /api/versions/:id/status (poll ~1.5s)
    API-->>UI: ready + frameCount
    UI->>API: GET /api/media/frame/:id/:n (preload all frames)
    Note over UI: player swaps <img> per frame — frame-accurate
```

The worker is a single-job in-process queue (`src/lib/proxy/worker.ts`): one
ffmpeg at a time, in-memory. A version stuck `pending`/`processing` after a
server restart is re-runnable via "Retry" (`reprocessVersionAction`).
