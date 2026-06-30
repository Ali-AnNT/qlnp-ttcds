# Design Guidelines - QLNP-TTCDS

## Design System Overview

Based on shadcn/ui with custom HSL CSS variable theme. Government/education-appropriate design: clean, professional, accessible.

## Color System

All colors defined as HSL CSS custom properties in `src/index.css`. Token system from shadcn/ui.

### Semantic Colors

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | 210 25% 96% | Page background (light gray-blue) |
| `--foreground` | 215 35% 20% | Primary text (dark blue-gray) |
| `--primary` | 217 70% 26% | Brand color, dark navy blue (#1e3a5f) |
| `--primary-foreground` | 0 0% 100% | Text on primary |
| `--accent` | 221 83% 53% | Interactive elements, links, buttons (#2563eb) |
| `--accent-foreground` | 0 0% 100% | Text on accent |
| `--secondary` | 214 14% 92% | Secondary backgrounds |
| `--muted` | 210 20% 94% | Muted backgrounds |
| `--muted-foreground` | 215 15% 47% | Secondary text, labels |
| `--destructive` | 0 72% 51% | Delete actions, errors (#dc2626) |
| `--warning` | 38 92% 50% | Warnings, pending status (#f59e0b) |
| `--success` | 142 72% 29% | Success, approved status (#16a34a) |
| `--info` | 199 89% 48% | Informational, calendar (#0ea5e9) |
| `--border` | 214 20% 89% | Borders and dividers |
| `--input` | 214 20% 89% | Input field borders |
| `--ring` | 221 83% 53% | Focus ring |

### Sidebar Colors (Light Theme)

| Token | Usage |
|-------|-------|
| `--sidebar-background` | Sidebar background (white) |
| `--sidebar-foreground` | Sidebar text (40% gray) |
| `--sidebar-primary` | Active nav item background (accent blue) |
| `--sidebar-accent` | Hover state (95% light gray) |
| `--sidebar-border` | Sidebar right border |

### Status Color Map

Used in Badge components and leave status indicators:

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| pending (ApprovedLevel=0) | bg-warning/10 | text-warning | border-warning/30 |
| pending (partially approved, e.g. ApprovedLevel=1/2) | bg-blue-100 | text-blue-700 | border-blue-300 |
| approved (ApprovedLevel=maxLevel) | bg-success/10 | text-success | border-success/30 |
| rejected | bg-destructive/10 | text-destructive | border-destructive/30 |
| cancelled | bg-muted | text-muted-foreground | default |

Colors are computed by `getApprovalStatusLabel()` and `getApprovalStatusColor()` in `leave-data.ts`.

## Typography

### Font Family
```
font-family: 'Be Vietnam Pro', Inter, sans-serif;
```

- Primary: **Be Vietnam Pro** (Google Font) - Vietnamese-optimized display font
- Fallback: Inter, system sans-serif
- Weights loaded: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold)

### Type Scale (Tailwind Defaults)

| Usage | Class | Size |
|-------|-------|------|
| Page title | `text-xl font-bold` | 1.25rem (20px) |
| Section title | `text-base font-bold` | 1rem (16px) |
| Body text | `text-sm` | 0.875rem (14px) |
| Small text | `text-xs` | 0.75rem (12px) |
| Micro text | `text-[11px]` | 0.688rem (11px) |
| Metric value | `text-2xl font-bold` | 1.5rem (24px) |

## Spacing & Layout

### Page Layout
- Sidebar: 240px expanded / 64px collapsed
- Header: 56px height
- Content padding: `p-4` (16px) mobile / `p-6` (24px) desktop (`md:p-6`)
- Gap between sections: `space-y-6` (24px)

### Card Padding
- Card content: `p-4` or `p-5` depending on density
- Card header: `pb-3` or `pb-4`

### Grid System
- Dashboard metrics: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1400px)

## Component Patterns

### Cards
All content sections wrapped in `<Card>` from shadcn/ui:
```tsx
<Card>
  <CardHeader className="pb-3">
    <CardTitle className="text-base">Section Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

### Buttons
- Primary action: `className="bg-accent hover:bg-accent/90 text-accent-foreground"`
- Secondary: `<Button variant="outline">`
- Disabled: pass `disabled` prop during loading

### Forms
- Labels: `<Label className="text-[13px]">` above inputs
- Inputs: standard `<Input>` with placeholder text
- Submit button: full-width on forms, accent colored
- Loading state: `<Loader2 className="h-4 w-4 mr-2 animate-spin" />`

### Badges
For status display in tables and activity lists:
```tsx
<Badge className={cn("text-[11px]", statusColor[status])} variant="outline">
  {label}
</Badge>
```

### Data Tables
Use shadcn/ui Table component with:
- Sticky or auto-width columns
- Status badges in dedicated column
- Action buttons in last column
- Empty state: centered message when no data

### Charts (Recharts)
- Pie charts: show leave type distribution
- Bar charts: show per-department statistics
- ResponsiveContainer with fixed aspect ratio
- Color palette: accent blue, success green, warning amber, info cyan

### Date Picker
Custom `date-picker.tsx` component in `src/shared/ui/`:
- Wraps react-day-picker with Vietnamese date format (dd/MM/yyyy)
- Calendar popup with day-of-week headers
- Integrates with configurable work days (`parseWorkDays()` from `date-utils.ts`)
- Used in leave request forms for start/end date selection
- Supports manual date input with format validation

### Error Boundaries
- `error-boundary.tsx`: Component-level error boundary for graceful error recovery
- `route-error-boundary.tsx`: Route-level error boundary for page-level crashes
- Both use shadcn/ui Card with error message and retry button

## Dashboard Design (MyStats)

Dashboard uses the MyStats endpoint (GET /api/my-stats/) for KPI cards:
- **Remaining Days**: `RemainingDays` (total balance - used)
- **Pending Count**: `PendingCount` (leave requests awaiting approval)
- **Approved Count**: `ApprovedCount` (leave requests approved this year)
- **Used Days**: `UsedDays` (total days taken)

Cards displayed in a 4-column grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) with LeaveBalanceCard for detailed per-type breakdown.

## Violations Page Design

- Director-only access (GD.PGD role)
- Client-side aggregation of leave request data
- Components:
  - `violations-page.tsx`: Main page with filters (year/quarter/month)
  - `violation-metrics.tsx`: KPI cards (total violations, dept count, emp count)
  - `violation-chart.tsx`: Recharts pie chart of violation distribution
  - `violation-dept-table.tsx`: Department-level violation summary
  - `violation-emp-table.tsx`: Employee-level violation details
  - `dept-detail-dialog.tsx`: Drill-down into department violations
  - `emp-detail-dialog.tsx`: Drill-down into individual employee violations

## Configurable Work Days UI

- Located in ConfigPage -> General Settings tab
- Checkboxes for each day of the week (CN through T7)
- Reads from SystemConfig `work_days` (comma-separated DayOfWeek integers)
- Maps 0=Sunday, 1=Monday, ..., 6=Saturday
- Default: Mon-Fri (`1,2,3,4,5`)
- Changes saved via PUT /api/system-configs

## Vietnamese UI Patterns

### Language
- All interface text in Vietnamese
- Formal/administrative tone (phu hop voi moi truong hanh chinh)
- Unicode fully supported (Be Vietnam Pro font)

### Date Format
- Display: dd/MM/yyyy (Vietnamese standard)
- API: ISO 8601 / yyyy-MM-dd (SQL Server date type)
- Date picker: dd/MM/yyyy format with calendar popup

### Navigation Labels
- Short, action-oriented: "Tao don moi", "Phe duyet don"
- Breadcrumb derived from path (not hardcoded)

### Error Messages
- Vietnamese, user-friendly, appropriate for SSO-based system (no login/password errors)
- Examples: "Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang!", "Không thể kết nối đến máy chủ. Vui lòng thử lại!", "Bạn không có quyền thực hiện thao tác này."

## Accessibility

- shadcn/ui Radix primitives provide WAI-ARIA compliance out of the box
- Focus rings on all interactive elements (`--ring` token)
- Keyboard navigation: Tab through form fields, Enter to submit
- Color contrast: dark text on light backgrounds meets WCAG AA
- Mobile touch targets: minimum 44px via padding on buttons

## Responsive Behavior

| Viewport | Sidebar | Content Layout |
|----------|---------|---------------|
| < 768px (mobile) | Fixed overlay, toggled by hamburger | Full width, single column |
| >= 768px (desktop) | Fixed sidebar, collapsible to 64px | Grid layouts, multi-column cards |

## Iconography

- **lucide-react** v0.462 for all icons
- Standard sizing: `h-4 w-4` (inline), `h-5 w-5` (metrics), `h-6 w-6` (sidebar header)
- Semantic icons: CalendarDays (calendar/leave), CheckSquare (approval), BarChart3 (reports), AlertTriangle (violations), Settings (config)