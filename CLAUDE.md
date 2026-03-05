# ERP Admin — Referencia rápida del proyecto

Sistema ERP multi-tenant para gestión de inventario, productos, órdenes y usuarios. Un superadmin administra múltiples empresas; cada empresa tiene su propio conjunto de datos aislado por row-level security.

---

## Stack tecnológico

### Backend — `ERP.Web.API/`
| Componente | Tecnología | Versión |
|---|---|---|
| Runtime | .NET | 10 |
| Framework | ASP.NET Core | 10 |
| ORM | Entity Framework Core | 10 |
| Base de datos | SQL Server | Express (SQLEXPRESS) |
| CQRS | Mediator.SourceGenerator | — |
| Validación | FluentValidation | — |
| Mapeo DTO↔Entity | Mapster | — |
| Hashing | BCrypt.Net | — |
| Auth | JWT Bearer (HS256) + Refresh Tokens | — |

### Frontend — `ERP.Web.API/erp-admin/`
| Componente | Tecnología | Versión |
|---|---|---|
| UI | React | 19.2 |
| Bundler | Vite | 7.3 |
| Lenguaje | TypeScript | 5.9 |
| Fetch + caché | TanStack Query | 5.90 |
| Routing | React Router | 7.13 |
| Estilos | Tailwind CSS | 3.4 |
| Íconos | Lucide React | 0.575 |
| Notificaciones | React Hot Toast | 2.6 |

---

## Estructura de carpetas

```
ERP.WEB.API/                          ← Raíz del repositorio
├── CLAUDE.md                         ← Este archivo
├── ERP.Web.API/                      ← Solución .NET (sln)
│   ├── ERP.Web.API/                  ← Capa API (controllers, middleware, startup)
│   │   ├── Controllers/              ← 12 controladores REST
│   │   ├── Middleware/               ← TenantMiddleware, RequestLoggingMiddleware
│   │   ├── Authorization/            ← Policies.cs (Admin, Viewer)
│   │   ├── Program.cs                ← DI, JWT, CORS, pipeline
│   │   ├── appsettings.json          ← Conexión DB, JWT, CORS
│   │   └── wwwroot/uploads/products/ ← Imágenes servidas como estáticas
│   │
│   ├── ERP.WEB.Application/          ← Capa Application (CQRS, DTOs, validators)
│   │   ├── Features/                 ← 13 módulos: Brands, Categories, Companies,
│   │   │                             │   Consumptions, Inventory, Orders, Products,
│   │   │                             │   ProductImages, ProductVariants, Promotions,
│   │   │                             │   Tags, Users (con sub-carpetas Commands/ y Queries/)
│   │   ├── DTOs/                     ← ~25 records de entrada/salida por entidad
│   │   ├── Common/                   ← CursorPagedResult<T>, CursorParams
│   │   ├── Validators/               ← FluentValidation (auto-validación en pipeline)
│   │   └── MapsterConfig.cs          ← Configuración global Mapster
│   │
│   ├── ERP.WEB.Domain/               ← Capa Domain (entidades, interfaces)
│   │   ├── Entities/                 ← 14 clases de entidad
│   │   ├── Interfaces/               ← ICompanyContext + 13 IRepository
│   │   └── Enums/                    ← OrderStatus, StockStatus, UserRole
│   │
│   ├── ERP.WEB.Infrastructure/       ← Capa Infrastructure (EF, repos, servicios)
│   │   ├── Data/
│   │   │   └── ApplicationDbContext.cs ← DbContext: query filters multi-tenant,
│   │   │                               │   auto-assign CompanyId en SaveChanges
│   │   ├── Repositories/             ← 13 implementaciones de repositorio
│   │   ├── Services/
│   │   │   ├── TokenService.cs       ← Genera JWT + refresh tokens
│   │   │   └── CompanyContext.cs     ← Implementa ICompanyContext (scoped)
│   │   └── Migrations/               ← 3 EF migrations aplicadas
│   │       ├── InitialCreate
│   │       ├── AddMissingTablesAndIndexes
│   │       └── MakeUserCompanyNullable
│   │
│   ├── ERP.Web.API.Tests/            ← Proyecto de tests de integración (xUnit)
│   │   ├── Infrastructure/
│   │   │   └── ApiFixture.cs         ← WebApplicationFactory + wipe DB + seed data
│   │   ├── Tests/
│   │   │   ├── SeedTests.cs          ← Tests del endpoint seed-super-admin
│   │   │   └── TenantIsolationTests.cs ← Tests de aislamiento multi-tenant
│   │   ├── AssemblyInfo.cs           ← DisableTestParallelization = true
│   │   └── GlobalUsings.cs           ← global using Xunit
│   │
│   └── erp-admin/                    ← Frontend React/Vite
│       ├── src/
│       │   ├── api/                  ← 13 servicios HTTP + client.ts
│       │   ├── components/           ← 11 componentes reutilizables
│       │   ├── context/              ← UserContext, ThemeContext
│       │   ├── pages/                ← 14 páginas
│       │   ├── types/index.ts        ← Todos los tipos TypeScript
│       │   ├── utils/imageUrl.ts     ← Construye URL de imágenes
│       │   ├── App.tsx               ← Routing + providers
│       │   └── main.tsx              ← Entry point
│       ├── .env.example              ← VITE_API_BASE=...
│       └── package.json
```

