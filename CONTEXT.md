# CONTEXT.md — ERP.WEB.API

## Reglas de trabajo

1. Solo trabajar dentro de `C:\Users\vpaz1\Desktop\ERP.WEB.API`
2. No modificar archivos sin mostrar el diff primero
3. Ante dudas de ruta, preguntar antes de asumir
4. Abrir solo la carpeta del proyecto que se va a tocar
5. Agrupar cambios del mismo tipo en lote — no editar archivo por archivo
6. No narrar pasos intermedios — solo mostrar diff + resumen al terminar
7. Re-lecturas de archivos se hacen en silencio sin anunciarlo

---

## Stack

- **Runtime:** .NET 10 / ASP.NET Core 10
- **ORM:** Entity Framework Core 10 (SQL Server)
- **Arquitectura:** Clean Architecture (4 capas)
- **Mensajería:** Mediator.SourceGenerator v3 (CQRS, source-gen, no reflexión)
- **Mapeo:** Mapster v7.4.0
- **Autenticación:** JWT Bearer — claims `companyId`, `isSuperAdmin`
- **Passwords:** BCrypt.Net-Next v4
- **Documentación:** Swashbuckle (Swagger)
- **Frontend (separado):** React + Vite + TypeScript + Tailwind + TanStack Query + Axios (`erp-admin/`)
- **Base de datos:** SQL Server (connection string en `appsettings.json`)

### Estructura de solución

```
ERP.WEB.API/
├── ERP.Web.API/              ← Controllers, Middleware, Program.cs
├── ERP.WEB.Application/      ← DTOs, Features (Commands + Queries), MediatorConfig
├── ERP.WEB.Domain/           ← Entities, Interfaces (sin dependencias NuGet)
├── ERP.WEB.Infrastructure/   ← DbContext, Migrations, Repositories, Services
└── erp-admin/                ← Frontend React (proyecto independiente)
```

---

## Lo que ya existe

### Entidades con propiedades

**Brand** — `BrandId, CompanyId, Name(100), Description?, IsDefault`
→ nav: `Company, Products[]`

**Category** — `CategoryId, CompanyId, Name(100), Description?, ParentCategoryId?`
→ nav: `Company, ParentCategory?, SubCategories[], Products[]`

**Product** — `ProductId, CompanyId, Name(200), Description?, BrandId?, CategoryId?, ReferenceLink?, PurchaseLocation?(200), Status(50), StockStatus?(50), IsFavorite, CreatedAt`
→ nav: `Brand?, Category?, Inventory?, Tags[], Promotions[], Images[], Variants[], Company`

**Inventory** — `InventoryId, CompanyId, ProductId, VariantId?, PurchaseCost(18,2), SuggestedRetailPrice(18,2), CurrentStock, LastRestockDate, LastSaleDate?, NeedsRestock`
→ nav: `Product, Variant?, Company`

**Company** — `CompanyId, Name(150), Description?, Slug(100 unique), LogoUrl?, CustomDomain?(200), PrimaryColor?(7), IsActive, CreatedAt`
→ nav: todas las colecciones

**Tag** — `TagId, CompanyId, TagName(50)`
→ nav: `Company, Products[]` (M:N via `Product_Tags`)

**Promotion** — `PromoId, CompanyId, ProductId, DiscountPercentage?(5,2), StartDate, EndDate`
→ nav: `Product, Company`

**ProductImage** — `ImageId, CompanyId, ProductId, VariantId?, ImagePath, IsPrimary, DisplayOrder, RegisteredAt`
→ nav: `Product, Variant?, Company`

**ProductVariant** — `VariantId, CompanyId, ProductId, Name(200), Description?, CreatedAt`
→ nav: `Product, Inventory?, Images[], Company`

**User** — `UserId, CompanyId, Name(100), Email(200 unique), Role(50), Status(50), PasswordHash?(256 BCrypt), IsSuperAdmin, CreatedAt`
→ nav: `Company`

**Consumption** — `ConsumptionId, CompanyId, InventoryId, Quantity, ConsumedAt, Notes?`
→ nav: `Inventory, Company`

---

### Endpoints funcionando (~68 endpoints)

| Recurso | Endpoints |
|---|---|
| `products` | CRUD + toggle-favorite + set stock-status |
| `categories` | CRUD + /main + /{id}/subcategories |
| `brands` | CRUD + /{id}/set-default |
| `inventory` | CRUD + /product/{id} + PATCH /{id}/restock |
| `users` | CRUD + POST /login [AllowAnonymous] |
| `tags` | CRUD + /product/{id} + POST/DELETE /{tagId}/products/{productId} |
| `promotions` | CRUD + /active + /product/{id} |
| `product-images` | CRUD + POST /upload (file, max 10MB, wwwroot/uploads/products) |
| `product-variants` | CRUD (by-product, create, update, delete) |
| `companies` | CRUD estándar |
| `consumptions` | GetAll + /available + Create + Delete |

