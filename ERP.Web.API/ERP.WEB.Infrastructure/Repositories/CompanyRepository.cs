using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Repositories;

public class CompanyRepository : ICompanyRepository
{
    private readonly ApplicationDbContext _context;

    public CompanyRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Company>> GetAllAsync(CursorParams p, CancellationToken ct = default)
    {
        var afterId = CursorHelper.Decode(p.Cursor) ?? 0;
        return await _context.Companies
            .Where(p => p.CompanyId > afterId)
            .OrderBy(p => p.CompanyId)
            .Take(p.PageSize + 1)
            .ToListAsync(ct);
    }

    public async Task<Company?> GetByIdAsync(int id)
    {
        return await _context.Companies.FindAsync(id);
    }

    public async Task<Company?> GetBySlugAsync(string slug)
    {
        return await _context.Companies.FirstOrDefaultAsync(p => p.Slug == slug);
    }

    public async Task<Company> AddAsync(Company company)
    {
        _context.Companies.Add(company);
        await _context.SaveChangesAsync();
        return company;
    }

    public async Task UpdateAsync(Company company)
    {
        _context.Companies.Update(company);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var company = await _context.Companies.FindAsync(id);
        if (company is not null)
        {
            company.IsActive = false;
            await _context.SaveChangesAsync();
        }
    }
}
