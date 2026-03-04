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

## Plan de migración

> Verificado contra código real. Rutas relativas a `ERP.Web.API/`.
> Ordenado: ejecutar en secuencia de fase. Dentro de cada fase, el orden de los ítems no importa.

---

### Gaps adicionales detectados (post-auditoría del código)

Estos problemas no estaban en la deuda técnica original:

| # | Gap | Dónde | Impacto |
|---|---|---|---|
| G1 | `DeleteCompanyCommand` **no existe** | `Features/Companies/Commands/` | El endpoint `DELETE /api/companies/{id}` está en el controller pero no tiene handler — lanza error en runtime |
| G2 | `ProductVariant` handlers usan `ApplicationDbContext` **directamente** | `Features/ProductVariants/Commands/*Handler.cs` y `Queries/*Handler.cs` | Viola Clean Architecture: Application → Infrastructure. No existe `IProductVariantRepository` |
| G3 | DTOs de entrada de Users, Companies, Consumptions y Variants están **inline en los Commands**, no en `/DTOs/` | `Features/*/Commands/*/` | Inconsistencia de estilo — al agregar validación en FASE 3 hay que buscarlos en los Commands, no en `/DTOs/` |
| G4 | `appsettings.json` tiene el JWT Key **hardcodeado**: `"YourSuperSecretKey-ChangeInProduction-MinLength32Chars!"` | `ERP.Web.API/appsettings.json` | Credencial expuesta en repositorio |
| G5 | `UpdateConsumption` — alcance sin definir | Decisión de negocio | ¿Solo `Notes` (trivial) o también `Quantity` con re-ajuste de stock? Son implementaciones muy distintas |

---

### ✅ FASE 0 — Integridad rota — COMPLETADA

> **Corrección al gap G1:** El controller bypasseaba Mediator y llamaba `ICompanyRepository.DeleteAsync` directamente vía `HttpContext.RequestServices`. Funcionaba pero violaba CQRS. `ICompanyRepository.DeleteAsync` ya existía — no fue necesario modificar Domain ni Infrastructure.

| Archivo | Resultado |
|---|---|
| `Features/Companies/Commands/DeleteCompany/DeleteCompanyCommand.cs` | ✅ CREADO |
| `Features/Companies/Commands/DeleteCompany/DeleteCompanyCommandHandler.cs` | ✅ CREADO |
| `ERP.Web.API/Controllers/CompaniesController.cs` | ✅ MODIFICADO — Delete usa `_mediator.Send(new DeleteCompanyCommand(id))` |

---

### ✅ FASE 1 — Seguridad crítica — COMPLETADA

| Archivo | Resultado |
|---|---|
| `ERP.Web.API/Controllers/UsersController.cs` | ✅ MODIFICADO — `[Authorize]` activo. `POST /login` sigue público vía `[AllowAnonymous]`. |

---

### FASE 2 — Quick wins (sin DB, sin packages nuevos)
> ✅ Decisiones confirmadas: #6 → `IProductVariantRepository` · #7 → `Quantity + Notes` con re-ajuste de stock

#### Archivos a MODIFICAR

| Archivo | Qué hacer |
|---|---|
| `ERP.Web.API/ERP.Web.API/Program.cs` | `Directory.CreateDirectory(Path.Combine(builder.Environment.WebRootPath, "uploads", "products"))` al arrancar |
| `ERP.WEB.Domain/Interfaces/IConsumptionRepository.cs` | Agregar `Task UpdateAsync(Consumption consumption)` |
| `ERP.WEB.Infrastructure/Repositories/ConsumptionRepository.cs` | Implementar `UpdateAsync` |
| `ERP.Web.API/Controllers/ConsumptionsController.cs` | Agregar `PUT /{id}` → `UpdateConsumptionCommand` |
| `ERP.Web.API/Controllers/ProductVariantsController.cs` | Agregar `GET /{id}` → `GetVariantByIdQuery` |
| `ERP.Web.API/ERP.Web.API/Program.cs` | Registrar `IProductVariantRepository` → `ProductVariantRepository` |
| `ERP.WEB.Application/Features/ProductVariants/Commands/CreateVariant/CreateVariantCommandHandler.cs` | Reemplazar `ApplicationDbContext` por `IProductVariantRepository` |
| `ERP.WEB.Application/Features/ProductVariants/Commands/UpdateVariant/UpdateVariantCommandHandler.cs` | Ídem |
| `ERP.WEB.Application/Features/ProductVariants/Commands/DeleteVariant/DeleteVariantCommandHandler.cs` | Ídem |
| `ERP.WEB.Application/Features/ProductVariants/Queries/GetVariantsByProduct/GetVariantsByProductQueryHandler.cs` | Ídem |