---

## Entidades del dominio

| Entidad | Tabla SQL | Multi-tenant |
|---|---|---|
| Company | Companies | No (es el tenant) |
| User | Users | Sí (CompanyId nullable — SuperAdmin = NULL) |
| Brand | Brands | Sí |
| Category | Categories | Sí |
| Product | Products | Sí |
| ProductVariant | ProductVariants | Sí |
| ProductImage | Product_Images | Sí |
| Inventory | Inventory | Sí |
| Tag | Tags | Sí |
| Promotion | Promotions | Sí |
| Consumption | Consumptions | Sí |
| Order | Orders | Sí |
| OrderItem | OrderItems | No (hija de Order) |
| RefreshToken | RefreshTokens | No |

---

## Controladores (12)

Todos con `[Authorize]` y ruta base `/api/[controller]`.
Métodos escritura requieren `[Authorize(Policy = Policies.Admin)]`.

| Controlador | Responsabilidad |
|---|---|
| `BrandsController` | CRUD de marcas + marcar como default |
| `CategoriesController` | CRUD de categorías + subcategorías + listado principal |
| `CompaniesController` | CRUD de empresas (solo SuperAdmin puede listar/crear) |
| `ConsumptionsController` | CRUD de consumos + artículos disponibles para consumir |
| `InventoryController` | CRUD de inventario + restock (PATCH) + búsqueda por producto |
| `OrdersController` | CRUD de órdenes + workflow: confirm, cancel |
| `ProductImagesController` | CRUD de imágenes + upload de archivo (máx. 10MB, wwwroot) |
| `ProductsController` | CRUD de productos + toggle-favorite + set-stock-status |
| `ProductVariantsController` | CRUD de variantes de producto |
| `PromotionsController` | CRUD de promociones + listado activas + por producto |
| `TagsController` | CRUD de tags + asignar/quitar tag a producto |
| `UsersController` | CRUD de usuarios + login + refresh + revoke + seed-super-admin |

### Endpoints especiales en `UsersController`

| Ruta | Auth | Descripción |
|---|---|---|
| `POST /api/users/login` | `[AllowAnonymous]` | Devuelve JWT + refresh token |
| `POST /api/users/refresh` | `[AllowAnonymous]` | Rota refresh token, emite nuevos tokens |
| `POST /api/users/revoke` | `[Authorize]` | Invalida un refresh token |
| `POST /api/users/seed-super-admin` | `[AllowAnonymous]` | Crea el primer SuperAdmin; devuelve 409 si ya existe |

---

## Páginas React (14)

| Archivo | Ruta | Qué renderiza |
|---|---|---|
| `Login.tsx` | `/login` | Formulario de autenticación; redirige al dashboard tras login |
| `Dashboard.tsx` | `/` | Estadísticas de resumen + alertas de inventario bajo stock |
| `Brands.tsx` | `/brands` | CRUD de marcas con tabla cursor-paginada y botón "Cargar más" |
| `Categories.tsx` | `/categories` | CRUD de categorías con soporte de jerarquía padre/hijo |
| `Products.tsx` | `/products` | CRUD de productos con toggle-favorite y stock status |
| `Inventory.tsx` | `/inventory` | CRUD de inventario con restock modal |
| `ArticulosDisponibles.tsx` | `/articulos` | Lista de artículos disponibles para registrar consumos |
| `Consumptions.tsx` | `/consumptions` | Registro y listado de consumos de inventario |
| `Orders.tsx` | `/orders` | CRUD de órdenes con workflow Draft → Confirmed / Cancelled |
| `Tags.tsx` | `/tags` | CRUD de tags |
| `Promotions.tsx` | `/promotions` | CRUD de promociones con fechas de vigencia |
| `ProductImages.tsx` | `/product-images` | Upload y gestión de imágenes de producto |
| `Users.tsx` | `/users` | CRUD de usuarios con selector de rol (Viewer / Admin) |
| `Companies.tsx` | `/companies` | CRUD de empresas — solo visible en nav para SuperAdmin |

