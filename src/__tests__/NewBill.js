/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    let newBill

    beforeEach(() => {
      const html = NewBillUI()
      document.body.innerHTML = html
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))
      newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: { bills: jest.fn(() => ({ create: jest.fn() })) },
        localStorage
      })
    })

    test("Then uploading a png file should be accepted", () => {
      const fileInput = screen.getByTestId("file")
      const file = new File(["dummy content"], "test.png", { type: "image/png" })
      fireEvent.change(fileInput, { target: { files: [file] } })

      expect(fileInput.files[0].name).toBe("test.png")
    })

    test("Then uploading a pdf file should be rejected", () => {
      const fileInput = screen.getByTestId("file")
      const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" })

      // Mock alert
      window.alert = jest.fn()

      fireEvent.change(fileInput, { target: { files: [file] } })

      expect(window.alert).toHaveBeenCalledWith("Seuls les fichiers jpg, jpeg et png sont autorisés.")
      expect(fileInput.value).toBe("")
    })

    test("Then handleChangeFile should update fileUrl and billId when store returns data", async () => {
      document.body.innerHTML = NewBillUI()
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))

      const fileInput = screen.getByTestId("file")
      const file = new File(["dummy content"], "test.png", { type: "image/png" })

      // on mock le store
      const mockCreate = jest.fn(() =>
        Promise.resolve({ fileUrl: "http://localhost/test.png", key: "12345" })
      )
      const mockBills = jest.fn(() => ({ create: mockCreate }))

      // on réinstancie newBill avec ce store mocké
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: { bills: mockBills },
        localStorage
      })

      // Simule le changement de fichier avec target.files
      fireEvent.change(fileInput, {
        target: { files: [file] },
      })

      // attendre la fin de la promesse
      await new Promise(process.nextTick)

      expect(mockBills).toHaveBeenCalled()
      expect(mockCreate).toHaveBeenCalled()
      expect(newBill.fileUrl).toBe("http://localhost/test.png")
      expect(newBill.billId).toBe("12345")
    })

    test("Then handleSubmit should call updateBill and navigate to Bills", () => {
      // mock updateBill
      newBill.updateBill = jest.fn()

      const form = screen.getByTestId("form-new-bill")

      fireEvent.submit(form)

      expect(newBill.updateBill).toHaveBeenCalled()
      expect(newBill.onNavigate).toHaveBeenCalledWith("#employee/bills")
    })
  })
})
