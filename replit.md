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
- June 28, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.