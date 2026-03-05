// Disable parallel execution across all test collections in this assembly.
// Integration tests share a single SQL Server database (erptest) and each
// test class wipes + re-seeds data during setup — parallelism would cause
// race conditions on the same tables.
[assembly: Xunit.CollectionBehavior(DisableTestParallelization = true)]
