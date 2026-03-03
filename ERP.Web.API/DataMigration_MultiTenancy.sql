-- ============================================================================
-- DATA MIGRATION: Multi-Tenancy Setup
-- Run AFTER applying the EF migration (dotnet ef database update)
-- ============================================================================

-- 1. Insert default Company
IF NOT EXISTS (SELECT 1 FROM Companies WHERE Slug = 'main')
BEGIN
    INSERT INTO Companies (Name, Slug, Description, IsActive, CreatedAt)
    VALUES ('Main Company', 'main', 'Default company - all existing data', 1, GETUTCDATE());
    PRINT 'Default company created.';
END

-- Get the default Company ID
DECLARE @DefaultCompanyId INT = (SELECT CompanyId FROM Companies WHERE Slug = 'main');
PRINT 'Default Company ID: ' + CAST(@DefaultCompanyId AS VARCHAR);

-- 2. Assign all existing rows to the default company
UPDATE Products      SET CompanyId = @DefaultCompanyId WHERE CompanyId = 0;
UPDATE Categories    SET CompanyId = @DefaultCompanyId WHERE CompanyId = 0;
UPDATE Brands        SET CompanyId = @DefaultCompanyId WHERE CompanyId = 0;
UPDATE Inventory     SET CompanyId = @DefaultCompanyId WHERE CompanyId = 0;
UPDATE Tags          SET CompanyId = @DefaultCompanyId WHERE CompanyId = 0;
UPDATE Promotions    SET CompanyId = @DefaultCompanyId WHERE CompanyId = 0;
UPDATE Product_Images SET CompanyId = @DefaultCompanyId WHERE CompanyId = 0;
UPDATE Users         SET CompanyId = @DefaultCompanyId WHERE CompanyId = 0;
UPDATE Consumptions  SET CompanyId = @DefaultCompanyId WHERE CompanyId = 0;

PRINT 'All existing data assigned to default company.';

-- 3. Mark the first Admin user as SuperAdmin
UPDATE Users
SET IsSuperAdmin = 1
WHERE Role = 'Admin'
  AND UserId = (SELECT TOP 1 UserId FROM Users WHERE Role = 'Admin' ORDER BY UserId);

PRINT 'First admin user marked as SuperAdmin.';
PRINT 'Data migration complete!';
