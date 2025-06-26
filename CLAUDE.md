# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Aqua Farm Ledger application - a React-based web app for managing aquaculture operations, expenses, and ponds. Built with TypeScript, Vite, and Supabase for backend services.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

### Authentication Flow
- **Authentication-first architecture**: All features require user authentication
- **Profile setup required**: New users must complete profile setup before accessing main app
- **Session management**: Uses Supabase Auth with automatic session recovery and timeout protection
- **AuthProvider context**: Centralized auth state management with loading states and error handling

### Data Layer
- **Supabase backend**: PostgreSQL database with Row Level Security (RLS) policies
- **React Query**: Data fetching, caching, and state management with optimized settings (5min stale time, 1 retry)
- **TypeScript database types**: Complete type safety from database schema to UI components
- **Service layer**: Abstracted data operations in `src/services/supabase.ts`

### Core Data Models
- **profiles**: User information (full_name, farm_name, phone, location)
- **ponds**: Farm pond data (name, size, location, lease_amount, monthly_expense_budget)
- **expenses**: Transaction records with pond and category references
- **expense_categories**: Categorized expense types (recurring vs one-time)

### Database Features
- **Cascade deletion**: Deleting ponds removes all associated expenses automatically
- **RLS policies**: User data isolation using authenticated user policies
- **Foreign key constraints**: Data integrity with proper referential relationships

### UI Architecture
- **Mobile-first responsive design**: Optimized for mobile with desktop fallbacks
- **Tab-based navigation**: Bottom navigation between Dashboard, Ponds, Add Expense, Reports, Transactions
- **Component structure**: Reusable cards (PondCard, ExpenseCard) with edit/delete actions
- **shadcn/ui components**: Pre-built UI components with Tailwind CSS styling

### State Management Patterns
- **React Query for server state**: Automatic caching, invalidation, and background updates
- **React Context for auth**: Global authentication state with loading and error handling
- **Local state for UI**: Component-level state for forms, modals, and interactions
- **Memoized calculations**: Performance optimization for dashboard metrics and filtering

### Key Performance Optimizations
- **Timeout protection**: 5-second timeouts on profile/data fetches to prevent hanging
- **Request deduplication**: Prevents multiple simultaneous API calls
- **Memoized expensive operations**: Dashboard calculations cached with useMemo
- **Optimistic updates**: React Query mutations with immediate UI feedback

## Environment Setup

Required environment variables:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous/public API key

## Database Schema & Setup

Initial database setup requires running SQL files in order:
1. `database.sql` - Core schema with tables and RLS policies
2. `seed-categories.sql` - Default expense categories
3. `add-cascade-deletion.sql` - Foreign key cascade constraints (if needed)

## Key Implementation Notes

### Authentication Edge Cases
- **Profile fetch timeout**: 5-second timeout prevents infinite loading states
- **Multiple auth state changes**: Debouncing prevents race conditions during auth transitions
- **Profile completion check**: `needsProfile` logic ensures required fields are completed

### Data Synchronization
- **Cascade deletion UI**: Delete confirmation dialogs warn about related data removal
- **Real-time updates**: React Query invalidation keeps UI synchronized after mutations
- **Error handling**: Graceful fallbacks for network issues and database errors

### Mobile Experience
- **Touch-optimized**: Proper button sizes and touch targets for mobile devices
- **Loading states**: Skeleton screens and spinners for better perceived performance
- **Offline consideration**: React Query caching provides some offline resilience

## Common Development Workflows

When adding new features:
1. Add database types to `src/lib/supabase.ts` Database interface
2. Create service functions in `src/services/supabase.ts`
3. Add React Query hooks in `src/hooks/`
4. Implement UI components with proper loading/error states
5. Update RLS policies in Supabase if needed

When debugging authentication issues:
- Check browser console for auth state changes
- Verify RLS policies allow authenticated user access
- Ensure profile data exists and is complete

When optimizing performance:
- Use React Query devtools to check cache behavior
- Memoize expensive calculations with useMemo
- Monitor network requests for unnecessary API calls

## Memories

- Memorized everything we did in this MD file during the project development