/**
 * AdminCustomerCreatePage — Page Object for the admin portal's customer creation UI.
 *
 * Architecture (Law 3 — Layered imports):
 *   Spec → POM → helpers → constants
 *
 * This POM wraps the OrangeHRM admin UI for customer creation actions.
 * OrangeHRM has an "Employee" PIM module that serves as our "customer" proxy.
 */
import { type Page, type Locator, expect } from "@playwright/test";
import {
  clickElement,
  fillInput,
  safeNavigate,
} from "../../../utilities/helpers/action.helpers";
import { APP } from "../../../constants/app.constants";
import { Timeouts } from "../../../constants/timeouts";

export class AdminCustomerCreatePage {
  readonly page: Page;

  // Locators (UI layer — one source of truth for selectors)
  private readonly locators = {
    usernameInput: "input[name='username']",
    passwordInput: "input[name='password']",
    loginButton: { role: "button" as const, name: "Login" },
    pimNavItem: 'a[href="/web/index.php/pim/viewEmployeeList"]',
    addEmployeeButton: 'button:has-text("Add")',
    firstNameInput: "input[name='firstName']",
    lastNameInput: "input[name='lastName']",
    employeeIdInput: "input[name='employeeId']",
    saveButton: { role: "button" as const, name: "Save" },
    successToast: ".oxd-toast--success",
  };

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly pimNavItem: Locator;
  readonly addEmployeeButton: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly employeeIdInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator(this.locators.usernameInput);
    this.passwordInput = page.locator(this.locators.passwordInput);
    this.loginButton = page.getByRole(this.locators.loginButton.role, {
      name: this.locators.loginButton.name,
    });
    this.pimNavItem = page.locator(this.locators.pimNavItem);
    this.addEmployeeButton = page.locator(this.locators.addEmployeeButton);
    this.firstNameInput = page.locator(this.locators.firstNameInput);
    this.lastNameInput = page.locator(this.locators.lastNameInput);
    this.employeeIdInput = page.locator(this.locators.employeeIdInput);
    this.saveButton = page.getByRole(this.locators.saveButton.role, {
      name: this.locators.saveButton.name,
    });
  }

  async goto(): Promise<void> {
    const url = `${APP.orangehrm.baseUrl}/web/index.php/auth/login`;
    await safeNavigate(this.page, url, "Admin login page");
    await this.usernameInput.waitFor({
      state: "visible",
      timeout: Timeouts.THIRTY_SECONDS,
    });
  }

  async loginAsAdmin(username: string, password: string): Promise<void> {
    await fillInput(this.usernameInput, username, {
      description: "admin username",
    });
    await fillInput(this.passwordInput, password, {
      description: "admin password",
    });
    await clickElement(this.loginButton, { description: "admin login submit" });
    await this.page.waitForURL(/dashboard/, {
      timeout: Timeouts.THIRTY_SECONDS,
    });
  }

  async navigateToAddEmployee(): Promise<void> {
    await clickElement(this.pimNavItem, { description: "PIM navigation item" });
    await clickElement(this.addEmployeeButton, {
      description: "add employee button",
    });
  }

  async createEmployee(firstName: string, lastName: string): Promise<string> {
    await fillInput(this.firstNameInput, firstName, {
      description: "employee first name",
    });
    await fillInput(this.lastNameInput, lastName, {
      description: "employee last name",
    });

    // Capture auto-generated ID before saving
    const empId = await this.employeeIdInput.inputValue();

    await clickElement(this.saveButton, { description: "save employee" });

    // Wait for success toast to confirm creation
    const toast = this.page.locator(this.locators.successToast);
    await expect(toast).toBeVisible({ timeout: Timeouts.TEN_SECONDS });

    return empId;
  }
}
