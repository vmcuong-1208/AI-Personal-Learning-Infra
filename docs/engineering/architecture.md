# Architecture Notes

## Proposed Source Layout

```text
src/
  app/
  components/
    layout/
    ui/
  data/
    mock/
  features/
    dashboard/
    journal/
    ai-coach/
    search/
    quiz/
    analytics/
  lib/
  styles/
tests/
  unit/
  e2e/
```

## Feature Boundaries

- `dashboard`: overview cards, activity, insights, recent entries.
- `journal`: new entry editor and entry detail pages.
- `ai-coach`: chat workspace and prompt suggestions.
- `search`: note search, filters, result list, synthesis panel.
- `quiz`: quiz state, answer feedback, session stats.
- `analytics`: charts, metrics, weak areas, progress summaries.

## Shared Components

Shared visual primitives should live in `src/components/ui`. Feature-specific composed components should live inside their feature folder.

## Data Model Starting Point

- `JournalEntry`
- `LearningTopic`
- `AiInsight`
- `QuizQuestion`
- `QuizSession`
- `AnalyticsSummary`
- `SearchResult`

## Testing Direction

- Unit test search filtering, quiz scoring, and data transformation helpers.
- E2E smoke test each main route after the app is scaffolded.
