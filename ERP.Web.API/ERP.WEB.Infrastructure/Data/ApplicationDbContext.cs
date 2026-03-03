using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    private readonly ICompanyContext? _companyContext;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ICompanyContext? companyContext = null)
        : base(options)
    {
        _companyContext = companyContext;
    }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Consumption> Consumptions => Set<Consumption>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Company entity ────────────────────────────────────────────────────
        modelBuilder.Entity<Company>(entity =>
        {
            entity.HasKey(e => e.CompanyId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.CustomDomain).HasMaxLength(200);
            entity.Property(e => e.PrimaryColor).HasMaxLength(7);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        // ── Global Query Filters (multi-tenant row-level isolation) ─────────
        // CompanyId == 0 means no tenant resolved yet (e.g. login) → no filter applied.
        // IsSuperAdmin bypasses filters to allow cross-company access.
        modelBuilder.Entity<Product>().HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == 0 || _companyContext.IsSuperAdmin || e.CompanyId == _companyContext.CompanyId);
        modelBuilder.Entity<Category>().HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == 0 || _companyContext.IsSuperAdmin || e.CompanyId == _companyContext.CompanyId);
        modelBuilder.Entity<Brand>().HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == 0 || _companyContext.IsSuperAdmin || e.CompanyId == _companyContext.CompanyId);
        modelBuilder.Entity<Inventory>().HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == 0 || _companyContext.IsSuperAdmin || e.CompanyId == _companyContext.CompanyId);
        modelBuilder.Entity<Tag>().HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == 0 || _companyContext.IsSuperAdmin || e.CompanyId == _companyContext.CompanyId);
        modelBuilder.Entity<Promotion>().HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == 0 || _companyContext.IsSuperAdmin || e.CompanyId == _companyContext.CompanyId);
        modelBuilder.Entity<ProductImage>().HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == 0 || _companyContext.IsSuperAdmin || e.CompanyId == _companyContext.CompanyId);
        modelBuilder.Entity<User>().HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == 0 || _companyContext.IsSuperAdmin || e.CompanyId == _companyContext.CompanyId);
        modelBuilder.Entity<Consumption>().HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == 0 || _companyContext.IsSuperAdmin || e.CompanyId == _companyContext.CompanyId);
        modelBuilder.Entity<ProductVariant>().HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == 0 || _companyContext.IsSuperAdmin || e.CompanyId == _companyContext.CompanyId);

        // ── Entity configurations ───────────────────────────────────────────
        modelBuilder.Entity<Brand>(entity =>
        {
            entity.HasKey(e => e.BrandId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Active");
            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Brand)
                  .WithMany(b => b.Products)
                  .HasForeignKey(e => e.BrandId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasOne(e => e.ParentCategory)
                  .WithMany(c => c.SubCategories)
                  .HasForeignKey(e => e.ParentCategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Inventory>(entity =>
        {
            entity.HasKey(e => e.InventoryId);
            entity.Property(e => e.PurchaseCost).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.SuggestedRetailPrice).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.CurrentStock).HasDefaultValue(0);
            entity.Property(e => e.LastRestockDate).HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.NeedsRestock).HasDefaultValue(false);
            // 1:many — one product can have one base inventory + one per variant
            entity.HasOne(e => e.Product)
                  .WithOne(p => p.Inventory)
                  .HasForeignKey<Inventory>(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Variant)
                  .WithOne(v => v.Inventory)
                  .HasForeignKey<Inventory>(e => e.VariantId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.TagId);
            entity.Property(e => e.TagName).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.TagName).IsUnique();
            entity.HasMany(e => e.Products)
                  .WithMany(p => p.Tags)
                  .UsingEntity(j => j.ToTable("Product_Tags"));
        });

        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.HasKey(e => e.PromoId);
            entity.Property(e => e.DiscountPercentage).HasColumnType("decimal(5,2)");
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Promotions)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.ImageId);
            entity.Property(e => e.ImagePath).IsRequired();
            entity.Property(e => e.IsPrimary).HasDefaultValue(false);
            entity.Property(e => e.DisplayOrder).HasDefaultValue(0);
            entity.Property(e => e.RegisteredAt).HasDefaultValueSql("GETDATE()");
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Images)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Variant)
                  .WithMany(v => v.Images)
                  .HasForeignKey(e => e.VariantId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.HasKey(e => e.VariantId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Variants)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Role).HasMaxLength(50).HasDefaultValue("User");
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Active");
            entity.Property(e => e.PasswordHash).HasMaxLength(256).IsRequired(false);
            entity.Property(e => e.IsSuperAdmin).HasDefaultValue(false);
        });

        modelBuilder.Entity<Consumption>(entity =>
        {
            entity.HasKey(e => e.ConsumptionId);
            entity.Property(e => e.Quantity).HasDefaultValue(1);
            entity.HasOne(e => e.Inventory)
                  .WithMany()
                  .HasForeignKey(e => e.InventoryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    /// <summary>
    /// Auto-assign CompanyId on new ICompanyEntity records before saving.
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        if (_companyContext is not null && _companyContext.CompanyId > 0)
        {
            foreach (var entry in ChangeTracker.Entries<ICompanyEntity>())
            {
                if (entry.State == EntityState.Added && entry.Entity.CompanyId == 0)
                {
                    entry.Entity.CompanyId = _companyContext.CompanyId;
                }
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        if (_companyContext is not null && _companyContext.CompanyId > 0)
        {
            foreach (var entry in ChangeTracker.Entries<ICompanyEntity>())
            {
                if (entry.State == EntityState.Added && entry.Entity.CompanyId == 0)
                {
                    entry.Entity.CompanyId = _companyContext.CompanyId;
                }
            }
        }

        return base.SaveChanges();
    }
}
