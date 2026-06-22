# Fast Delivery Plan

Muc tieu: dua LearnFlow AI Dashboard tu bo thiet ke Stitch da chot thanh ban MVP chay duoc nhanh nhat, uu tien giao dien dung design, luong chinh hoat dong, va co du mock data de demo san pham.

## Nguyen Tac Trien Khai Nhanh

- Build app dung duoc truoc, toi uu sau.
- Uu tien visual fidelity theo Stitch desktop/mobile.
- Dung mock data co cau truc ro rang truoc khi noi backend.
- Tach component dung lai som de khong lap code khi build 7 man.
- Moi man phai chay tot tren desktop va mobile.
- Khong paste HTML Stitch vao app; chi dung de tham chieu layout, spacing, text, mau.

## Stack De Xuat

Chon mac dinh de di nhanh:

- Frontend: React + TypeScript + Vite.
- Routing: React Router.
- Styling: CSS variables + CSS modules hoac plain CSS theo component.
- Icons: lucide-react.
- Charts: Recharts hoac CSS/SVG don gian cho MVP.
- Testing: Vitest cho unit, Playwright cho E2E smoke tests.

Ly do: scaffold nhanh, it ceremony, phu hop dashboard SPA, de iterate UI theo Stitch.

## Definition Of Done Cho MVP

- 7 routes chinh hoat dong:
  - `/`
  - `/journal/new`
  - `/journal/:entryId`
  - `/coach`
  - `/search`
  - `/quiz`
  - `/analytics`
- Co desktop sidebar va mobile bottom navigation.
- Co mock data cho journal entries, topics, AI insights, quiz, analytics.
- Moi screen match visual direction cua Stitch o ca desktop va mobile.
- Search co filter/result state co ban.
- Quiz co chon dap an, feedback, next question.
- Journal editor co draft state va nut save demo.
- AI Coach co mock chat interaction.
- Analytics render du chart/card can thiet cho demo.
- Build thanh cong.
- E2E smoke test di qua tat ca route chinh.

## Timebox De Xuat

Tong thoi gian muc tieu: 3 den 5 ngay lam viec tap trung.

Neu can demo cuc nhanh: co the cat bot test va production polish de co ban UI demo trong 1 den 2 ngay.

## Milestone 1: Scaffold App

Muc tieu: co app TypeScript chay duoc voi routing va token design.

Checklist:

- Scaffold React + TypeScript + Vite.
- Cai dependencies can thiet: router, icons, charts, test tools.
- Tao route map.
- Tao CSS variables tu `docs/design/design-system.md`.
- Tao app shell rong.
- Tao mock data folder va type definitions ban dau.

Output:

- App chay duoc local.
- Co route placeholder cho 7 man.
- Co theme tokens.

## Milestone 2: UI Foundation

Muc tieu: build bo component nen de di nhanh cac screen.

Checklist:

- `AppShell`
- `DesktopSidebar`
- `MobileBottomNav`
- `PageHeader`
- `Card`
- `Button`
- `IconButton`
- `Input`
- `Textarea`
- `Chip`
- `ProgressBar`
- `MetricCard`
- `AiPanel`
- `ChartCard`
- `EmptyState`

Output:

- Mot bo UI primitives on dinh.
- Navigation responsive dung cho desktop/mobile.

## Milestone 3: Data Model Va Mock Data

Muc tieu: cac screen co du du lieu chung, khong hardcode lung tung trong UI.

Checklist:

- Tao `JournalEntry`.
- Tao `LearningTopic`.
- Tao `AiInsight`.
- Tao `QuizQuestion`.
- Tao `QuizSession`.
- Tao `AnalyticsSummary`.
- Tao `SearchResult`.
- Tao mock entries lien quan den cac chu de trong Stitch: Redis, BullMQ, Terraform, system design, Kubernetes.

Output:

- UI co the map data that.
- Sau nay thay API de hon.

## Milestone 4: Build 7 Screens Theo Thu Tu Uu Tien

Thu tu nay uu tien demo va gia tri san pham.

1. Dashboard
2. New Journal Entry
3. Entry Details
4. AI Coach
5. Search Notes
6. Knowledge Quiz
7. Learning Analytics

### Dashboard

Can co:

- Greeting/header.
- New entry CTA.
- Day streak.
- Weekly activity.
- AI insights.
- Recent entries.
- Recommended topics.
- Milestones.
- Weekly goal.

Desktop:

- Grid nhieu cot, sidebar trai.

Mobile:

- Single column, bottom nav.

### New Journal Entry

Can co:

- Title input.
- Content editor.
- Mood/confidence/topic metadata.
- AI suggestions/context panel.
- Save draft/save entry action.

Desktop:

- Editor chinh + right panel.

Mobile:

- Editor tap trung, metadata xep doc.

### Entry Details

Can co:

- Article/journal content.
- Tags and metadata.
- AI summary.
- Key concepts.
- Confidence/progress.
- Related notes.
- CTA tao quiz hoac hoi AI.

Desktop:

- Reading column + right insight panel.

Mobile:

- Reading flow xep doc.

### AI Coach

Can co:

- Chat messages.
- Composer.
- Suggested prompts.
- Related learning context.
- Mock response khi gui tin nhan.

Desktop:

- Chat center + side context panel.

Mobile:

- Chat-first layout.

