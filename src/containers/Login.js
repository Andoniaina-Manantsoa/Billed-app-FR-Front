
import { ROUTES_PATH } from '../constants/routes.js'
export let PREVIOUS_LOCATION = ''

// we use a class so as to test its methods in e2e tests
export default class Login {
  constructor({ document, localStorage, onNavigate, PREVIOUS_LOCATION, store }) {
    this.document = document
    this.localStorage = localStorage
    this.onNavigate = onNavigate
    this.PREVIOUS_LOCATION = PREVIOUS_LOCATION
    this.store = store

    // Formulaire employé
    const formEmployee = this.document.querySelector(`form[data-testid="form-employee"]`)
    formEmployee.addEventListener("submit", this.handleSubmitEmployee)

    // Formulaire admin
    const formAdmin = this.document.querySelector(`form[data-testid="form-admin"]`)
    formAdmin.addEventListener("submit", this.handleSubmitAdmin)
  }

  handleSubmitEmployee = e => {
    e.preventDefault()
    const emailInput = e.target.querySelector(`input[data-testid="employee-email-input"]`)
    const passwordInput = e.target.querySelector(`input[data-testid="employee-password-input"]`)
    if (!emailInput || !passwordInput) return

    const user = {
      type: "Employee",
      email: emailInput.value,
      password: passwordInput.value,
      status: "connected"
    }

    this.localStorage.setItem("user", JSON.stringify(user))

    this.login(user)
      .catch(() => this.createUser(user))
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
        this.PREVIOUS_LOCATION = ROUTES_PATH['Bills']
        PREVIOUS_LOCATION = this.PREVIOUS_LOCATION
        this.document.body.style.backgroundColor = "#fff"
      })
  }

  handleSubmitAdmin = e => {
    e.preventDefault()
    const emailInput = e.target.querySelector(`input[data-testid="admin-email-input"]`)
    const passwordInput = e.target.querySelector(`input[data-testid="admin-password-input"]`)
    if (!emailInput || !passwordInput) return

    const user = {
      type: "Admin",
      email: emailInput.value,
      password: passwordInput.value,
      status: "connected"
    }

    this.localStorage.setItem("user", JSON.stringify(user))

    this.login(user)
      .catch(() => this.createUser(user))
      .then(() => {
        this.onNavigate(ROUTES_PATH['Dashboard'])
        this.PREVIOUS_LOCATION = ROUTES_PATH['Dashboard']
        PREVIOUS_LOCATION = this.PREVIOUS_LOCATION
        this.document.body.style.backgroundColor = "#fff"
      })
  }

  // login
  login = (user) => {
    if (!this.store) return null

    return this.store
      .login(JSON.stringify({ email: user.email, password: user.password }))
      .then((res) => {
        console.log("Réponse login :", res)
        // On prend le token du backend peu importe son nom
        const token = res.jwt || res.token || res.accessToken
        if (!token) throw new Error("Aucun token reçu du backend")
        this.localStorage.setItem('jwt', token)
      })
  }

  // Création d'un nouvel utilisateur
  createUser = (user) => {
    if (!this.store) return null

    return this.store
      .users()
      .create({
        data: JSON.stringify({
          type: user.type,
          name: user.email.split('@')[0],
          email: user.email,
          password: user.password
        })
      })
      .then(() => this.login(user))
  }
}
