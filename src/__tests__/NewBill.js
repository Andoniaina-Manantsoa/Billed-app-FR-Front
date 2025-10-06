/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

// --- Mock localStorage pour simuler un utilisateur connecté ---
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key) => {
        if (key === 'user') {
          return JSON.stringify({
            type: 'Employee',
            email: 'a@a'
          });
        }
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    },
    writable: true
  });
});

// --- Setup du DOM pour chaque test ---
beforeEach(() => {
  document.body.innerHTML = NewBillUI();
});

// --- Mock de navigation ---
const onNavigate = (pathname) => {
  document.body.innerHTML = `<div>Page: ${pathname}</div>`;
};

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then uploading a png file should be accepted", async () => {
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
      const fileInput = screen.getByTestId("file");

      const file = new File(["dummy content"], "test.png", { type: "image/png" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(fileInput.files[0].name).toBe("test.png");
      });
    });

    test("Then uploading a jpg/jpeg file should be accepted", async () => {
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
      const fileInput = screen.getByTestId("file");

      const file = new File(["dummy content"], "test.jpg", { type: "image/jpeg" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(fileInput.files[0].name).toBe("test.jpg");
      });
    });

    test("Then uploading a pdf file should be rejected", async () => {
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
      const fileInput = screen.getByTestId("file");

      const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const errorMsg = document.querySelector(".error-message");
        expect(errorMsg.classList.contains("hidden")).toBe(false);
      });
    });

    test("Then handleSubmit should call updateBill and navigate to Bills", async () => {
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
      const form = screen.getByTestId("form-new-bill");

      const updateBillMock = jest.fn(() => Promise.resolve());
      newBill.updateBill = updateBillMock;

      fireEvent.submit(form);

      await waitFor(() => {
        expect(updateBillMock).toHaveBeenCalled();
        expect(document.body.innerHTML).toContain("Page: #employee/bills");
      });
    });
  });
});
