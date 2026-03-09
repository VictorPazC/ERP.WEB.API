using System.Text;
using ERP.Web.API.Authorization;
using ERP.Web.API.Middleware;
using ERP.WEB.Application;
using ERP.WEB.Application.Validators;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using ERP.WEB.Infrastructure.Repositories;
using ERP.WEB.Infrastructure.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── Logging ──────────────────────────────────────────────────────────────────
builder.Logging.ClearProviders();
builder.Logging.AddConsole(options =>
{
    options.FormatterName = "simple";
});
builder.Logging.AddDebug();

// ── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Mapster — TypeAdapterConfig global (FlexibleNameMatching + PreserveReference).
builder.Services.AddMapsterConfig();

// FluentValidation — valida automáticamente [FromBody] DTOs en la pipeline de controller.
// Devuelve 400 con errores de validación antes de despachar el command al mediator.
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateBrandValidator>();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
// Políticas de autorización por rol (Decisión 3A — role matrix fija).
// Admin  → Admin + SuperAdmin: operaciones de escritura (POST/PUT/PATCH/DELETE).
// Viewer → todos los roles autenticados: operaciones de lectura (GET).
// Los valores de rol en el JWT (ClaimTypes.Role) deben coincidir con User.Role en DB.
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Policies.Admin, policy =>
        policy.RequireRole("Admin", "SuperAdmin"));

    options.AddPolicy(Policies.Viewer, policy =>
        policy.RequireRole("Viewer", "Admin", "SuperAdmin"));
});

// Mediator (Scoped lifetime so handlers can consume scoped DbContext/repositories)
builder.Services.AddMediator(options =>
{
    options.ServiceLifetime = ServiceLifetime.Scoped;
});

// Multi-tenant services
builder.Services.AddScoped<ICompanyContext, CompanyContext>();
builder.Services.AddScoped<ITokenService, TokenService>();

// Repositories
builder.Services.AddScoped<ICompanyRepository, CompanyRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
builder.Services.AddScoped<ITagRepository, TagRepository>();
builder.Services.AddScoped<IPromotionRepository, PromotionRepository>();
builder.Services.AddScoped<IProductImageRepository, ProductImageRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IConsumptionRepository, ConsumptionRepository>();
builder.Services.AddScoped<IBrandRepository, BrandRepository>();
builder.Services.AddScoped<IProductVariantRepository, ProductVariantRepository>(); // Decisión 6B
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

// Dashboard + Activity
builder.Services.AddScoped<IActivityLogRepository, ActivityLogRepository>();
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
builder.Services.AddScoped<IActivityLogger, ActivityLogger>();

// CORS — orígenes permitidos desde config (Cors:AllowedOrigins, separados por coma).
// En producción, poner solo el dominio del frontend. En desarrollo: appsettings.Development.json hereda.
var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"]?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? [];
builder.Services.AddCors(options =>
    options.AddPolicy("AllowReact", p =>
        p.WithOrigins(allowedOrigins)
         .AllowAnyHeader()
         .AllowAnyMethod()));

var app = builder.Build();

// ── Middleware pipeline ───────────────────────────────────────────────────────
app.UseMiddleware<RequestLoggingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowReact");

// Garantiza que la carpeta de uploads existe antes de servir archivos estáticos.
// Evita que StaticFiles falle en primera ejecución si wwwroot/uploads/products no existe.
Directory.CreateDirectory(Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads", "products"));

// Serve uploaded images from wwwroot
app.UseStaticFiles();

app.UseHttpsRedirection();

// Auth pipeline — order matters: Authentication → Tenant → Authorization
app.UseAuthentication();
app.UseTenantMiddleware();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Exposes Program class for WebApplicationFactory in integration tests.
public partial class Program { }
