# New Layout System - Design Document ✅ IMPLEMENTED

## Overview
Complete rewrite of the main layout using shadcn sidebar blocks, implementing a dual-sidebar design with modern UX patterns.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                   Main Header                               │
│ ┌─────────────┬─────────────────────────────────────────┐   │
│ │   Search    │            Right Sidebar Toggle         │   │
│ │    Bar      │                                         │   │
│ └─────────────┴─────────────────────────────────────────┘   │
├─────────────┬─────────────────────────────────┬─────────────┤
│   Left      │          Files Explorer         │    Right    │
│  Sidebar    │                                 │   Sidebar   │
│ (Icons on   │        (Only on /files)         │   (Chat)    │
│  /files)    │                                 │             │
│             ├─────────────────────────────────┤             │
│ • Dashboard │                                 │             │
│ • Kanban    │        Main Content             │             │
│ • Posts     │                                 │             │
│ • Files     │                                 │             │
│ • Media     │                                 │             │
│ • etc...    │                                 │             │
│             │                                 │             │
│ [Admin]     │                                 │             │
│             │                                 │             │
│ [Notifs]    │                                 │             │
│ [Profile]   │                                 │             │
└─────────────┴─────────────────────────────────┴─────────────┘
```

## ✅ Implemented Components

### Main Components
1. **AppLayout** - Main layout wrapper with conditional dual-sidebar
   - Detects `/files` pathname to show files tree
   - Handles sidebar collapse behavior
   
2. **LeftSidebar** - Primary navigation 
   - Collapses to icons when files tree is shown
   - Contains org select, navigation, admin section, notifications, profile
   
3. **FilesTreeSidebar** - Secondary sidebar for file navigation 
   - Shows only on `/files` pages
   - Tree view with collapsible folders
   - Search functionality
   - Recent files section
   
4. **RightSidebar** - Chat placeholder 
   - Always visible
   - Beautiful CTA for future chat integration
   
5. **MainHeader** - Header with search and right sidebar toggle
   - Global search bar
   - Right sidebar toggle button

### Navigation Components
1. **NavMain** - Primary navigation items (Dashboard, Kanban, Posts, etc.)
2. **NavFiles** - Files navigation (simple, no submenus)
3. **NavAdmin** - Administration navigation (simple, no submenus)
4. **NavUser** - User section with notifications badge and profile dropdown

### Page Templates
1. **StandardPage** - Basic page with title, description, breadcrumbs, actions
2. **DashboardPage** - Dashboard with stats cards
3. **ListPage** - List/table pages with filters

## ✅ Implementation Details

### Dual Sidebar System
- ✅ Uses shadcn's nested sidebar pattern from examples
- ✅ Main sidebar collapses to icon-only when on /files pages
- ✅ Files tree sidebar appears as secondary sidebar
- ✅ Grid/List view toggle will be on the actual files page, not in sidebar

### Navigation Structure
- ✅ Organization select at top of left sidebar
- ✅ Main navigation items (Dashboard, Kanban, etc.)
- ✅ Files & Media section
- ✅ Admin section (only for admins)
- ✅ Notifications button with badge
- ✅ Profile dropdown at bottom

### State Management
- ✅ Uses pathname detection to show/hide files tree sidebar
- ✅ Responsive behavior handled by shadcn sidebar components
- ✅ Mock notification count (ready for API integration)

### Design Principles
- ✅ Clean separation of concerns
- ✅ Modular architecture
- ✅ Consistent with shadcn design patterns
- ✅ Future-ready for chat integration

### Files Tree Features
- ✅ Hierarchical folder structure with indentation
- ✅ Collapsible folders with open/closed icons
- ✅ Search input for filtering files
- ✅ Recent files section with timestamps
- ✅ Action buttons for new folder/upload

### Chat Integration Ready
- ✅ Beautiful placeholder with gradient background
- ✅ Professional CTA with "Coming Soon" badge
- ✅ Easy to replace with actual chat functionality

## 🎯 Usage Examples

### Using Page Templates
```tsx
// Dashboard page
<DashboardPage 
  title="Analytics Dashboard"
  stats={[
    { label: "Total Posts", value: "1,234", change: "+12%", trend: "up" },
    // ...
  ]}
>
  <YourDashboardContent />
</DashboardPage>

// List page
<ListPage
  title="Posts"
  breadcrumbs={[
    { href: "/", label: "Dashboard" },
    { label: "Posts" }
  ]}
  actions={<CreatePostButton />}
  filters={<PostFilters />}
>
  <PostsTable />
</ListPage>
```

### Layout Behavior
- **Normal pages**: Single left sidebar with full navigation
- **Files pages**: Dual sidebar - main nav collapses to icons, files tree appears
- **All pages**: Right sidebar with chat placeholder always visible

## 🔄 Next Steps

1. ✅ Create base layout components
2. ✅ Implement dual-sidebar system  
3. ✅ Add navigation components
4. ✅ Create page templates
5. ⏳ Test with existing pages and refine
6. ⏳ Integrate global search functionality
7. ⏳ Add real notification API integration
8. ⏳ Replace chat placeholder with actual chat system
9. ⏳ Add breadcrumb system integration
10. ⏳ Implement file tree API integration

## 🚀 Ready to Use!

The new layout system is fully implemented and ready to use. The old `Sidebar` component can be gradually replaced as pages are migrated to use the new page templates.

### File Structure
```
apps/app/src/app/(main)/
├── layout.tsx (updated)
├── _components/
│   ├── app-layout.tsx ✅
│   ├── left-sidebar.tsx ✅
│   ├── right-sidebar.tsx ✅
│   ├── main-header.tsx ✅
│   ├── files-tree-sidebar.tsx ✅
│   ├── page-templates.tsx ✅
│   └── navigation/
│       ├── nav-main.tsx ✅
│       ├── nav-files.tsx ✅
│       ├── nav-admin.tsx ✅
│       └── nav-user.tsx ✅
```

All components are implemented and ready for integration! 