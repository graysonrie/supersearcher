the idea:

we add options in settings to disable adding clicked directories to the queue

then, we have a lightweight schedule table that stores
schedules (
  for_directory  TEXT PRIMARY KEY,  -- e.g. "C:\\"
  interval_secs  INTEGER NOT NULL,   -- e.g. 30 days
  last_run_at    INTEGER NULL        -- unix; NULL = never / due now
)

the the schedule is only checked ONLY if the crawler is trying to do busy work
* Thus, the user should only be able to add DRIVES to the schedules

If 