---

### Patrones implementados

- **Clean Architecture** — dependencias unidireccionales Domain ← Application ← Infrastructure ← API
- **CQRS** — Commands (write) y Queries (read) en `Features/{Dominio}/`
- **Mediator SourceGenerator v3** — sin reflexión, Scoped en `MediatorConfig.cs`
- **Repository Pattern** — interfaces en Domain, implementaciones en Infrastructure
- **Multi-tenancy** — Global Query Filters en EF Core + auto-assign `CompanyId` en `SaveChangesAsync` + `TenantMiddleware` + `ICompanyContext`
- **SuperAdmin bypass** — header `X-Company-Id` permite operar en cualquier tenant
- **JWT** — Bearer con claims custom (`companyId`, `isSuperAdmin`), `ClockSkew` 1 min
- **File upload** — GUID + validación de extensión + borrado físico al eliminar imagen
- **DTO Records** — inmutables, separados en entrada (Create/Update) y salida
- **BCrypt** — hash de passwords en `User.PasswordHash`

---

## Deuda técnica detectada

### Falta implementar
- **Autorización por roles** — `[Authorize]` existe pero no hay políticas por `Role` (Admin, User, etc.)
- **Refresh tokens** — login retorna JWT pero no hay mecanismo de renovación
- **Paginación** — todos los GetAll retornan colecciones completas sin paginación ni filtros
- **Validación de entrada** — no se detecta FluentValidation ni DataAnnotations en DTOs de entrada
- **Unit / Integration tests** — no existe proyecto de tests en la solución
- **Índices en DB** — solo hay índice único en `Company.Slug` y `User.Email`; faltan índices de rendimiento en FKs frecuentes

### Incompleto o inconsistente
- **`UsersController`** — el `[Authorize]` a nivel clase está comentado; los endpoints de lectura/escritura de usuarios son accesibles sin autenticación
- **Mapster** — está instalado pero el uso real vs mapeo manual en Handlers no está verificado uniformemente
- **`Product.StockStatus`** — existe como string libre; no hay enum ni validación de valores aceptados
- **`ProductVariants` sin GET /{id}** — solo existe `GetByProduct`, no hay endpoint de variante individual
- **`Consumptions` sin Update** — solo Create y Delete, no hay PUT
- **`wwwroot/uploads`** — el directorio debe existir en producción; no hay lógica de creación automática documentada
- **CORS** — configurado como `AllowAll`; pendiente de restringir para producción
- **`appsettings.json`** — connection string y JWT secret presumiblemente en texto plano; sin gestión de secretos

---

## Negocio (lo que se infiere)

Sistema ERP multi-tenant orientado a **gestión de inventario y catálogo de productos**:

- Cada **Company** es un tenant aislado con sus propios productos, marcas, categorías e inventario
- Los **Products** tienen variantes, imágenes, tags, promociones e inventario asociado
- El **Inventory** registra costo, precio sugerido, stock actual y alertas de restock
- Las **Consumptions** permiten registrar salidas de inventario (consumo interno, no ventas)
- Los **Users** tienen roles (`Admin`, `User`) y pertenecen a un tenant; existe el rol `IsSuperAdmin` que opera sobre todos los tenants
- Las **Promotions** son por producto con rango de fechas y porcentaje de descuento

**Decisiones confirmadas:**
- Multi-tenancy: filtro por `CompanyId` en EF Core — no se planea multi-DB
- Integraciones externas: ninguna planificada
- Frontend `erp-admin`: prototipo, no en producción
- Flujo de ventas / órdenes de compra: **planificado, aún no implementado**
- Roles y permisos por módulo: **sin definir** — ver nota de diseño abajo

> **Nota de diseño — Roles y permisos:**
> Actualmente `User.Role` es un string libre (`"Admin"`, `"User"`). Si se quieren
> permisos diferenciados por módulo (ej. un usuario puede ver inventario pero no
> editar productos), las opciones son:
> 1. **Policy-based authorization** en ASP.NET Core — policies por módulo + claims
> 2. **Permission table** en DB — tabla `UserPermission(UserId, Module, CanRead, CanWrite)`
> 3. **Role matrix fija** — roles predefinidos (Admin, Viewer, StockManager) con acceso codificado
>
> Pendiente decidir cuál aplicar antes de implementar `[Authorize(Policy = "...")]`.

---

## Estado

> **Recuperación de contexto — pendiente de completar con dueño del proyecto**

- Migración inicial aplicada: `20260304001142_InitialCreate`
- Branch activo: `Dev`
- Branch principal: `main`
- Frontend (`erp-admin/`) existe pero su estado de integración con la API no está verificado
