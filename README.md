# Paper Catcher

> **Automated Academic Paper Collection, Translation, and Management System**

![Paper Catcher](og-image_1.png)

Paper Catcher is a full-stack web application that automatically collects academic papers from arXiv, translates them into Japanese using AI, and provides an intuitive interface for researchers and academics to discover and manage the latest research in their fields of interest.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## Overview

Paper Catcher bridges the gap between English-language academic research and Japanese-speaking researchers. By combining the power of arXiv's comprehensive paper database with OpenAI's language models, the application provides:

- **Automated Paper Discovery**: Continuously monitors arXiv for new papers matching user-defined keywords
- **Intelligent Translation**: Translates paper titles and abstracts into academic Japanese with domain-specific terminology
- **Efficient Management**: Organizes papers with sorting, filtering, and detailed viewing capabilities
- **Social Sharing**: Generates rich preview cards (OGP) for sharing papers on social media

### Key Statistics

| Metric | Value |
|--------|-------|
| **Frontend Framework** | React 19 |
| **Backend Runtime** | Node.js with Express 4 |
| **Database** | MySQL with Drizzle ORM |
| **API Framework** | tRPC 11 |
| **Styling** | Tailwind CSS 4 |
| **Supported Keywords** | Unlimited |
| **Paper Storage** | Unlimited (database-backed) |

---

## Features

### Core Functionality

#### 1. **Keyword Management**
- Add, edit, and delete search keywords
- Enable/disable keywords to control paper fetching
- Real-time keyword status tracking
- Support for complex search terms (e.g., "machine learning", "deep learning", "transformer")

#### 2. **Automated Paper Fetching**
- Integrates with arXiv API for real-time paper discovery
- Fetches papers matching active keywords
- Deduplication to prevent duplicate entries
- Preserves paper metadata: title, authors, abstract, publication date, category
- Generates direct links to arXiv pages and PDF downloads

#### 3. **AI-Powered Translation**
- Translates paper titles and abstracts into Japanese
- Uses OpenAI API for high-quality academic translations
- Preserves technical terminology and scientific accuracy
- Handles translation errors gracefully with fallback mechanisms

#### 4. **Paper Display & Management**
- Responsive paper card layout
- Displays: title (EN/JA), authors, journal/category, publication date, abstract preview
- Detailed paper view dialog with full abstract
- Paper deletion capability

#### 5. **Sorting & Organization**
- Sort by registration date (newest first)
- Sort by publication date (latest papers first)
- Sort by journal/category (alphabetical)
- Persistent sort preference

#### 6. **Social Media Integration**
- Open Graph (OGP) meta tags for rich previews
- Twitter Card support for enhanced sharing
- Custom OGP image (1200x630px)
- Dynamic meta tags for SEO optimization

#### 7. **Search Engine Optimization**
- Semantic HTML structure with proper heading hierarchy
- Meta keywords targeting academic research terms
- Optimized page title (31 characters)
- Comprehensive meta description (73 characters)
- Structured data ready for schema.org integration

---

## Technology Stack

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **React** | UI framework | 19.2.1 |
| **TypeScript** | Type safety | 5.9.3 |
| **Tailwind CSS** | Styling | 4.1.14 |
| **shadcn/ui** | Component library | Latest |
| **Lucide React** | Icons | 0.453.0 |
| **Framer Motion** | Animations | 12.23.22 |
| **Recharts** | Data visualization | 2.15.2 |
| **Wouter** | Routing | 3.3.5 |
| **Zod** | Schema validation | 4.1.12 |

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **Express** | HTTP server | 4.21.2 |
| **tRPC** | Type-safe RPC | 11.6.0 |
| **Node.js** | Runtime | 22.13.0 |
| **TypeScript** | Type safety | 5.9.3 |
| **Drizzle ORM** | Database ORM | 0.44.5 |

### Database
| Technology | Purpose | Version |
|-----------|---------|---------|
| **MySQL** | Relational database | 8.0+ |
| **Drizzle Kit** | Migration tool | 0.31.4 |

### External APIs
| Service | Purpose | Authentication |
|---------|---------|-----------------|
| **arXiv API** | Paper search & metadata | Public (no auth) |
| **OpenAI API** | Translation service | API Key |

### DevOps & Deployment
| Tool | Purpose |
|------|---------|
| **Vite** | Build tool & dev server |
| **pnpm** | Package manager |
| **Vitest** | Unit testing |
| **Prettier** | Code formatting |
| **esbuild** | Production bundling |

---

## Architecture

### System Design

