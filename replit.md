# Mynx Inventory

## Overview

This is a full-stack inventory management system built with a modern React frontend and Express.js backend. The application provides comprehensive warehouse management capabilities including warehouses, pallets, bins, and SKU tracking. It uses PostgreSQL for data persistence with Drizzle ORM for database operations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Neon serverless database
- **ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with JSON responses
- **Middleware**: Express middleware for logging and error handling

## Key Components

### Database Schema
The system uses a hierarchical structure:
- **Warehouses**: Top-level entities containing pallets
- **Pallets**: Storage units within warehouses, containing bins
- **Bins**: Individual storage containers holding SKUs
- **SKUs**: Product information with pricing and descriptions
- **BinSkus**: Junction table managing quantity relationships between bins and SKUs

### Frontend Components
- **Layout**: Sidebar navigation with header breadcrumbs
- **Pages**: Dashboard, Warehouses, Pallets, Bins, and SKUs management
- **Modals**: CRUD operations for each entity type
- **UI Components**: Reusable components following shadcn/ui patterns

### API Endpoints
- `/api/stats` - System statistics
- `/api/warehouses` - Warehouse CRUD operations
- `/api/pallets` - Pallet management
- `/api/bins` - Bin operations
- `/api/skus` - SKU management
- `/api/bin-skus` - Inventory quantity tracking

## Data Flow

1. **Client Requests**: React components make API calls using TanStack Query
2. **API Processing**: Express routes handle requests and validate data
3. **Database Operations**: Drizzle ORM executes type-safe database queries
4. **Response Handling**: JSON responses returned to client
5. **State Updates**: TanStack Query manages cache invalidation and updates
6. **UI Updates**: React components re-render with fresh data

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection**: WebSocket-based connection pooling

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first CSS framework
- **Class Variance Authority**: Component variant management

### Development Tools
- **Vite**: Build tool with HMR and development server
- **TypeScript**: Type safety across the stack
- **ESBuild**: Fast bundling for production builds

## Deployment Strategy

### Development
- Vite development server for frontend
- Express server with hot reload using tsx
- Database migrations using Drizzle Kit

### Production
- Frontend: Vite builds static assets to `dist/public`
- Backend: ESBuild bundles server code to `dist/index.js`
- Database: PostgreSQL connection via environment variables
- Single-server deployment serving both API and static files

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode (development/production)
- Database provisioning required before deployment

### Build Process
1. `npm run build`: Builds both frontend and backend
2. Frontend assets compiled to `dist/public`
3. Server code bundled to `dist/index.js`
4. `npm start`: Runs production server

## Changelog
- June 30, 2025: Removed "Inventory Tracker" title from all pages and simplified breadcrumbs to show only current section
- June 30, 2025: Removed SKUs management section from edit bin dialogue for cleaner, focused interface
- June 30, 2025: Implemented bin filtering system - bin names now link to filtered SKUs, completing the full hierarchical navigation
- June 30, 2025: Fixed dashboard responsive layout for midsize screen resolutions with proper grid system
- June 30, 2025: Fixed pallet filtering system - pallet names now correctly filter bins, navigation buttons work properly with URL parameter handling
- June 30, 2025: Fixed mobile responsiveness for bin SKU management with card-based layout replacing table view on small screens
- June 30, 2025: Extended image upload functionality to bins, replacing URL input with drag-and-drop interface for both SKUs and bins
- June 30, 2025: Implemented image upload functionality replacing URL input with drag-and-drop file upload interface
- June 30, 2025: Simplified SKU table to show only names (removed internal ID column) and fixed mobile hamburger menu positioning
- June 30, 2025: Updated SKU pricing to use Indian rupees (₹) instead of dollars across forms and displays
- June 30, 2025: Optimized pallets table for mobile with responsive columns and removed Status field for cleaner layout
- June 30, 2025: Extended name field functionality to bins with editable names, search integration, and proper display in listings
- June 30, 2025: Enhanced pallets and bins with user-friendly name fields that default to auto-generated numbers but can be customized
- June 30, 2025: Implemented comprehensive mobile responsiveness with overlay sidebar, responsive grids, and touch-friendly interfaces
- June 30, 2025: Made sidebar collapsible with smooth animations and icon-only collapsed state
- June 29, 2025: Removed all quick add buttons from dashboard and header for cleaner interface
- June 29, 2025: Fixed SelectItem error by replacing empty string values with "none" in dropdown components
- June 29, 2025: Removed "Management" from all section titles for cleaner UI
- June 29, 2025: Removed duplicate titles from all section pages for cleaner layout
- June 29, 2025: Made dashboard panels clickable with navigation to appropriate sections
- June 29, 2025: Updated application branding from "Inventory Tracker Pro" to "Mynx Inventory"
- June 29, 2025: Simplified dashboard title from "Inventory Dashboard" to "Dashboard"
- June 28, 2025: Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.