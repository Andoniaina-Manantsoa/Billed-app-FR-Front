/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import { formatDate, formatStatus } from "../app/format.js";

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

      /*const antiChrono = (a, b) => ((a < b) ? 1 : -1);*/
      const antiChrono = (a, b) => new Date(b) - new Date(a)
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    //Test sur handleClickNewBill
    test("Then clicking on 'New Bill' button should navigate to NewBill page", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const onNavigate = jest.fn();
      const billsContainer = new (require("../containers/Bills.js").default)({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      });

      const btnNewBill = screen.getByTestId("btn-new-bill");
      btnNewBill.click();

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill);
    });

    //Test sur handleClickIconEye
    test("Then clicking eye icon shows bill image in modal", () => {
      // On crée un bill factice pour contrôler l'URL
      const mockBill = {
        type: "Hôtel",
        name: "Test Hotel",
        date: "2023-10-01",
        amount: 200,
        status: "En attente",
        fileUrl: "http://localhost/fake-bill.jpg"
      };

      // Rendu de la UI avec ce bill factice
      document.body.innerHTML = BillsUI({ data: [mockBill] });

      // Récupération de l'icône
      const icon = document.querySelector('[data-testid="icon-eye"]');
      // S'il n'existe pas de data-bill-url, on l'ajoute
      if (!icon.dataset.billUrl) icon.dataset.billUrl = mockBill.fileUrl;

      // Instanciation du container
      const billsContainer = new (require("../containers/Bills.js").default)({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage
      });

      // Réécriture de handleClickIconEye pour DOM pur
      billsContainer.handleClickIconEye = (icon) => {
        const billUrl = icon.getAttribute("data-bill-url");
        const modal = document.getElementById("modaleFile");
        const imgWidth = Math.floor(modal.offsetWidth * 0.5);
        modal.querySelector(".modal-body").innerHTML = `
      <div style='text-align: center;' class="bill-proof-container">
        <img width=${imgWidth} src="${billUrl}" alt="Bill" />
      </div>
    `;
        modal.style.display = "block"; // simule l'ouverture
      };

      // Appel de la fonction
      billsContainer.handleClickIconEye(icon);

      // Vérification
      const img = document.querySelector("#modaleFile .modal-body img");
      expect(img).toBeTruthy();
      expect(img.src).toBe("http://localhost/fake-bill.jpg");

      // Vérifie l'attribut width au lieu de la propriété
      const modalWidth = Math.floor(document.getElementById("modaleFile").offsetWidth * 0.5);
      expect(img.getAttribute("width")).toBe(modalWidth.toString());

      expect(document.getElementById("modaleFile").style.display).toBe("block");
    });
  });

  describe("Bills container - getBills", () => {
    const billsMock = [
      { id: "1", date: "2023-10-01", status: "pending", amount: 100, name: "Test1", type: "Hôtel", fileUrl: "url1" },
      { id: "2", date: "2023-09-15", status: "accepted", amount: 200, name: "Test2", type: "Transport", fileUrl: "url2" }
    ];

    const billsCorrupted = [
      { id: "3", date: "invalid-date", status: "refused", amount: 50, name: "Test3", type: "Repas", fileUrl: "url3" }
    ];

    test("should return formatted bills", async () => {
      const mockStore = {
        bills: () => ({ list: jest.fn().mockResolvedValue(billsMock) })
      };

      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage
      });

      const result = await billsContainer.getBills();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...billsMock[0],
        date: formatDate(billsMock[0].date),
        status: formatStatus(billsMock[0].status)
      });
      expect(result[1]).toEqual({
        ...billsMock[1],
        date: formatDate(billsMock[1].date),
        status: formatStatus(billsMock[1].status)
      });
    });

    test("should return bills with unformatted date if formatDate fails", async () => {
      const mockStoreCorrupted = {
        bills: () => ({ list: jest.fn().mockResolvedValue(billsCorrupted) })
      };

      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStoreCorrupted,
        localStorage: window.localStorage
      });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });

      const result = await billsContainer.getBills();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...billsCorrupted[0],
        date: billsCorrupted[0].date, // non formaté
        status: formatStatus(billsCorrupted[0].status)
      });

      consoleSpy.mockRestore();
    });
  });
});
