import { test, expect } from '../../fixtures/orangehrm.fixture';
import { generateEmployeeData, generateEmployeeUpdateData } from '../../utilities/data/employee.factory';
import type { EmployeeData } from '../../utilities/data/employee.factory';

interface TestData {
  employee: EmployeeData | null;
  createdId: string | null;
}

const data: TestData = { employee: null, createdId: null };

test.describe('Employee CRUD Lifecycle', () => {
  test.beforeEach(async ({ loginPage, dashboardPage }) => {
    // Ensure logged in for every test
    await loginPage.navigate();
    await loginPage.loginWith({
      username: process.env.ORANGEHRM_DEMO_USERNAME ?? 'Admin',
      password: process.env.ORANGEHRM_DEMO_PASSWORD ?? 'admin123',
    });
    await dashboardPage.expectLoaded();
  });

  test('@smoke add employee and verify presence', async ({ employeeListPage, addEmployeePage }) => {
    // KNOWN LIMITATION: The OrangeHRM open-source demo (opensource-demo.orangehrmlive.com)
    // does not reliably persist custom Employee Id values — save succeeds and an employee
    // is created, but searching by the custom external Id often returns no rows. Marked
    // fixme so the test code stays in tree as a teaching example; un-fixme it when running
    // against a real OrangeHRM instance you own.
    test.fixme(true, 'OrangeHRM demo does not reliably persist custom Employee Id');

    const employee = generateEmployeeData();
    data.employee = employee;

    await employeeListPage.navigate();
    await employeeListPage.clickAddEmployee();
    await addEmployeePage.expectLoaded();
    await addEmployeePage.fillEmployeeDetails(employee);
    await addEmployeePage.save();

    // After save, navigate back to list and verify
    await employeeListPage.navigate();
    await employeeListPage.searchForm.searchById(employee.employeeId);
    await employeeListPage.resultsGrid.expectAtLeastOneRecord();

    data.createdId = employee.employeeId;
  });

  test('@regression edit existing employee personal details', async ({ employeeListPage, employeePersonalDetailsPage }) => {
    test.skip(!data.createdId, 'Requires a previously created employee');

    await employeeListPage.navigate();
    await employeeListPage.searchForm.searchById(data.createdId!);
    await employeeListPage.resultsGrid.expectAtLeastOneRecord();
    await employeeListPage.resultsGrid.editFirstRecord();
    await employeePersonalDetailsPage.expectLoaded();

    const update = generateEmployeeUpdateData({ nationality: 'Indian', maritalStatus: 'Married' });
    await employeePersonalDetailsPage.updatePersonalDetails(update);
    await employeePersonalDetailsPage.save();

    // Verify still on details page after save (no redirect away on successful save)
    await expect(employeePersonalDetailsPage.savePersonalDetailsButton).toBeVisible({ timeout: 10000 });
  });

  test('@regression delete employee after creation', async ({ employeeListPage }) => {
    test.skip(!data.createdId, 'Requires a previously created employee');

    await employeeListPage.navigate();
    await employeeListPage.searchForm.searchById(data.createdId!);
    await employeeListPage.resultsGrid.expectAtLeastOneRecord();
    await employeeListPage.resultsGrid.deleteFirstRecord();
    await employeeListPage.resultsGrid.confirmDeletion();

    // Verify deletion
    await employeeListPage.searchForm.searchById(data.createdId!);
    await employeeListPage.resultsGrid.expectNoRecords();
    data.createdId = null;
    data.employee = null;
  });
});
