using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Repositories;

public class TagRepository : ITagRepository
{
    private readonly ApplicationDbContext _context;

    public TagRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Tag>> GetAllAsync(CursorParams p, CancellationToken ct = default)
    {
        var afterId = CursorHelper.Decode(p.Cursor) ?? 0;
        return await _context.Tags
            .Where(t => t.TagId > afterId)
            .Include(t => t.Products)
            .OrderBy(t => t.TagId)
            .Take(p.PageSize + 1)
            .ToListAsync(ct);
    }

    public async Task<Tag?> GetByIdAsync(int id)
    {
        return await _context.Tags
            .Include(t => t.Products)
            .FirstOrDefaultAsync(t => t.TagId == id);
    }

    public async Task<IEnumerable<Tag>> GetByProductIdAsync(int productId)
    {
        return await _context.Tags
            .Include(t => t.Products)
            .Where(t => t.Products.Any(p => p.ProductId == productId))
            .ToListAsync();
    }

    public async Task<Tag> AddAsync(Tag tag)
    {
        _context.Tags.Add(tag);
        await _context.SaveChangesAsync();
        return tag;
    }

    public async Task UpdateAsync(Tag tag)
    {
        _context.Tags.Update(tag);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var tag = await _context.Tags.FindAsync(id);
        if (tag is not null)
        {
            _context.Tags.Remove(tag);
            await _context.SaveChangesAsync();
        }
    }

    public async Task AddTagToProductAsync(int tagId, int productId)
    {
        var tag = await _context.Tags
            .Include(t => t.Products)
            .FirstOrDefaultAsync(t => t.TagId == tagId);

        var product = await _context.Products.FindAsync(productId);

        if (tag is not null && product is not null && !tag.Products.Any(p => p.ProductId == productId))
        {
            tag.Products.Add(product);
            await _context.SaveChangesAsync();
        }
    }

    public async Task RemoveTagFromProductAsync(int tagId, int productId)
    {
        var tag = await _context.Tags
            .Include(t => t.Products)
            .FirstOrDefaultAsync(t => t.TagId == tagId);

        var product = tag?.Products.FirstOrDefault(p => p.ProductId == productId);

        if (tag is not null && product is not null)
        {
            tag.Products.Remove(product);
            await _context.SaveChangesAsync();
        }
    }
}