### Search Notes

Can co:

- Search input.
- Filters.
- Result list.
- Selected result preview.
- AI synthesis panel.

Desktop:

- Master-detail layout.

Mobile:

- Result stack va preview theo flow.

### Knowledge Quiz

Can co:

- Current question.
- Answer options.
- Feedback sau khi chon.
- Next question.
- Session stats.
- Mastery context.

Desktop:

- Question panel + stats sidebar.

Mobile:

- Question-first flow.

### Learning Analytics

Can co:

- Overview metrics.
- Calendar/heatmap style learning activity.
- Mastery chart.
- Topic distribution.
- Weak areas.
- Spaced repetition queue.
- Recent progress.

Desktop:

- Analytics grid.

Mobile:

- Stacked cards.

## Milestone 5: Interaction Pass

Muc tieu: demo co cam giac la app that, khong chi la static UI.

Checklist:

- Sidebar/bottom nav active state.
- Journal save demo toast/state.
- AI Coach mock send message.
- Search filter by query/topic.
- Search result selection.
- Quiz select answer, show feedback, next.
- Analytics filter/time range placeholder neu can.

Output:

- Demo flow lien mach.

## Milestone 6: Responsive And Visual QA

Muc tieu: khong vo layout tren mobile/desktop.

Checklist:

- Check mobile width: 390px.
- Check tablet width: 768px.
- Check desktop width: 1280px.
- Check wide desktop width: 1440px.
- So sanh voi Stitch screenshots trong `design/stitch/screens`.
- Kiem tra text khong tran container.
- Kiem tra nav dung theo breakpoint.
- Kiem tra chart/card khong bi de len nhau.

Output:

- UI san sang demo.

## Milestone 7: Test And Build

Muc tieu: co do tin cay toi thieu truoc khi ban giao.

Checklist:

- `npm run build` pass.
- Unit test cho search filter.
- Unit test cho quiz scoring/state.
- E2E smoke test route:
  - Dashboard load.
  - Navigate to journal new.
  - Navigate to entry details.
  - Navigate to AI coach.
  - Navigate to search.
  - Navigate to quiz.
  - Navigate to analytics.

Output:

- Ban MVP co the demo va tiep tuc phat trien.

## Cut Scope Neu Can Demo Som

Neu can demo trong 1 den 2 ngay, cat cac phan sau:

- Backend/API integration.
- Auth.
- Real AI streaming.
- Persistent database.
- Advanced chart interactions.
- Full accessibility audit.
- Full unit test coverage.

Giu lai:

- Pixel direction theo Stitch.
- Routing.
- Responsive shell.
- 7 screen chinh.
- Mock interactions quan trong.

## Thu Tu Lam Viec Cho Codex

1. Scaffold app.
2. Add design tokens.
3. Build shell navigation responsive.
4. Add mock data and types.
5. Build shared UI components.
6. Build Dashboard first.
7. Build remaining screens in feature folders.
8. Add interactions.
9. Run build and fix issues.
10. Add smoke tests.
11. Final visual QA against Stitch.

## File Tham Chieu Bat Buoc

- `AGENTS.md`
- `design/stitch/screen-manifest.md`
- `docs/design/design-system.md`
- `docs/design/responsive-spec.md`
- `docs/product/routes-and-flows.md`
- `docs/engineering/architecture.md`

## Rủi Ro Va Cach Xu Ly

| Risk | Impact | Cach xu ly nhanh |
|---|---|---|
| Desktop/mobile khac nhau nhieu | UI de vo responsive | Dung AppShell responsive va layout rieng theo breakpoint |
| Qua nhieu screen | Cham MVP | Build reusable primitives truoc, screen nao cung dung lai |
| Chart ton thoi gian | Cham analytics | Dung chart don gian truoc, thay bang Recharts sau |
| AI chua co backend | Demo thieu cam giac that | Dung mock AI response co context |
| Generated HTML kho tai su dung | Code kho maintain | Chi dung HTML de inspect, build lai bang component |

## Ke Hoach 5 Ngay De Di Nhanh

### Ngay 1

- Scaffold app.
- Add routing.
- Add design tokens.
- Build AppShell, sidebar, bottom nav.
- Build core UI primitives.

### Ngay 2

- Add mock data.
- Build Dashboard.
- Build New Journal Entry.
- Build Entry Details.

### Ngay 3

- Build AI Coach.
- Build Search Notes.
- Add mock search and chat interactions.

### Ngay 4

- Build Knowledge Quiz.
- Build Learning Analytics.
- Add quiz state and analytics mock charts.

### Ngay 5

- Responsive QA.
- Visual polish against Stitch.
- Add build/test scripts.
- Add smoke tests.
- Final demo pass.

## Ke Hoach 2 Ngay Neu Can Demo Gap

### Ngay 1

- Scaffold app.
- Build shell.
- Build design tokens and primitives.
- Build Dashboard, New Journal Entry, Entry Details.

### Ngay 2

- Build AI Coach, Search, Quiz, Analytics.
- Add minimal interactions.
- Run build.
- Fix responsive issues lon.

## Final Handoff Criteria

- User co the mo app local va di qua toan bo 7 route.
- UI nhin nhat quan voi Stitch.
- Desktop va mobile deu co layout rieng.
- Repo co docs ro de tiep tuc build backend/AI integration.
