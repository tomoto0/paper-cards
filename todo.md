# Paper Catcher TODO

## Core Features
- [x] Database schema for keywords and papers
- [x] Keyword management API (CRUD, toggle active)
- [x] arXiv API integration for paper fetching
- [x] LLM translation for abstracts and titles
- [x] Paper storage with duplicate detection

## Frontend Features
- [x] Keyword management UI on main page
- [x] Paper card display with Japanese abstract preview
- [x] Paper detail dialog (Japanese + English)
- [x] Sort functionality (registration, date, journal)
- [x] Link to paper and X (Twitter) share
- [x] Responsive design for PC
- [x] Translation retry functionality

## Automation
- [ ] Scheduled paper fetching (9:00 and 21:00 daily)

## OGP Settings
- [x] Generate OGP image for social media sharing
- [x] Set og:image meta tag in index.html

## SEO Optimization
- [x] Add keywords meta tag
- [x] Add H2 headings to main page
- [x] Optimize title length (30-60 characters)
- [x] Optimize description length (50-160 characters)


## Search & Filtering Features
- [x] Backend: Implement papers.search procedure with keyword, author, date range, category filters
- [x] Frontend: Create SearchBar component with text input
- [x] Frontend: Create FilterPanel component with date range picker and category selector
- [x] Frontend: Integrate search/filter UI into Home page
- [x] Tests: Write tests for search and filtering functionality (19/19 tests passed)
- [x] UI: Ensure responsive design for search/filter UI


## Advanced Sort Features
- [x] Backend: Add relevance score calculation to search results
- [x] Backend: Add citation count field to papers table
- [x] Frontend: Add sort buttons (relevance, date, citations) to SearchFilterBar
- [x] Frontend: Integrate sort functionality with search results
- [x] Tests: Write tests for sort functionality (26/26 tests passed)


## Favorites Feature
- [x] Backend: Create favorites table with userId and paperId foreign keys
- [x] Backend: Implement query functions (addFavorite, removeFavorite, getFavorites)
- [x] Backend: Create tRPC procedures for favorites operations
- [x] Frontend: Add heart button component to paper cards
- [x] Frontend: Create Favorites page with list of bookmarked papers
- [x] Frontend: Integrate favorites into navigation
- [x] Tests: Write tests for favorites functionality (34/34 tests passed)
