using ERP.WEB.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Consumption> Consumptions => Set<Consumption>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Active");
            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(e => e.CategoryId)
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
            entity.HasOne(e => e.Product)
                  .WithOne(p => p.Inventory)
                  .HasForeignKey<Inventory>(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
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
}