#### Archivos a CREAR

| Archivo | Qué hace |
|---|---|
| `ERP.WEB.Domain/Interfaces/IProductVariantRepository.cs` | Interfaz: `GetAllByProductAsync, GetByIdAsync, AddAsync, UpdateAsync, DeleteAsync` |
| `ERP.WEB.Infrastructure/Repositories/ProductVariantRepository.cs` | Implementación EF Core con `Include(Inventory, Images)` |
| `ERP.WEB.Application/Features/Consumptions/Commands/UpdateConsumption/UpdateConsumptionCommand.cs` | `record UpdateConsumptionCommand(int ConsumptionId, int Quantity, string? Notes)` |
| `ERP.WEB.Application/Features/Consumptions/Commands/UpdateConsumption/UpdateConsumptionCommandHandler.cs` | Busca Consumption + Inventory; calcula delta de cantidad (`nuevoQty - anteriorQty`); ajusta `CurrentStock` (resta si aumenta, suma si reduce); guarda |
| `ERP.WEB.Application/Features/ProductVariants/Queries/GetVariantById/GetVariantByIdQuery.cs` | `record GetVariantByIdQuery(int VariantId) : IRequest<ProductVariantDto?>` |
| `ERP.WEB.Application/Features/ProductVariants/Queries/GetVariantById/GetVariantByIdQueryHandler.cs` | Usa `IProductVariantRepository.GetByIdAsync`, mapea a `ProductVariantDto` |

> **Nota UpdateConsumption:** Si `nuevaCantidad > anteriorCantidad`, el delta se descuenta de `Inventory.CurrentStock`. Si `nuevaCantidad < anteriorCantidad`, el delta se devuelve. Stock nunca baja de 0.