---

## Componentes React (11)

| Archivo | Qué renderiza |
|---|---|
| `Layout.tsx` | Shell de la app: sidebar colapsable (desktop) + drawer (mobile) + `<Outlet />` |
| `Badge.tsx` | Chip de color para mostrar estado/rol (Draft, Active, Admin, etc.) |
| `Modal.tsx` | Contenedor de overlay modal genérico |
| `ConfirmDialog.tsx` | Modal de confirmación para acciones destructivas |
| `FormField.tsx` | Wrapper de label + input/select con estilos consistentes |
| `SearchableSelect.tsx` | Dropdown con filtrado por texto |
| `CompanySelector.tsx` | Selector de empresa activa para SuperAdmin (persiste en localStorage) |
| `PageHeader.tsx` | Cabecera de sección con título, descripción y slot de acciones |
| `EmptyState.tsx` | Placeholder cuando un listado está vacío |
| `LoadingSpinner.tsx` | Spinner inline para estados de carga |
| `StatsCard.tsx` | Tarjeta de métrica para el dashboard |

---

## Servicios API (frontend)

Todos importan `client` de `src/api/client.ts` y usan `useInfiniteQuery` con cursor pagination.

| Archivo | Objeto exportado |
|---|---|
| `client.ts` | `client` — fetch wrapper con auto-refresh de token en 401 |
| `brands.ts` | `brandsApi` |
| `categories.ts` | `categoriesApi` |
| `companies.ts` | `companiesApi` |
| `consumptions.ts` | `consumptionsApi` |
| `inventory.ts` | `inventoryApi` |
| `orders.ts` | `ordersApi` |
| `productImages.ts` | `productImagesApi` |
| `products.ts` | `productsApi` |
| `productVariants.ts` | `productVariantsApi` |
| `promotions.ts` | `promotionsApi` |
| `tags.ts` | `tagsApi` |
| `users.ts` | `usersApi` |

---

## Patrones y convenciones

### Backend

**Clean Architecture** — dependencias unidireccionales:
`API → Application → Domain ← Infrastructure`

**CQRS con Mediator.SourceGenerator** — cada operación es un `IRequest<T>` + `IRequestHandler`. Los handlers se registran por source generation (sin reflexión en runtime).

**Paginación cursor-based** — todos los `getAll` devuelven:
```json
{ "items": [...], "nextCursor": "base64string|null", "hasMore": true|false }
```
El cursor se codifica/decodifica en `CursorHelper` (Base64 de ID).

**Multi-tenancy row-level** — `TenantMiddleware` lee `companyId` del JWT y lo inyecta en `ICompanyContext` (scoped). Los global query filters de EF filtran automáticamente por `CompanyId`. SuperAdmin (`IsSuperAdmin=true`) bypasea todos los filtros.

**Roles y políticas**:
- `Admin` policy: rol `"Admin"` **o** `"SuperAdmin"`
- `Viewer` policy: roles `"Viewer"`, `"Admin"`, `"SuperAdmin"`
- Todos los GET son Viewer, todos los POST/PUT/PATCH/DELETE son Admin

**Auto-assign CompanyId** — `ApplicationDbContext.SaveChangesAsync` asigna `CompanyId` en entidades `ICompanyEntity` recién creadas cuando `ICompanyContext.CompanyId > 0`.

**User.CompanyId es nullable** — SuperAdmin no pertenece a ninguna empresa (`NULL`). Los usuarios normales reciben el `CompanyId` del contexto en `CreateUserCommandHandler`.

**FluentValidation** — `AddFluentValidationAutoValidation()` valida `[FromBody]` DTOs y devuelve 400 antes de que el mediator reciba el command.

**Imágenes** — se guardan en `wwwroot/uploads/products/`, se sirven como archivos estáticos. La URL relativa se almacena en `ProductImage.ImagePath`.

### Frontend

**`useInfiniteQuery`** — todas las páginas de listado usan `useInfiniteQuery` con:
```ts
initialPageParam: undefined as string | undefined,
getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined
```
Los items se obtienen aplanando: `data?.pages.flatMap(p => p.items) ?? []`

**Auto-refresh de JWT** — `client.ts` intercepta 401: lee `erp-refresh-token`, llama a `/api/users/refresh`, actualiza `erp-token`, y reintenta la petición original. Si falla, limpia localStorage y redirige a `/login`.

