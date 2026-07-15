What we need:

1. Button on the bottom-left file screen indexer where you can fullscreen it.

2. Way to define 'schedules'. You pick a directory (or drive) and say, I want to only index this every 30 days and 5 hours. This gets added to the database. The crawlers read from it. When they receive a sub-file from the directory, they add a note on that schedule of the first TIME the item was indexed. When adding stuff to the recently indexed table, they do TODAYS_TIME + SCHEDULE_DURATION - FIRST_INDEXED_TIME 

ex:
todays time: 9:00
schedule duration: 2 hours
first indexed time: 8:00

a file added to recently indexed dirs at this point 

3. Ensure that whitelisting directories, especially in rapid succession makes the crawlers do what they're supposed to do