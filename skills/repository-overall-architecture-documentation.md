---
name: repository-overall-architecture-documentation
description: >-
  Systematically document a repository's overall architecture - services, data models,
  communication patterns, cross-repo dependencies, and Mermaid diagrams - into
  docs/overall-architecture.md and supporting files. Use when the user asks to document
  a repo, create overall-architecture.md, map service interactions, write a repo
  architecture guide, or analyze a multi-service codebase ("document this repo",
  "architecture overview for [internal team]"). Works for any language/framework. Not
  for explaining a user-supplied diagram (magic-diagram) or EDD-to-plan execution work
  (edd-mermaid-to-plan); this surveys the repo on disk.
---

# Repository Documentation

Survey the repository and produce comprehensive architecture documentation: services,
data models, communication patterns, and cross-repo resources.

## Step 1: Initial Repository Survey

### 1.1 Understand the Repository Structure

Scan the top-level directory structure and identify:

- Primary code directories (services, libs, pipelines, protos, etc.)
- Project/package files (`.csproj`, `package.json`, `go.mod`, `pyproject.toml`, etc.)
- File type distribution (count by extension)

### 1.2 Create Service/Module Inventory

Build an inventory table - this becomes the spine of `overall-architecture.md`:

| Module/Service | Type | Primary Responsibility |
|----------------|------|------------------------|
| `{name}` | {API/Service/Library/Processor/etc.} | {Brief description} |

## Step 2: Module Analysis

For each module/service, document:

- **Purpose** -- Primary business function and key responsibilities
- **Architecture** -- Entry points (Controllers, handlers, main functions), core logic location, external dependencies
- **Key Components** -- Main classes/interfaces/functions, configuration handlers, data access layer
- **Communication** -- Inbound (how other modules call this one), outbound (what this depends on), message queues/events

### Technology-Specific Discovery

#### .NET Projects
- Find controllers: `*Controller*.cs`
- Find gRPC implementations: look for `GrpcService`, `ServiceBase`
- Find message handlers: `IMessageHandler`, `IConsumer`, `IEventHandler`
- Find project references: `ProjectReference` in `.csproj`

#### Node.js / TypeScript
- Find route definitions: `router.`, `app.get/post/put/delete`
- Check `package.json` dependencies

#### Python
- Find Flask/FastAPI routes: `@app.`, `@router.`
- Check `requirements.txt` or `pyproject.toml`

#### Go
- Find HTTP handlers: `http.Handle`, `func.*http.ResponseWriter`
- Find main packages: `main.go`
- Check `go.mod`

## Step 3: Data Model Discovery

### 3.1 Identify Data Models

Look in these locations (in priority order):

1. **Entity/Model Classes**: `models/`, `entities/`, `domain/`, `types/` folders
2. **DTOs/Contracts**: `dtos/`, `contracts/`, `api/`
3. **Database Schemas**: ORM configs, migrations, schema files
4. **API Definitions**: Proto files, OpenAPI specs, GraphQL schemas

### 3.2 Document Entity Relationships

Create a Mermaid `erDiagram` with **field listings inside each entity** (name, type, constraints like PK/FK/UK) and relationship lines. Field-level detail helps readers trace data flow without opening every model file.

After the diagram, add a note explaining how data flows between entities.

## Step 4: System Flow & Architecture Diagrams

### 4.1 Diagram Types to Create

1. **Architecture Diagram** -- High-level service interaction diagram (always required)
2. **Business Flow Diagrams** -- Dedicated Mermaid flowcharts for key business flows when the system has notable multi-step flows, branching logic, or cache/fallback patterns (add when applicable, not required for every repo)
3. **Data Flow Diagram** -- How data moves between components (if applicable)
4. **Event Flow Diagram** -- Async event/message flows (if applicable)

### 4.2 Dependency Analysis

Identify:
- HTTP/gRPC client usage between services
- Database connections and storage backends
- Message queue / event bus topics
- Cache configurations

### 4.3 Mermaid Templates

Use `flowchart TD` or `flowchart LR` for service interaction diagrams. Use `sequenceDiagram` for request flows.

## Step 5: Cross-Repository Resources

Check and document related resources in sibling repos:

| Resource | Location Pattern |
|----------|-----------------|
| **API / gRPC Contracts** | `service-contracts/protos/[company]/[repo-name]/[service-name]/[version]/` |
| **Entity Schemas / Storage** | `storage-resources/resource-definitions/[entity service]/[service-name]/schema-files/[environment]/` |
| **Deployment Configuration** | `deployment/[scheduler]/[repo-name]/[service-name]/[environment]/` |

If these repos are in the workspace, search locally. Otherwise use [code search] - cross-repo contract paths are easy to miss from a single clone.

## Step 6: Monitoring & Observability

Document:
- Alert definitions (location and key alerts)
- Key metrics (counters, gauges, histograms)
- Dashboard links ([metrics dashboard], [incident system])
- Telemetry configuration

## Step 7: Generate Documentation

### 7.1 Output Structure

Create documentation in this structure:

```
docs/
├── overall-architecture.md          # Main architecture document
├── architecture/
│   ├── system-overview.md
│   ├── service-interactions.md
│   └── data-flow.md
├── services/
│   ├── {service-a}.md
│   └── {service-b}.md
└── data-models/
    ├── entity-relationships.md
    └── api-definitions.md
```

### 7.2 Documentation Rules

- **Always** create `docs/overall-architecture.md` at the repository root
- **Always** add a link to the documentation in the repository's `README.md` under a `## Documentation` section
- **Always** include a service inventory table; link each service to its own documentation if it exists
- **Always** include at least one Mermaid architecture diagram
- **Always** create ER diagrams with field listings inside entities and relationship lines
- **Always** add dedicated business flow diagrams when the system has notable multi-step flows
- **Always** check and document cross-repository references
- **Always** include links to runbooks, dashboards, and wikis
- **Always** include a Links section for design docs and related documentation not already present elsewhere in the document (avoid duplicating links)
- **Always** add a Purpose paragraph when documenting groups of API endpoints or service capabilities
- **Never** include procedural language ("Rule 1:", "Step 1:") in the final documentation -- it should read as reference material
- **Do not** include Development commands (build/run/test) -- those belong in the repository's README
- **Do not** include Configuration/Environment Variables sections -- those belong in operational docs or README

### 7.3 Example Output

For a well-structured example of repository-level documentation produced by this skill, see the **price-engine** repository:

- Repository-level: `price-engine/docs/architecture/system-overview.md`
- Service-level: `price-engine/services/price-engine-service/docs/overall-architecture.md`
- Docs index: `price-engine/docs/README.md`

## Step 8: Ask Where to Save

Present the generated documentation, then ask:

- **Save to `docs/` in the current repo** -- Write files to the output structure above
- **Just show it** -- Display in chat only, don't write to disk

If saving:
1. Write the documentation files.
2. Update the repository's README with a link under a `## Documentation` section:
   ```markdown
   ## Documentation

   - [Overall Architecture](docs/overall-architecture.md)
   ```
3. Ask whether to commit.
