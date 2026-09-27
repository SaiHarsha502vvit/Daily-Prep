# Appendix — Secondary Material

**Navigation**: [← Module front door](../README.md) | [Full chapter catalogue](../00_INDEX.md)

The numbered chapters in the stage folders (`01_` … `09_`) are the curriculum and the
**canonical** version of every topic. This appendix holds material that overlaps with them
in a different form. Every file here opens with a banner naming its canonical chapter —
if the two ever disagree, trust the chapter.

| Folder | What it is | Size | Use it when |
| --- | --- | --- | --- |
| [`quick_reference/`](./quick_reference/) | Topic-by-topic reference pages (config, locators, fixtures, auth, API, parallelism, reliability, files, CI, reporting, data, mocking, tool comparison) plus [the 8 weekly patterns](./quick_reference/00_Weekly_Patterns.md) | 18,418 lines, 15 files | You know the concept and need the API detail fast |
| [`topic_summaries/`](./topic_summaries/) | Condensed single-topic notes (accessibility, security, visual, performance, D365, cross-site patterns, …) | 7,341 lines, 14 files | You want the gist of a specialised topic before its chapter |
| [`short_course/`](./short_course/) | A 6-lesson compressed tour (mindset → TypeScript → POM → architecture → browser internals → project structure) | 1,608 lines, 7 files | You have a weekend, not ten weeks |
| [`learning_paths/`](./learning_paths/) | Alternative routes through the chapters: [learning](./learning_paths/PATHWAY_01_LEARNING.md), [professional](./learning_paths/PATHWAY_02_PROFESSIONAL.md), [office / problem-indexed](./learning_paths/PATHWAY_03_OFFICE.md) | 3 files | The front door's route doesn't fit you |
| [`navigation/`](./navigation/) | [Sitemap](./navigation/SITEMAP.md), [lens index](./navigation/LENS_INDEX.md), [framework code → chapter map](./navigation/MAP_CODE_TO_CHAPTER.md) | 3 files | You're reading `framework/` code and want the chapter behind it |

> **Why this exists as an appendix.** Before the 2026-09 restructure these folders sat at the
> module root beside the chapters, and the root README presented them as *the* module. Topics
> existed in up to four places, and fixes landed in one copy while the others drifted — for
> example `topic_summaries/accessibility.md` still taught `page.accessibility.snapshot()` after
> that API had been removed from Playwright and fixed in Ch39 and Ch45. Keeping one canonical
> copy per topic, with these as clearly-labelled secondary views, is what stops that recurring.
