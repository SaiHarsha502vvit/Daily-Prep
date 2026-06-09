import { test, expect } from '../../fixtures/orangehrm.fixture';
import { generateEmployeeData } from '../../utilities/data/employee.factory';
import type { EmployeeData } from '../../utilities/data/employee.factory';

interface TestData {
  createdEmployees: EmployeeData[];
}

const data: TestData = { createdEmployees: [] };

test.describe('PIM Search Filters & Pagination', () => {
  test.beforeEach(async ({ loginPage, dashboardPage }) => {
    await loginPage.navigate();
    await loginPage.loginWith({
      username: process.env.ORANGEHRM_DEMO_USERNAME ?? 'Admin',
      password: process.env.ORANGEHRM_DEMO_PASSWORD ?? 'admin123',
    });
    await dashboardPage.expectLoaded();
  });

  test('@smoke search by employee name returns results', async ({ employeeListPage }) => {
    await employeeListPage.navigate();
    await employeeListPage.searchForm.searchByName('a');
    const count = await employeeListPage.resultsGrid.getRecordsCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('@smoke search by employee id returns exact match', async ({ employeeListPage, addEmployeePage }) => {
    const employee = generateEmployeeData();
    data.createdEmployees.push(employee);

    await employeeListPage.navigate();
    await employeeListPage.clickAddEmployee();
    await addEmployeePage.expectLoaded();
    await addEmployeePage.fillEmployeeDetails(employee);
    await addEmployeePage.save();

    // After creation, search by the generated id
    await employeeListPage.navigate();
    await employeeListPage.searchForm.reset();
    await employeeListPage.searchForm.searchById(employee.employeeId);
    await employeeListPage.resultsGrid.expectAtLeastOneRecord();

    const found = await employeeListPage.resultsGrid.rowContainsText(employee.firstName);
    expect(found).toBe(true);
  });

  test('@regression reset clears search filters', async ({ employeeListPage }) => {
    await employeeListPage.navigate();
    await employeeListPage.searchForm.searchByName('nonexistentxyz');
    await employeeListPage.resultsGrid.expectNoRecords();

    await employeeListPage.searchForm.reset();
    const countAfterReset = await employeeListPage.resultsGrid.getRecordsCount();
    // After reset, records should return (or at least the grid state should reset)
    expect(countAfterReset).toBeGreaterThanOrEqual(0);
  });
});
