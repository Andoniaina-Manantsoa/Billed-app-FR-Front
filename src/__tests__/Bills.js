/**
 * @jest-environment jsdom
 */

import mockStore from "../__mocks__/store"
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import Bills from "../containers/Bills.js"
import userEvent from "@testing-library/user-event"
import router from "../app/Router.js"
import { formatDate, formatStatus } from "../app/format.js";
import "@testing-library/jest-dom"

jest.mock("../app/store", () => mockStore)

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  describe("Quand je suis sur la page Factures", () => {

    //----test d'intégration-----//
    test("Ensuite, l'icône de la facture dans la disposition verticale doit être mise en surbrillance", async () => {

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      // cf _mocks_ / localStorage.js : useur = Employee
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      // création d'une div id="root"
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      // P.M. import router from "../app/Router.js"
      router();

      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      // Récuprére l'élément icon
      const windowIcon = screen.getByTestId("icon-window");

      /**
       * -----------------Ajout de "expect"--------------------------------------
       */
      //Vérifie si icon-window existe
      expect(windowIcon).toBeTruthy();
      //vérifie s'il y a bein la class active-icon'
      expect(windowIcon.classList).toContain('active-icon');
      /**
       * ------------------------------------------------------------------------
       */
    });

    //----test unitaire-----//
    test("Ensuite, les factures doivent être commandées du plus ancien au plus tard", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        ) //format yyyy mm dd
        .map((a) => a.innerHTML);

      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    // Tests unitaires
    /**
     * Loadin test
     */
    describe("Lorsque je suis sur la page Factures mais qu'elle est en cours de chargement", () => {
      test(("Ensuite, la page de chargement devrait être rendue"), () => {
        // configure le body du document
        document.body.innerHTML = BillsUI({ loading: true })

        // récupére le texte et vérifie qu'il est vraie (existe)
        const loadingMessage = screen.getAllByText('Loading...')
        expect(loadingMessage).toBeTruthy()
      })
    })
    /**
      * Erreur test
      */
    describe("Lorsque je suis sur la page Factures et que le back-end envoie un message d'erreur", () => {
      test(("Ensuite, la page d'erreur devrait être rendue"), () => {
        // configure le body du document
        document.body.innerHTML = BillsUI({ error: true })

        // récupére la div et vérifie qu'elle' est vraie (existe)
        const divError = screen.getByTestId('error-message')
        expect(divError).toBeTruthy()

        // récupére le texte et vérifie qu'il est vraie (existe)
        const erreurMessage = screen.getAllByText('Erreur')
        expect(erreurMessage).toBeTruthy()
      })
    })
    /**
     * Bills test
     */
    //----test unitaire-----//
    test('Ensuite, les factures sont affichées il y a des factures', () => {
      // configure le body du document
      document.body.innerHTML = BillsUI({ data: bills })

      // récupére les div et vérifie qu'elles sont vraies (existes) et qu'il y à au moins 1 élément 
      const iconEyes = screen.getAllByTestId('icon-eye')
      expect(iconEyes).toBeTruthy()
      expect(iconEyes.length).toBeGreaterThan(1)

      // récupére l'élément tbodyv et vérifie qu'qu'il nest pas vide 
      const tbody = screen.getByTestId("tbody")
      expect(tbody.innerHTML).not.toBe("")

    })

    //----test d'intégration-----//
    /**
    * New Bill page test
    */
    describe("Quand je clique sur le bouton nouvelle facture", () => {
      test("Ensuite, le nouveau projet de loi modal devrait s'ouvrir", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const bill = new Bills({
          document,
          onNavigate,
          mockStore,
          localStorage: window.localStorage,
        });

        const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e));
        const buttonNewBill = screen.getByTestId("btn-new-bill");
        buttonNewBill.addEventListener("click", handleClickNewBill);
        userEvent.click(buttonNewBill);
        expect(handleClickNewBill).toHaveBeenCalled();
        expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
        expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      });
    });

    /**
  * Modal test
  */
    test(("Ensuite, je clique sur iconEye et un modal devrait être ouvert"), () => {
      /**
      * On verifie que la modale s'ouvre lors du click sur l'icone "eye"
      **/

      // Init onNavigate
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      // UI Construction
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      // Init store
      const store = null
      const billsUIContainer = new Bills({
        document, onNavigate, store, localStorage: window.localStorage
      })

      // configure le body du document
      document.body.innerHTML = BillsUI({ data: bills })

      // Mock lafonction modal
      $.fn.modal = jest.fn();

      // Récupère le premier boutton eye
      const iconEye = screen.getAllByTestId("icon-eye")[0];

      //Mock la fonction handleClickIconEye den Bills.js , line : 23
      const handleClickIconEyeButton = jest.fn(billsUIContainer.handleClickIconEye(iconEye))

      // écoute le boutton et simule un click
      iconEye.addEventListener('click', handleClickIconEyeButton)
      userEvent.click(iconEye)

      const modale = document.getElementById("modaleFile");

      // vérifie que handleClickIconEye est appellée
      expect(handleClickIconEyeButton).toHaveBeenCalled()

      //On vérifie que la modale est visible dans la DOM
      expect(modale).toBeTruthy()

      //On vérifie que la fonction modale est appellée
      expect($.fn.modal).toHaveBeenCalled()
    })
  })

});