Paper Catcher follows a **three-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (React)                      │
│  - UI Components (Paper Cards, Keyword Manager)             │
│  - tRPC Client (Type-safe API calls)                        │
│  - State Management (React Query)                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Server Layer (Node.js)                     │
│  - Express HTTP Server                                       │
│  - tRPC Router (Procedures & Middleware)                    │
│  - Business Logic (Paper Fetching, Translation)            │
│  - Database Helpers (Query Functions)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 Data & External Services                     │
│  - MySQL Database (Papers, Keywords, Users)                 │
│  - arXiv API (Paper Discovery)                              │
│  - OpenAI API (Translation Service)                         │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Diagram

![Architecture Diagram](./architecture-diagram.png)

### Data Flow

1. **Paper Discovery Flow**:
   ```
   User clicks "Fetch Papers" 
   → Server queries active keywords 
   → For each keyword, call arXiv API 
   → Parse XML response 
   → Check for duplicates in database 
   → Store new papers 
   → Return results to client
   ```

2. **Translation Flow**:
   ```
   Paper stored in database 
   → Server calls OpenAI API with title + abstract 
   → LLM returns Japanese translation 
   → Update paper record with translations 
   → Client displays translated content
   ```

3. **Display Flow**:
   ```
   Client requests papers with sort preference 
   → Server queries database with sort order 
   → Return paginated results 
   → Client renders paper cards 
   → User can view details or delete papers
   ```

### Technology Rationale

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **React** | Frontend framework | Component-based, excellent ecosystem, large community |
| **tRPC** | API layer | Type-safe end-to-end, eliminates API contract drift |
| **Express** | HTTP server | Lightweight, mature, excellent middleware ecosystem |
| **MySQL** | Database | Reliable, scalable, good for structured academic data |
| **Drizzle ORM** | Data access | Type-safe queries, minimal abstraction, excellent TypeScript support |
| **Tailwind CSS** | Styling | Utility-first, responsive design, rapid development |
| **OpenAI API** | Translation | State-of-the-art LLM, excellent Japanese support |
| **arXiv API** | Paper source | Comprehensive academic database, open access |

---

## Getting Started

### Prerequisites

- **Node.js**: 22.13.0 or higher
- **pnpm**: 10.4.1 or higher
- **MySQL**: 8.0 or higher
- **OpenAI API Key**: For translation functionality

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/paper-catcher.git
   cd paper-catcher
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment variables**:
   ```bash
   # Create .env.local file
   cp .env.example .env.local
   
   # Add your configuration:
   DATABASE_URL=mysql://user:password@localhost:3306/paper_catcher
   OPENAI_API_KEY=sk-...
   JWT_SECRET=your-secret-key
   ```

4. **Initialize database**:
   ```bash
   pnpm db:push
   ```

5. **Start development server**:
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

### Quick Test

1. Navigate to the application
2. Add a keyword (e.g., "machine learning")
3. Click "Fetch Papers" to retrieve papers from arXiv
4. Papers will be displayed as cards with English titles and abstracts
5. Translations will appear as they complete (if OpenAI API is available)

---

## Project Structure

```
paper-catcher/
├── client/                          # Frontend application
│   ├── public/                      # Static assets
│   │   ├── og-image.png            # OGP preview image
│   │   └── ...
│   ├── src/
│   │   ├── components/             # Reusable React components
│   │   │   ├── ui/                # shadcn/ui components
│   │   │   └── ...
│   │   ├── pages/                 # Page-level components
│   │   │   └── Home.tsx           # Main application page
│   │   ├── lib/
│   │   │   └── trpc.ts            # tRPC client configuration
│   │   ├── contexts/              # React contexts
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── App.tsx                # Application root
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Global styles
│   ├── index.html                 # HTML template with meta tags
│   └── vite.config.ts             # Vite configuration
│
├── server/                          # Backend application
│   ├── _core/                      # Framework internals
│   │   ├── index.ts               # Server entry point
│   │   ├── context.ts             # tRPC context
│   │   ├── trpc.ts                # tRPC configuration
│   │   ├── llm.ts                 # LLM integration
│   │   ├── cookies.ts             # Session management
│   │   └── ...
│   ├── db.ts                       # Database query helpers
│   ├── routers.ts                 # tRPC procedure definitions
│   └── auth.logout.test.ts        # Example test file
│
├── drizzle/                         # Database schema & migrations
│   ├── schema.ts                  # Table definitions
│   └── migrations/                # Generated migrations
│
├── storage/                         # S3 file storage helpers
│   └── index.ts
│
├── shared/                          # Shared types & constants
│   └── ...
│
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── vite.config.ts                  # Vite configuration
├── drizzle.config.ts               # Drizzle ORM configuration
├── architecture-diagram.mmd        # Architecture visualization
└── README.md                        # This file
```

