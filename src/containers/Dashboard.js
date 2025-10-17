import { formatDate } from '../app/format.js'
import DashboardFormUI from '../views/DashboardFormUI.js'
import BigBilledIcon from '../assets/svg/big_billed.js'
import { ROUTES_PATH } from '../constants/routes.js'
import USERS_TEST from '../constants/usersTest.js'
import Logout from "./Logout.js"

//Filtrer les factures selon leur statut
export const filteredBills = (data, status) => {
  return (data && data.length) ?
    data.filter(bill => {
      let selectCondition

      // in jest environment
      if (typeof jest !== 'undefined') {
        selectCondition = (bill.status === status)
      }
      /* istanbul ignore next */
      else {
        // in prod environment
        const userEmail = JSON.parse(localStorage.getItem("user")).email
        selectCondition =
          (bill.status === status) &&
          ![...USERS_TEST, userEmail].includes(bill.email)
      }

      return selectCondition
    }) : []
}

//Crée le HTML d’une carte de facture affichée dans le tableau de bord.
export const card = (bill) => {
  const firstAndLastNames = bill.email.split('@')[0]
  const firstName = firstAndLastNames.includes('.') ?
    firstAndLastNames.split('.')[0] : ''
  const lastName = firstAndLastNames.includes('.') ?
    firstAndLastNames.split('.')[1] : firstAndLastNames

  return (`
    <div class='bill-card' id='open-bill${bill.id}' data-testid='open-bill${bill.id}'>
      <div class='bill-card-name-container'>
        <div class='bill-card-name'> ${firstName} ${lastName} </div>
        <span class='bill-card-grey'> ... </span>
      </div>
      <div class='name-price-container'>
        <span> ${bill.name} </span>
        <span> ${bill.amount} € </span>
      </div>
      <div class='date-type-container'>
        <span> ${formatDate(bill.date)} </span>
        <span> ${bill.type} </span>
      </div>
    </div>
  `)
}

//Génère une liste complète de cartes HTML en appelant card() sur chaque facture.
export const cards = (bills) => {
  return bills && bills.length ? bills.map(bill => card(bill)).join("") : ""
}

//Traduit un indice numérique (1, 2, 3) en un statut texte.
export const getStatus = (index) => {
  switch (index) {
    case 1:
      return "pending"
    case 2:
      return "accepted"
    case 3:
      return "refused"
  }
}

//contrôleur principal du tableau de bord.
export default class Dashboard {
  constructor({ document, onNavigate, store, bills, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    this.listStates = { 1: false, 2: false, 3: false } // <-- état d'ouverture par liste

    $('#arrow-icon1').off('click').on('click', (e) => this.handleShowTickets(e, bills, 1))
    $('#arrow-icon2').off('click').on('click', (e) => this.handleShowTickets(e, bills, 2))
    $('#arrow-icon3').off('click').on('click', (e) => this.handleShowTickets(e, bills, 3))

    new Logout({ localStorage, onNavigate })
  }

  //Affiche une modale avec l’image du justificatif (ticket) quand l’admin clique sur l’icône “œil”.
  handleClickIconEye = () => {
    const billUrl = $('#icon-eye-d').attr("data-bill-url")
    const imgWidth = Math.floor($('#modaleFileAdmin1').width() * 0.8)
    $('#modaleFileAdmin1')
      .find(".modal-body")
      .html(`<div style='text-align: center;'><img width=${imgWidth} src=${billUrl} alt="Bill"/></div>`)
    if (typeof $('#modaleFileAdmin1').modal === 'function')
      $('#modaleFileAdmin1').modal('show')
  }

  //Permet à l’admin de voir les détails d’un ticket.
  handleEditTicket(e, bill, bills) {
    if (this.counter === undefined || this.id !== bill.id) this.counter = 0
    if (this.id === undefined || this.id !== bill.id) this.id = bill.id

    if (this.counter % 2 === 0) {
      bills.forEach((b) => {
        $(`#open-bill${b.id}`).css({ background: '#0D5AE5' })
      })
      $(`#open-bill${bill.id}`).css({ background: '#2A2B35' })
      $('.dashboard-right-container div').html(DashboardFormUI(bill))
      $('.vertical-navbar').css({ height: '150vh' })
      this.counter++
    } else {
      $(`#open-bill${bill.id}`).css({ background: '#0D5AE5' })

      $('.dashboard-right-container div').html(`
        <div id="big-billed-icon" data-testid="big-billed-icon"> ${BigBilledIcon} </div>
      `)
      $('.vertical-navbar').css({ height: '120vh' })
      this.counter++
    }

    // listeners pour l’œil et boutons
    $('#icon-eye-d').off('click').on('click', this.handleClickIconEye)
    $('#btn-refuse-bill').off('click').on('click', (e) => this.handleRefuseSubmit(e, bill))
    $('#btn-accept-bill').off('click').on('click', (e) => this.handleAcceptSubmit(e, bill))
  }

  // mettent à jour le statut de la facture (accepted ou refused)/ envoient la modification via updateBill()/ redirigent vers le Dashboard.
  handleAcceptSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'accepted',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  handleRefuseSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'refused',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  //Gère l’affichage/masquage des listes selon le statut
  handleShowTickets(e, bills, index) {
    // bascule l'état de la liste cliquée
    this.listStates[index] = !this.listStates[index]

    if (this.listStates[index]) {
      // affiche les tickets
      $(`#arrow-icon${index}`).css({ transform: "rotate(0deg)" })
      $(`#status-bills-container${index}`).html(
        cards(filteredBills(bills, getStatus(index)))
      )
    } else {
      // masque les tickets
      $(`#arrow-icon${index}`).css({ transform: "rotate(90deg)" })
      $(`#status-bills-container${index}`).html("")
    }

    /**---------bug 4----------------------------------------------
     * ajout si l'élément n'a pas de listener on l'ajoute
     * ------------------------------------------------------------
     */
    bills.forEach((bill) => {
      $(`#open-bill${bill.id}`).click((e) => {
        // [BUG HUNT "Dashboard" CORRECTION] - Stop event propagation for element
        e.stopImmediatePropagation();
        // END [BUG HUNT "Dashboard" CORRECTION]
        this.handleEditTicket(e, bill, bills);
      });
    });
  }

  // Récupère toutes les factures depuis la base de données (store)
  getBillsAllUsers = () => {
    if (this.store) {
      return this.store
        .bills()
        .list()
        .then(snapshot => snapshot.map(doc => ({
          id: doc.id,
          ...doc,
          date: doc.date,
          status: doc.status
        })))
        .catch(error => { throw error })
    }
  }

  // Met à jour une facture dans la base
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
      return this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: bill.id })
        .then(bill => bill)
        .catch(console.log)
    }
  }
}