/**
 * -----ajout nouveaux tests --------------
 * -----------------------------------------
 */

//----test d'intégration-----//
describe("Quand je clique sur le bouton nouvelle facture", () => {
  test("Ensuite, le nouveau projet de loi modal devrait s'ouvrir", () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    const bill = new Bills({
      document,
      onNavigate,
      mockStore,
      localStorage: window.localStorage,
    });

    const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e));
    const buttonNewBill = screen.getByTestId("btn-new-bill");
    buttonNewBill.addEventListener("click", handleClickNewBill);
    userEvent.click(buttonNewBill);
    expect(handleClickNewBill).toHaveBeenCalled();
    expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    expect(screen.getByTestId("form-new-bill")).toBeTruthy();
  });
});

//----test d'intégration-----//
describe("Quand je clique sur une icone oeil", () => {
  test("Un modal devrait s'ouvrir avec une preuve de facture", () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    document.body.innerHTML = BillsUI({ data: bills });
    $.fn.modal = jest.fn();

    const bill = new Bills({
      document,
      onNavigate,
      mockStore,
      localStorage: window.localStorage,
    });

    const iconEye = screen.getAllByTestId("icon-eye");
    const handleClickIconEye = jest.fn((icon) =>
      bill.handleClickIconEye(icon)
    );
    iconEye.forEach((icon) => {
      icon.addEventListener("click", (e) => handleClickIconEye(icon));
      userEvent.click(icon);
    });

    expect(handleClickIconEye).toHaveBeenCalled();
    expect(screen.getAllByText("Justificatif")).toBeTruthy();
  });
});

// test d'intégration GET (PM. requêtes HTTP onnées à envoyer au serveur sont écrites directement dans l’URL)
describe("Etant donné que je suis un utilisateur connecté en tant que Employée", () => {
  describe("Lorsque j'accède à la page Notes de Frais", () => {

    //----test d'intégration-----//
    test("récupère les Notes de Frais de l'API simulée GET", async () => {
      // cf _mocks_ / localStorage.js : useur = Employee
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      // création d'une div id="root"
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      // P.M. import router from "../app/Router.js"
      //Active le routeur pour configurer la page
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() =>
        expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      );
    });

    //----test d'intégration-----//
    test('si magasin, devrait afficher les factures avec la date et le statut du bon format ', async () => {

      const billsUIContainer = new Bills({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      const data = await billsUIContainer.getBills()

      const mockedBills = await mockStore.bills().list()

      expect(data[0].date).toEqual(formatDate(mockedBills[0].date))
      console.log(data[0].date)
      console.log(mockedBills[0].date)

      expect(data[0].status).toEqual(formatStatus(mockedBills[0].status))
      console.log(data[0].status)
      console.log(mockedBills[0].status)
    })

    test('si le magasin, si des données corrompues ont été introduites, doit enregistrer erreur et renvoyer une date non formatée dans ce cas', async () => {
      const store = {
        bills() {
          return {
            list() {
              return Promise.resolve([{
                "id": "47qAXb6fIm2zOKkLzMro",
                "vat": "80",
                "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
                "status": "pending",
                "type": "Hôtel et logement",
                "commentary": "séminaire billed",
                "name": "encore",
                "fileName": "preview-facture-free-201801-pdf-1.jpg",
                "date": "2004-04-x",
                "amount": 400,
                "commentAdmin": "ok",
                "email": "a@a",
                "pct": 20
              }])
            },
          }
        }
      }

      const billsUIContainer = new Bills({
        document, onNavigate, store, localStorage: window.localStorage
      })

      const consoleLog = jest.spyOn(console, 'log')
      const data = await billsUIContainer.getBills()

      expect(consoleLog).toHaveBeenCalled()
      expect(data[0].date).toEqual('2004-04-x')
      console.log(data[0].date)
      expect(data[0].status).toEqual('En attente')
    });

    //----test d'intégration-----//
    describe("Lorsqu'une erreur se produit sur l'API", () => {
      beforeEach(() => {
        /*
      * jest.spyOn :Crée une fonction simulée similaire à jest.fn mais qui surveille également
      * les appels à objet[methodName]. Retourne une fonction simulée de Jest.
      */
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      test("récupère les factures d'une API et échoue avec une erreur de message 404", async () => {
        /*
         *mockImplementationOnce : Accepte une fonction qui sera utilisée comme une implémentation de simulation pour
         * un appel à la fonction simulée. Peut être enchaîné de sorte que plusieurs appels de 
         * fonction produisent des résultats différents.
         */
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));//valeur dans la list il y a un erreur
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();//Verification si le message erreur 404 est apparu ou pas
      });

      test("récupère les messages d'une API et échoue avec une erreur de message 500", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});