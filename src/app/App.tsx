import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { AiCoachPage } from "../features/ai-coach/AiCoachPage";
import { AnalyticsPage } from "../features/analytics/AnalyticsPage";
import { ForgotPasswordPage, GoogleCallbackPage, LoginPage, RegisterPage } from "../features/auth/AuthPages";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { EntryDetailsPage } from "../features/journal/EntryDetailsPage";
import { NewJournalEntryPage } from "../features/journal/NewJournalEntryPage";
import { QuizPage } from "../features/quiz/QuizPage";
import { SearchPage } from "../features/search/SearchPage";

export function App() {
  return (
    <Routes>
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
      <Route
        path="/*"
        element={
          <AppShell>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/journal/new" element={<NewJournalEntryPage />} />
              <Route path="/journal/:entryId" element={<EntryDetailsPage />} />
              <Route path="/coach" element={<AiCoachPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  );
}