> **Nota StockStatus (decisión #5 — Enum C#):** `Product.StockStatus` sigue siendo `string` en DB. Crear `ERP.WEB.Domain/Enums/StockStatus.cs` con `enum StockStatus { InStock, LowStock, OutOfStock }` y validar en `SetStockStatusCommandHandler` que el valor recibido sea un valor válido del enum.

**Riesgo:** Ninguno. Refactoriza sin cambiar comportamiento; `UpdateConsumption` solo agrega capacidad nueva.

---

### FASE 3 — Validación de entrada
> ✅ Decisión confirmada: **FluentValidation**

> **Ubicación real de DTOs de entrada** (crítico para esta fase):
> - En `/DTOs/` (15 archivos): `CreateBrandDto`, `UpdateBrandDto`, `CreateCategoryDto`, `UpdateCategoryDto`, `CreateProductDto`, `UpdateProductDto`, `CreateInventoryDto`, `UpdateInventoryDto`, `RestockInventoryDto`, `CreateTagDto`, `UpdateTagDto`, `CreatePromotionDto`, `UpdatePromotionDto`, `CreateProductImageDto`, `UpdateProductImageDto`
> - **Inline en Commands** (buscarlos en `Features/*/Commands/`): Users, Companies, Consumptions, ProductVariants

#### Archivos a MODIFICAR

| Archivo | Qué hacer |
|---|---|
| `ERP.WEB.Application/ERP.WEB.Application.csproj` | Agregar `FluentValidation.AspNetCore` v11 (incluye integración ASP.NET) |
| `ERP.Web.API/ERP.Web.API/Program.cs` | `builder.Services.AddValidatorsFromAssembly(typeof(MediatorConfig).Assembly)` |

#### Archivos a CREAR (22 validators en `ERP.WEB.Application/Validators/`)

| Validator | Valida |
|---|---|
| `CreateBrandValidator` | Name requerido, MaxLength 100 |
| `UpdateBrandValidator` | Ídem + BrandId > 0 |
| `CreateCategoryValidator` | Name requerido, MaxLength 100 |
| `UpdateCategoryValidator` | Ídem + CategoryId > 0 |
| `CreateProductValidator` | Name requerido MaxLength 200; Status en valores válidos |
| `UpdateProductValidator` | Ídem + ProductId > 0 |
| `CreateInventoryValidator` | PurchaseCost ≥ 0, SuggestedRetailPrice ≥ 0, ProductId > 0 |
| `UpdateInventoryValidator` | Ídem + InventoryId > 0 |
| `RestockInventoryValidator` | Quantity > 0 |
| `CreateTagValidator` | TagName requerido MaxLength 50 |
| `UpdateTagValidator` | Ídem + TagId > 0 |
| `CreatePromotionValidator` | ProductId > 0, DiscountPercentage 0-100, EndDate > StartDate |
| `UpdatePromotionValidator` | Ídem + PromoId > 0 |
| `CreateProductImageValidator` | ProductId > 0, ImagePath no vacío |
| `UpdateProductImageValidator` | ImageId > 0, DisplayOrder ≥ 0 |
| `CreateUserValidator` (inline → extraer a Validator) | Name requerido, Email válido, Role en enum `UserRole` |
| `UpdateUserValidator` | Ídem + UserId > 0 |
| `LoginValidator` | Email válido, Password no vacío |
| `CreateCompanyValidator` | Name requerido, Slug requerido sin espacios |
| `UpdateCompanyValidator` | Ídem + CompanyId > 0 |
| `UpdateConsumptionValidator` | ConsumptionId > 0, Quantity > 0 |
| `CreateVariantValidator` | ProductId > 0 |

> **FluentValidation + Mediator v3:** No hay integración automática de pipeline. Estrategia: validar al inicio de cada `CommandHandler` con `validator.ValidateAndThrow(request.Dto)`, o crear un `ValidationBehavior` manual que envuelva el handler. Decidir patrón uniforme antes de ejecutar la fase.

**Riesgo:** Bajo. Solo rechaza inputs inválidos que antes pasaban silenciosamente.

---

### FASE 4 — Paginación
> ✅ Decisión confirmada: **Cursor-based, todos los endpoints**
> ROMPE CONTRATO DE API — coordinar con frontend antes de ejecutar.

**Estructura cursor-based:**
- Request: `string? Cursor` (id del último ítem visto) + `int PageSize = 20`
- Response: `{ Items[], string? NextCursor, bool HasMore }` — sin `TotalCount` (el cursor no necesita count)
- Implementación EF: `WHERE Id > cursor ORDER BY Id ASC LIMIT pageSize + 1` (el +1 detecta si hay más)

#### Archivos a CREAR

| Archivo | Qué hace |
|---|---|
| `ERP.WEB.Application/Common/CursorPagedResult.cs` | `record CursorPagedResult<T>(IEnumerable<T> Items, string? NextCursor, bool HasMore)` |
| `ERP.WEB.Application/Common/CursorParams.cs` | `record CursorParams(string? Cursor = null, int PageSize = 20)` |

#### Archivos a MODIFICAR — Domain (10 interfaces)

`IBrandRepository`, `ICategoryRepository`, `IProductRepository`, `IInventoryRepository`, `ITagRepository`, `IPromotionRepository`, `IProductImageRepository`, `IUserRepository`, `IConsumptionRepository`, `IOrderRepository` (cuando exista):
→ `GetAllAsync()` cambia a `GetAllAsync(CursorParams p, CancellationToken ct)`

#### Archivos a MODIFICAR — Infrastructure (10 repositorios)

Mismos 10 repositorios:
→ Implementar `WHERE Id > decodedCursor ORDER BY Id ASC TAKE pageSize + 1`; el cursor se puede codificar en Base64 del id

#### Archivos a MODIFICAR — Application (10 Query Handlers)

`GetAllBrandsQueryHandler`, `GetAllCategoriesQueryHandler`, `GetAllProductsQueryHandler`, `GetAllInventoryQueryHandler`, `GetAllTagsQueryHandler`, `GetAllPromotionsQueryHandler`, `GetAllProductImagesQueryHandler`, `GetAllUsersQueryHandler`, `GetAllConsumptionsQueryHandler`, `GetAllOrdersQueryHandler`:
→ Recibir `CursorParams`, retornar `CursorPagedResult<T>`

#### Archivos a MODIFICAR — API (10 Controllers)

Todos los controllers con `GetAll`:
→ `[FromQuery] string? cursor, int pageSize = 20` → pasar a Query

> `IProductVariantRepository.GetAllByProductAsync` (creado en FASE 2) también recibe `CursorParams` — ya que se crea desde cero, incorporar cursor desde el inicio.

**Riesgo ALTO:** Todos los GetAll cambian de `T[]` a `{ items, nextCursor, hasMore }`. El frontend prototipo debe actualizarse en paralelo.

---

### FASE 5 — Autorización por roles
> ✅ Decisión confirmada: **Role matrix fija con enum**

**Role matrix fija:**

| Acción | Archivo | Qué hacer |
|---|---|---|
| CREAR | `ERP.WEB.Domain/Enums/UserRole.cs` | `enum UserRole { SuperAdmin, Admin, Viewer }` |
| CREAR | `ERP.Web.API/Authorization/Policies.cs` | `public static class Policies { public const string Admin = "Admin"; public const string Viewer = "Viewer"; }` |
| MODIFICAR | `ERP.Web.API/ERP.Web.API/Program.cs` | `AddAuthorization(opt => { opt.AddPolicy("Admin", p => p.RequireRole("Admin","SuperAdmin")); opt.AddPolicy("Viewer", p => p.RequireRole(...)); })` |
| MODIFICAR | 11 Controllers | `[Authorize(Policy = Policies.Admin)]` en endpoints de escritura; `[Authorize(Policy = Policies.Viewer)]` en lectura |
| VERIFICAR | `ERP.WEB.Infrastructure/Services/TokenService.cs` | Ya incluye `ClaimTypes.Role = user.Role` ✓ — solo asegurar que los valores en DB coincidan con el enum |

> `User.Role` permanece `string` en DB — sin migración. El enum solo vive en C# para validación al crear/actualizar usuarios.

**Riesgo:** Medio. Usuarios con `Viewer` pierden acceso a endpoints de escritura que antes eran libres. Definir la matriz de permisos por rol antes de aplicar.

---

### FASE 6 — Refresh tokens
**Prerequisito lógico: FASE 1 ejecutada.**

| Acción | Archivo | Qué hacer |
|---|---|---|
| CREAR | `ERP.WEB.Domain/Entities/RefreshToken.cs` | `RefreshTokenId, Token(string unique), UserId, ExpiresAt, IsRevoked, CreatedAt` — sin `CompanyId` (no es multi-tenant) |
| CREAR | `ERP.WEB.Domain/Interfaces/IRefreshTokenRepository.cs` | `GetByTokenAsync(string token), AddAsync(RefreshToken), RevokeAsync(string token)` |
| CREAR | `ERP.WEB.Infrastructure/Repositories/RefreshTokenRepository.cs` | Implementación EF Core |
| MODIFICAR | `ERP.WEB.Infrastructure/Data/ApplicationDbContext.cs` | `DbSet<RefreshToken>` + relación con `User` (FK UserId, DeleteBehavior.Cascade) + **sin** `HasQueryFilter` |
| MODIFICAR | `ERP.WEB.Infrastructure/Services/TokenService.cs` | Método `GenerateRefreshToken()` → `Guid.NewGuid().ToString("N")` + expiración desde config |
| MODIFICAR | `ERP.WEB.Application/DTOs/LoginResultDto.cs` | Agregar `string RefreshToken, DateTime RefreshTokenExpiry` al record |
| CREAR | `ERP.WEB.Application/Features/Users/Commands/RefreshToken/RefreshTokenCommand.cs` | `record RefreshTokenCommand(string Token) : IRequest<LoginResultDto?>` |
| CREAR | `ERP.WEB.Application/Features/Users/Commands/RefreshToken/RefreshTokenCommandHandler.cs` | Valida token, genera nuevo JWT + refresh token |
| CREAR | `ERP.WEB.Application/Features/Users/Commands/RevokeToken/RevokeTokenCommand.cs` | `record RevokeTokenCommand(string Token) : IRequest<bool>` |
| CREAR | `ERP.WEB.Application/Features/Users/Commands/RevokeToken/RevokeTokenCommandHandler.cs` | Marca token como revocado |
| MODIFICAR | `ERP.Web.API/Controllers/UsersController.cs` | Agregar `POST /refresh` y `POST /revoke` |
| MODIFICAR | `ERP.Web.API/ERP.Web.API/Program.cs` | `services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>()` |
| CREAR | Nueva migración EF Core | `AddRefreshTokensTable` |

**Riesgo:** Medio. Nueva tabla en DB (migración segura, solo agrega). `LoginResultDto` cambia — frontend debe actualizarse.

---

### FASE 7 — Módulo Orders/Ventas
> ✅ Decisión confirmada: **ConfirmOrder reduce stock directamente** (Orders ≠ Consumptions)

**Entidades:**

| Entidad | Propiedades |
|---|---|
| `Order` | `OrderId, CompanyId, Status(string/enum), Notes?, TotalAmount(decimal), CreatedAt` |
| `OrderItem` | `OrderItemId, OrderId, InventoryId, Quantity(int), UnitPrice(decimal)` |

**Archivos a crear/modificar:**

| Acción | Archivo | Qué hacer |
|---|---|---|
| CREAR | `ERP.WEB.Domain/Entities/Order.cs` | Entidad con nav `Company, Items[]` |
| CREAR | `ERP.WEB.Domain/Entities/OrderItem.cs` | Entidad con nav `Order, Inventory` |
| CREAR | `ERP.WEB.Domain/Enums/OrderStatus.cs` | `Draft, Confirmed, Cancelled` |
| CREAR | `ERP.WEB.Domain/Interfaces/IOrderRepository.cs` | `GetAllAsync, GetByIdAsync, GetByStatusAsync, AddAsync, UpdateAsync, DeleteAsync` |
| CREAR | `ERP.WEB.Infrastructure/Repositories/OrderRepository.cs` | Implementación EF Core con `Include(Items)` |
| MODIFICAR | `ERP.WEB.Infrastructure/Data/ApplicationDbContext.cs` | `DbSet<Order>`, `DbSet<OrderItem>`, relaciones, `HasQueryFilter` por `CompanyId` en Order |
| CREAR | `ERP.WEB.Application/DTOs/OrderDto.cs` | DTO de salida (OrderId, Status, Items[], TotalAmount, CreatedAt) |
| CREAR | `ERP.WEB.Application/DTOs/OrderItemDto.cs` | DTO de línea (InventoryId, ProductName, Quantity, UnitPrice) |
| CREAR | `ERP.WEB.Application/Features/Orders/Commands/CreateOrder/` | Command + Handler (crea Order en estado Draft) |
| CREAR | `ERP.WEB.Application/Features/Orders/Commands/ConfirmOrder/` | Command + Handler (valida stock, reduce `CurrentStock`, cambia status a Confirmed — transaccional) |
| CREAR | `ERP.WEB.Application/Features/Orders/Commands/CancelOrder/` | Command + Handler (devuelve stock si estaba Confirmed, cambia a Cancelled) |
| CREAR | `ERP.WEB.Application/Features/Orders/Queries/GetAllOrders/` | Query + Handler |
| CREAR | `ERP.WEB.Application/Features/Orders/Queries/GetOrderById/` | Query + Handler |
| CREAR | `ERP.Web.API/Controllers/OrdersController.cs` | `GET /api/orders`, `GET /{id}`, `POST`, `POST /{id}/confirm`, `POST /{id}/cancel`, `DELETE /{id}` |
| MODIFICAR | `ERP.Web.API/ERP.Web.API/Program.cs` | `services.AddScoped<IOrderRepository, OrderRepository>()` |
| CREAR | Nueva migración EF Core | `AddOrdersTables` |

> **Reducción de stock:** El handler `ConfirmOrder` reduce `Inventory.CurrentStock` directamente (mismo mecanismo que `CreateConsumption`). Las Orders son ventas; las Consumptions son consumo interno — dos conceptos distintos, no se mezclan.

**Riesgo:** Alto. `ConfirmOrder` debe ejecutar todo en una transacción — si falla la reducción de algún item, no se confirma la orden. Usar `IDbContextTransaction` o el `SaveChanges` atómico de EF Core.

---

### FASE 8 — Índices en DB
**Sin decisiones. Ejecutar después de FASE 7 (para incluir índice de OrderItems).**

| Acción | Archivo | Qué hacer |
|---|---|---|
| MODIFICAR | `ERP.WEB.Infrastructure/Data/ApplicationDbContext.cs` | Agregar `.HasIndex()` en `OnModelCreating` para todas las FKs |
| CREAR | Nueva migración EF Core | `AddPerformanceIndexes` |

**FKs a indexar:**

| Tabla | Columnas a indexar |
|---|---|
| Product | `CompanyId`, `BrandId`, `CategoryId` |
| Inventory | `CompanyId`, `ProductId`, `VariantId` |
| ProductVariant | `CompanyId`, `ProductId` |
| ProductImage | `CompanyId`, `ProductId`, `VariantId` |
| Promotion | `CompanyId`, `ProductId` |
| Tag | `CompanyId` |
| Consumption | `CompanyId`, `InventoryId` |
| User | `CompanyId` |
| Brand | `CompanyId` |
| Category | `CompanyId`, `ParentCategoryId` |
| OrderItem | `OrderId`, `InventoryId` |
| Order | `CompanyId`, `Status` |
| RefreshToken | `Token` (unique), `UserId` |

**Riesgo:** Muy bajo. Solo agrega índices, no modifica esquema.

---

### FASE 9 — Mantenimiento (Mapster + CORS + Secrets)
**Sin impacto funcional. Sin orden interno.**

| Acción | Archivo | Qué hacer |
|---|---|---|
| CREAR | `ERP.WEB.Application/MapsterConfig.cs` | `TypeAdapterConfig` global registrado al arrancar |
| MODIFICAR | Handlers con mapeo manual (Brands, Categories, Products, etc.) | Reemplazar `new XxxDto(...)` por `.Adapt<XxxDto>()` — solo donde no hay lógica embebida |
| MODIFICAR | `ERP.Web.API/ERP.Web.API/Program.cs` | CORS: `WithOrigins(config["Cors:AllowedOrigins"])` en lugar de `AllowAnyOrigin()` |
| MODIFICAR | `ERP.Web.API/ERP.Web.API/appsettings.json` | Mover `Jwt:Key` y `ConnectionStrings:DefaultConnection` a `appsettings.Development.json` (gitignored) o a variables de entorno |
| CREAR | `ERP.Web.API/ERP.Web.API/appsettings.Development.json` | Secrets reales de dev (si no existe ya) |

> El JWT Key actual `"YourSuperSecretKey-ChangeInProduction-MinLength32Chars!"` está expuesto en el repositorio — prioridad si el repo es público.

**Riesgo:** Bajo en Mapster (verificar handlers con lógica en mapeo antes de reemplazar). Bajo en CORS (solo restringe orígenes). Nulo en secrets (solo mueve configuración).

---

### Decisiones confirmadas ✅

| # | Decisión | Elegida | Impacta |
|---|---|---|---|
| 1 | **Validación** | FluentValidation (`FluentValidation.AspNetCore` v11) | FASE 3 |
| 2 | **Paginación** | Cursor-based, **todos** los endpoints | FASE 4 |
| 3 | **Roles** | Role matrix fija con `enum UserRole` | FASE 5 |
| 4 | **Orders vs stock** | `ConfirmOrder` reduce `Inventory.CurrentStock` directamente | FASE 7 |
| 5 | **StockStatus** | `enum StockStatus` en C# — `string` en DB, sin migración | FASE 2 + FASE 7 |
| 6 | **ProductVariant architecture** | Crear `IProductVariantRepository` + refactor de 4 handlers existentes | FASE 2 |
| 7 | **UpdateConsumption alcance** | `Quantity + Notes` con re-ajuste de stock (delta aplicado a `Inventory.CurrentStock`) | FASE 2 |

---

## Estado

> **Plan de migración completo — todas las decisiones confirmadas — listo para ejecutar**

- Migración inicial aplicada: `20260304001142_InitialCreate`
- Branch activo: `Dev` · Branch principal: `main`
- Frontend (`erp-admin/`): prototipo, no en producción

**Orden de ejecución:**

| Fase | Qué hace | Prerequisito |
|---|---|---|
| ✅ FASE 0 | Fix `DeleteCompanyCommand` — COMPLETADA | — |
| ✅ FASE 1 | Proteger `UsersController` con `[Authorize]` — COMPLETADA | — |
| ✅ FASE 2 | Quick wins: `IProductVariantRepository` + endpoints faltantes + `UpdateConsumption` + `StockStatus` enum — COMPLETADA | — |
| ✅ FASE 3 | FluentValidation en todos los DTOs — COMPLETADA | ✅ FASE 2 |
| ✅ FASE 4 | Paginación cursor-based en todos los endpoints — COMPLETADA | ✅ FASE 2 |
| ✅ FASE 5 | Autorización por roles (`UserRole` enum + policies) — COMPLETADA | ✅ FASE 1 |
| ✅ FASE 6 | Refresh tokens (nueva tabla en DB) — COMPLETADA | FASE 1 |
| ✅ FASE 7 | Módulo Orders/Ventas (nuevas tablas en DB) — COMPLETADA | FASE 2 (IInventoryRepository para reducir stock) |
| ➡️ FASE 8 | Índices en DB | FASE 7 (incluye índices de Orders) |
| FASE 9 | Mapster uniforme + CORS restrictivo + Secrets | Cualquier fase completada |
