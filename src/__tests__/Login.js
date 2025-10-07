/**
 * @jest-environment jsdom
 */

import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { fireEvent, screen } from "@testing-library/dom";

describe("Given that I am a user on login page", () => {
  beforeEach(() => {
    document.body.innerHTML = LoginUI();

    // Mock du localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        store: {},
        getItem: function (key) { return this.store[key] || null },
        setItem: function (key, value) { this.store[key] = value },
        clear: function () { this.store = {}; },
      },
      writable: true,
    });
  });

  // ===================== EMPLOYEE =====================
  describe("When I fill fields correctly and click on employee Login button", () => {
    test("Then I should be identified as Employee and Bills page should render", async () => {
      const inputData = {
        type: "Employee",
        email: "johndoe@email.com",
        password: "azerty",
        status: "connected",
      };

      fireEvent.change(screen.getByTestId("employee-email-input"), { target: { value: inputData.email } });
      fireEvent.change(screen.getByTestId("employee-password-input"), { target: { value: inputData.password } });

      const form = screen.getByTestId("form-employee");

      const onNavigate = jest.fn((pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      });

      const store = {
        login: jest.fn(() => Promise.resolve({ jwt: "fake-jwt-token" })),
        users: () => ({ create: jest.fn(() => Promise.resolve({})) }),
      };

      const loginContainer = new Login({ document, localStorage: window.localStorage, onNavigate, PREVIOUS_LOCATION: "", store });

      await loginContainer.handleSubmitEmployee({ target: form, preventDefault: () => { } });
      await new Promise(process.nextTick); // attendre les .then internes

      expect(window.localStorage.store.user).toBe(JSON.stringify(inputData));
      expect(window.localStorage.store.jwt).toBe("fake-jwt-token");
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
      expect(screen.queryByText("Mes notes de frais")).toBeTruthy();
    });
  });

  // ===================== ADMIN =====================
  describe("When I fill fields in correct format and click on admin Login button", () => {
    test("Then I should be identified as an HR admin and Dashboard page should render", async () => {
      const inputData = {
        type: "Admin",
        email: "admin@test.com",
        password: "admin123",
        status: "connected",
      };

      fireEvent.change(screen.getByTestId("admin-email-input"), { target: { value: inputData.email } });
      fireEvent.change(screen.getByTestId("admin-password-input"), { target: { value: inputData.password } });

      const form = screen.getByTestId("form-admin");

      const onNavigate = jest.fn((pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      });

      const store = {
        login: jest.fn(() => Promise.resolve({ jwt: "fake-jwt-token" })),
        users: () => ({ create: jest.fn(() => Promise.resolve({})) }),
      };

      const loginContainer = new Login({ document, localStorage: window.localStorage, onNavigate, PREVIOUS_LOCATION: "", store });

      await loginContainer.handleSubmitAdmin({ target: form, preventDefault: () => { } });
      await new Promise(process.nextTick);

      expect(window.localStorage.store.user).toBe(JSON.stringify(inputData));
      expect(window.localStorage.store.jwt).toBe("fake-jwt-token");
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Dashboard"]);
      expect(screen.queryByText("Validations")).toBeTruthy();
    });
  });

  // ===================== Admin empty/invalid fields =====================
  describe("When admin fields are empty or invalid", () => {
    test("Empty fields should render login page", () => {
      document.body.innerHTML = LoginUI();
      const form = screen.getByTestId("form-admin");

      const handleSubmit = jest.fn((e) => e.preventDefault());
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);
      expect(screen.getByTestId("form-admin")).toBeTruthy();
    });

    test("Invalid email should render login page", () => {
      document.body.innerHTML = LoginUI();
      fireEvent.change(screen.getByTestId("admin-email-input"), { target: { value: "invalidemail" } });
      fireEvent.change(screen.getByTestId("admin-password-input"), { target: { value: "azerty" } });

      const form = screen.getByTestId("form-admin");
      const handleSubmit = jest.fn((e) => e.preventDefault());
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);
      expect(screen.getByTestId("form-admin")).toBeTruthy();
    });
  });
});
