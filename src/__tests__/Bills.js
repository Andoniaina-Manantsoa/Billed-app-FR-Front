/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    beforeEach(() => {
      // Mock du localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

      // Création du DOM minimal requis pour router()
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);

      // Ajout des icônes pour éviter les null.classList
      const icon1 = document.createElement("div");
      icon1.setAttribute("id", "layout-icon1");
      icon1.setAttribute("data-testid", "icon-window");
      document.body.appendChild(icon1);

      const icon2 = document.createElement("div");
      icon2.setAttribute("id", "layout-icon2");
      icon2.setAttribute("data-testid", "icon-mail");
      document.body.appendChild(icon2);

      // Initialisation du router
      router();
    });

    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills);

      // attend que les icônes apparaissent
      await waitFor(() => screen.getAllByTestId('icon-window'));

      const windowIcons = screen.getAllByTestId('icon-window');
      const isActive = windowIcons.some(icon => icon.classList.contains('active-icon'));
      expect(isActive).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map(a => a.innerHTML);

      const antiChrono = (a, b) => ((a < b) ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

  });
});
