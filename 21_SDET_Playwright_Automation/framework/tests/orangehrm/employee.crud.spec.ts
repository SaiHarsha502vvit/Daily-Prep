import { test, expect } from '../../fixtures/orangehrm.fixture';
import {
  generateEmployeeData,
  generateEmployeeUpdateData,
} from '../../utilities/data/employee.factory';

/**
 * Employee CRUD lifecycle — three tests wrapped in `describe.serial` because
 * edit and delete depend on the prior creation's externally-visible Employee Id.
 *
 * KNOWN LIMITATION: the OrangeHRM open-source demo
 * (opensource-demo.orangehrmlive.com) does not reliably persist custom Employee
 * Id values — save returns 200 OK, the redirect to viewPersonalDetails works,
 * but the external Id we typed is sometimes silently dropped, so the search at
 * the end of the @smoke add test misses the row. That breaks the whole chain.
 *
 * Until the test target moves to an OrangeHRM instance under our control, the
 * whole serial block is marked fixme. The code stays as a teaching example of
 * the proper shape (`describe.serial` + module-level data accumulator + null-
 * guarded skip on dependents). Un-fixme the block when running against a real
 * OrangeHRM where you can verify the Employee Id round-trips.
 */
// Using `describe.fixme` rather than `describe.serial` because every test in
// the block is currently fixme'd anyway — the serial ordering only matters once
// the block is un-fixme'd against a real OrangeHRM instance. When that day
// comes, switch this line to `test.describe.serial(...)` and the dependent
// `test.skip(!createdEmployeeId, ...)` guards become the safety net.
test.describe.fixme('Employee CRUD Lifecycle', () => {
  let createdEmployeeId: string | null = null;

  test.beforeEach(async ({ loginPage, dashboardPage }) => {
    await loginPage.navigate();
    await loginPage.loginWith({
      username: process.env.ORANGEHRM_DEMO_USERNAME ?? 'Admin',
      password: process.env.ORANGEHRM_DEMO_PASSWORD ?? 'admin123',
    });
    await dashboardPage.expectLoaded();
  });

  test('@regression add employee and verify presence', async ({
    employeeListPage,
    addEmployeePage,
  }) => {
    const employee = generateEmployeeData();

    await employeeListPage.navigate();
    await employeeListPage.clickAddEmployee();
    await addEmployeePage.expectLoaded();
    await addEmployeePage.fillEmployeeDetails(employee);
    await addEmployeePage.save();

    await employeeListPage.navigate();
    await employeeListPage.searchForm.searchById(employee.employeeId);
    await employeeListPage.resultsGrid.expectAtLeastOneRecord();

    createdEmployeeId = employee.employeeId;
  });

  test('@regression edit existing employee personal details', async ({
    employeeListPage,
    employeePersonalDetailsPage,
  }) => {
    test.skip(!createdEmployeeId, 'Add-employee test did not complete');

    await employeeListPage.navigate();
    await employeeListPage.searchForm.searchById(createdEmployeeId!);
    await employeeListPage.resultsGrid.expectAtLeastOneRecord();
    await employeeListPage.resultsGrid.editFirstRecord();
    await employeePersonalDetailsPage.expectLoaded();

    const update = generateEmployeeUpdateData({ nationality: 'Indian', maritalStatus: 'Married' });
    await employeePersonalDetailsPage.updatePersonalDetails(update);
    await employeePersonalDetailsPage.save();

    await expect(employeePersonalDetailsPage.savePersonalDetailsButton).toBeVisible({
      timeout: 10000,
    });
  });

  test('@regression delete employee after creation', async ({ employeeListPage }) => {
    test.skip(!createdEmployeeId, 'Add-employee test did not complete');

    await employeeListPage.navigate();
    await employeeListPage.searchForm.searchById(createdEmployeeId!);
    await employeeListPage.resultsGrid.expectAtLeastOneRecord();
    await employeeListPage.resultsGrid.deleteFirstRecord();
    await employeeListPage.resultsGrid.confirmDeletion();

    await employeeListPage.searchForm.searchById(createdEmployeeId!);
    await employeeListPage.resultsGrid.expectNoRecords();
    createdEmployeeId = null;
  });
});