**`isAdmin`** — se calcula como `role === 'Admin' || isSuperAdmin === true`. Los botones de escritura se condicionan con `{isAdmin && ...}`.

**CompanySelector** — solo aparece para `isSuperAdmin`. Al cambiar empresa llama a `switchCompany()` que actualiza `erp-company-id` en localStorage; todas las peticiones siguientes incluyen ese header.

**Roles de frontend** — el tipo `AppRole` es `'Admin' | 'Viewer'`. El rol `'SuperAdmin'` del backend se mapea a `role: 'Admin'` con `isSuperAdmin: true` en el frontend.

**QueryClient config** — `staleTime: 5 min`, `retry: 1`, `refetchOnWindowFocus: false`.

---

## Variables de entorno

### Backend — `appsettings.json`

| Clave | Para qué sirve |
|---|---|
| `ConnectionStrings:DefaultConnection` | Cadena de conexión SQL Server |
| `Jwt:Key` | Clave de firma HS256 (mínimo 32 caracteres) |
| `Jwt:Issuer` | Claim `iss` del JWT |
| `Jwt:Audience` | Claim `aud` del JWT |
| `Jwt:ExpiryHours` | Vida útil del access token (horas) |
| `Jwt:RefreshTokenExpiryDays` | Vida útil del refresh token (días) |
| `Cors:AllowedOrigins` | Orígenes permitidos, separados por coma |

### Frontend — `.env` (basado en `.env.example`)

| Variable | Para qué sirve | Default si ausente |
|---|---|---|
| `VITE_API_BASE` | URL base de la API | `http://localhost:5147` |

---

## Contextos React

**`UserContext`** — estado de autenticación global.
- `ActiveUser`: `userId`, `name`, `email`, `role`, `authenticated`, `token`, `companyId`, `companyName`, `isSuperAdmin`, `companies[]`, `refreshToken`
- Expone: `setUser()`, `logout()`, `switchCompany()`, `isAdmin`, `isAuthenticated`, `isSuperAdmin`

**`ThemeContext`** — toggle dark/light mode con persistencia en `localStorage`.

### localStorage keys

| Clave | Contenido |
|---|---|
| `erp-active-user` | JSON serializado de `ActiveUser` |
| `erp-token` | JWT access token |
| `erp-refresh-token` | Refresh token para renovación silenciosa |
| `erp-company-id` | ID de la empresa activa (lo lee `client.ts` para el header `X-Company-Id`) |
| `erp-theme` | `"dark"` o `"light"` |

---

## Comandos útiles

### Backend (desde `ERP.Web.API/`)

```bash
# Ejecutar API en modo desarrollo
dotnet run --project ERP.Web.API

# Hot reload
dotnet watch --project ERP.Web.API

# Ejecutar todos los tests de integración
dotnet test ERP.Web.API.Tests/ERP.Web.API.Tests.csproj

# Agregar nueva migración EF
dotnet ef migrations add <Nombre> \
  --project ERP.WEB.Infrastructure \
  --startup-project ERP.Web.API

# Aplicar migraciones pendientes
dotnet ef database update \
  --project ERP.WEB.Infrastructure \
  --startup-project ERP.Web.API

# Compilar toda la solución
dotnet build
```

### Frontend (desde `ERP.Web.API/erp-admin/`)

```bash
# Dev server (http://localhost:5173)
npm run dev

# Check TypeScript + build producción
npm run build

# Preview del build
npm run preview

# Lint
npm run lint
```

---

## Tests de integración

El proyecto `ERP.Web.API.Tests` usa `WebApplicationFactory<Program>` contra la DB real (`erptest`).

- **`ApiFixture`** — fixture compartida para `[Collection("Api")]`: wipe completo de la DB + seed (SuperAdmin, 2 empresas, 2 admins).
- **`SeedTests`** — fixture propia (`[Collection("Seed")]`): prueba 201 en primera llamada y 409 en segunda.
- **`TenantIsolationTests`** — verifica aislamiento de marcas/usuarios entre tenants, visibilidad de SuperAdmin, y control de acceso por rol.
- La paralelización está deshabilitada (`DisableTestParallelization = true`) porque todos los tests comparten la misma DB.

Orden de wipe (FK inverso):
`RefreshTokens → OrderItems → Orders → Consumptions → Promotions → Product_Images → Inventory → ProductVariants → Product_Tags → Products → Categories → Brands → Tags → Users → Companies`
