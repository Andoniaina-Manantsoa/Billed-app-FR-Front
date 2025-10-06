import { ROUTES_PATH } from "../constants/routes.js";
import { formatDate } from "../app/format.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    this.localStorage = localStorage;

    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;

    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`);
    formNewBill.addEventListener("submit", this.handleSubmit);

    const fileInput = this.document.querySelector(`input[data-testid="file"]`);
    fileInput.addEventListener("change", this.handleChangeFile);
  }

  handleChangeFile = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    const errorMessage = this.document.querySelector(".error-message");

    if (!file) return;

    const fileName = file.name;
    const fileExtension = fileName.split(".").pop().toLowerCase();
    const allowedExtensions = ["png", "jpg", "jpeg"];

    if (!allowedExtensions.includes(fileExtension)) {
      if (errorMessage) errorMessage.classList.remove("hidden");
      e.target.value = ""; // reset input
      return;
    }

    if (errorMessage) errorMessage.classList.add("hidden");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", JSON.parse(this.localStorage.getItem("user")).email);

      const response = await this.store.bills().create({
        data: formData,
        headers: { noContentType: true },
      });

      this.billId = response.key;
      this.fileUrl = response.fileUrl;
      this.fileName = fileName;
    } catch (error) {
      console.error("Erreur handleChangeFile:", error);
    }
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    const email = JSON.parse(this.localStorage.getItem("user")).email;

    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };

    try {
      await this.updateBill(bill);
      this.onNavigate(ROUTES_PATH["Bills"]);
    } catch (error) {
      console.error("Erreur handleSubmit:", error);
    }
  };

  // Met à jour la note de frais dans le store
  updateBill = (bill) => {
    if (this.store) {
      return this.store.bills().update({ data: JSON.stringify(bill), selector: this.billId });
    }
    return Promise.resolve();
  };
}