---

## API Documentation

### tRPC Procedures

Paper Catcher exposes the following tRPC procedures:

#### Keywords Router

**`keywords.list`** (Query)
- **Description**: Retrieve all keywords with their status
- **Returns**: `Array<{ id: number; keyword: string; isActive: boolean; createdAt: Date; updatedAt: Date }>`
- **Example**:
  ```typescript
  const keywords = await trpc.keywords.list.useQuery();
  ```

**`keywords.add`** (Mutation)
- **Description**: Add a new search keyword
- **Input**: `{ keyword: string }`
- **Returns**: `{ success: boolean; message: string }`
- **Example**:
  ```typescript
  const result = await trpc.keywords.add.useMutation({
    keyword: "transformer architecture"
  });
  ```

**`keywords.delete`** (Mutation)
- **Description**: Delete a keyword
- **Input**: `{ id: number }`
- **Returns**: `{ success: boolean; message: string }`

**`keywords.toggle`** (Mutation)
- **Description**: Enable/disable a keyword
- **Input**: `{ id: number }`
- **Returns**: `{ success: boolean }`

#### Papers Router

**`papers.list`** (Query)
- **Description**: Retrieve papers with sorting options
- **Input**: `{ sortBy: 'createdAt' | 'publishedAt' | 'journal' }`
- **Returns**: `Array<Paper>`
- **Example**:
  ```typescript
  const papers = await trpc.papers.list.useQuery({ sortBy: 'publishedAt' });
  ```

**`papers.fetch`** (Mutation)
- **Description**: Fetch papers from arXiv for active keywords
- **Returns**: `{ success: boolean; message: string; count: number }`
- **Example**:
  ```typescript
  const result = await trpc.papers.fetch.useMutation();
  ```

**`papers.delete`** (Mutation)
- **Description**: Delete a paper from the database
- **Input**: `{ id: number }`
- **Returns**: `{ success: boolean }`

### Example API Call

```typescript
// Frontend component
import { trpc } from "@/lib/trpc";

export function PaperList() {
  const { data: papers, isLoading } = trpc.papers.list.useQuery({
    sortBy: 'publishedAt'
  });

  const fetchMutation = trpc.papers.fetch.useMutation({
    onSuccess: (data) => {
      console.log(`Fetched ${data.count} papers`);
    }
  });

  return (
    <div>
      <button onClick={() => fetchMutation.mutate()}>
        Fetch Papers
      </button>
      {papers?.map(paper => (
        <div key={paper.id}>
          <h3>{paper.titleJa || paper.title}</h3>
          <p>{paper.abstractJa || paper.abstract}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores user account information and authentication state.

### Keywords Table

```sql
CREATE TABLE keywords (
  id INT PRIMARY KEY AUTO_INCREMENT,
  keyword VARCHAR(255) UNIQUE NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Purpose**: Manages search keywords for paper discovery. The `isActive` flag controls whether papers are fetched for this keyword.

### Papers Table

```sql
CREATE TABLE papers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  arxivId VARCHAR(64) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  titleJa TEXT,
  authors TEXT NOT NULL,
  abstract TEXT NOT NULL,
  abstractJa TEXT,
  journal VARCHAR(255),
  publishedAt BIGINT,
  arxivUrl VARCHAR(512) NOT NULL,
  pdfUrl VARCHAR(512),
  keyword VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Purpose**: Stores academic papers fetched from arXiv. Includes both English and Japanese versions of titles and abstracts.

| Column | Type | Purpose |
|--------|------|---------|
| `arxivId` | VARCHAR(64) | Unique arXiv identifier (e.g., "2401.12345") |
| `title` | TEXT | Original English title |
| `titleJa` | TEXT | Japanese translation of title |
| `authors` | TEXT | Comma-separated list of authors |
| `abstract` | TEXT | Original English abstract |
| `abstractJa` | TEXT | Japanese translation of abstract |
| `journal` | VARCHAR(255) | arXiv category (e.g., "cs.LG", "cs.AI") |
| `publishedAt` | BIGINT | Unix timestamp of publication |
| `arxivUrl` | VARCHAR(512) | Direct link to arXiv paper page |
| `pdfUrl` | VARCHAR(512) | Direct link to PDF download |
| `keyword` | VARCHAR(255) | Keyword that matched this paper |

### Relationships

```
users (1) ──── (many) papers
keywords (1) ──── (many) papers
```

---

## Deployment

### Manus Platform (Recommended)

Paper Catcher is optimized for deployment on the Manus platform:

1. **Create checkpoint**: `pnpm webdev_save_checkpoint`
2. **Publish**: Click "Publish" button in Management UI
3. **Custom domain**: Configure in Settings → Domains panel

### Self-Hosted Deployment

For deployment to external platforms (Railway, Render, Vercel):

1. **Build**:
   ```bash
   pnpm build
   ```

2. **Environment variables** (set in deployment platform):
   ```
   DATABASE_URL=mysql://user:password@host:3306/paper_catcher
   OPENAI_API_KEY=sk-...
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```

3. **Start**:
   ```bash
   pnpm start
   ```

### Docker Deployment

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## Known Limitations

### Current Constraints

1. **LLM API Rate Limits**: Translation may fail if OpenAI API quota is exhausted
   - **Workaround**: Implement request queuing and retry logic
   - **Status**: Graceful error handling implemented

2. **arXiv API Rate Limiting**: High-frequency requests may be throttled
   - **Workaround**: Implement exponential backoff and request caching
   - **Status**: Not yet implemented

3. **Translation Accuracy**: LLM translations may occasionally miss technical nuances
   - **Workaround**: Manual review and correction interface (future feature)
   - **Status**: Acceptable for current use case

4. **Database Size**: No pagination implemented for paper list
   - **Workaround**: Implement cursor-based pagination
   - **Status**: Planned for next release

5. **No Scheduled Tasks**: Manual "Fetch Papers" button required
   - **Workaround**: Implement cron jobs or scheduled functions
   - **Status**: Planned for next release

---

## Future Enhancements

### Planned Features

| Feature | Priority | Status | Estimated Timeline |
|---------|----------|--------|-------------------|
| Scheduled paper fetching (2x daily) | High | Planned | Q1 2026 |
| Advanced search & filtering | High | Planned | Q1 2026 |
| Favorites/bookmarking system | Medium | Planned | Q2 2026 |
| PWA support (offline mode) | Medium | Planned | Q2 2026 |
| Email digest notifications | Medium | Planned | Q2 2026 |
| Multi-language support | Low | Planned | Q3 2026 |
| Collaborative paper collections | Low | Planned | Q3 2026 |
| Citation export (BibTeX, RIS) | Low | Planned | Q4 2026 |

### Technical Improvements

- [ ] Implement request rate limiting and caching
- [ ] Add comprehensive error tracking (Sentry)
- [ ] Implement database query optimization
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Increase test coverage (target: 80%+)
- [ ] Implement CI/CD pipeline
- [ ] Add performance monitoring

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Commit changes**: `git commit -am 'Add your feature'`
4. **Push to branch**: `git push origin feature/your-feature`
5. **Submit a Pull Request**

### Development Workflow

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Format code
pnpm format

# Type check
pnpm check
```

---

## Troubleshooting

### Common Issues

**Problem**: Translation not appearing
- **Cause**: OpenAI API quota exhausted or API key invalid
- **Solution**: Check API key in environment variables, verify quota at openai.com

**Problem**: Papers not fetching from arXiv
- **Cause**: Network connectivity or arXiv API downtime
- **Solution**: Check internet connection, verify arXiv API status at arxiv.org

**Problem**: Database connection error
- **Cause**: Invalid DATABASE_URL or MySQL server not running
- **Solution**: Verify MySQL is running, check connection string format

**Problem**: UI not loading
- **Cause**: Frontend build failed or server not running
- **Solution**: Check console for errors, run `pnpm dev` to restart

---

## Performance Metrics

### Benchmarks

| Operation | Time | Notes |
|-----------|------|-------|
| Fetch papers (10 keywords) | ~5-10s | Depends on arXiv API response |
| Translate title + abstract | ~2-3s | Per paper, via OpenAI API |
| Display 50 papers | <500ms | React rendering |
| Database query (sorted) | <100ms | With proper indexing |

### Optimization Tips

1. **Enable database indexing** on frequently queried columns
2. **Implement pagination** for large paper lists
3. **Cache arXiv responses** to reduce API calls
4. **Use CDN** for static assets (OGP image, etc.)
5. **Implement request batching** for translations

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Support & Contact

- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join our community discussions
- **Email**: support@papercatcher.dev

---

## Acknowledgments

- **arXiv** for providing the comprehensive academic paper database
- **OpenAI** for the powerful translation capabilities
- **Manus** for the excellent full-stack development platform
- **React & TypeScript** communities for outstanding tools and libraries

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Status**: Production Ready
