const settings = require("../settings.json");
const fs = require('fs');
const indexjs = require("../index.js");
const fetch = require('node-fetch');
var validators = require('credit-card-validate');
const paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', // Replace with 'live' for production
  'client_id': settings.paypal.client_id,
  'client_secret': settings.paypal.client_secret
});

module.exports.load = async function(app, db) {
  app.get("/paypal", async(req, res) => {
    if(!req.session.pterodactyl) return res.redirect("/paypal?error=invalidinfo")

    let payment = {
      "intent": "sale",
      "payer": {
        "payment_method": "credit_card",
        "funding_instruments": [{
          "credit_card": {
            "number": `${req.query.number}`,
            "type": req.cardType, 
            "expire_month": +req.query.month,
            "expire_year": +req.query.year,
            "cvv2": req.query.vrf
          }
        }]
      },
      "transactions": [{
        "amount": {
          "total": req.query.amt * settings.paypal.amount,
          "currency": "GBP"
        },
        "description": "Transaction: " + settings.paypal.coins * req.query.amt
      }]
    };

    paypal.payment.create(payment, async function (error, payment) {
      if (error) {
        return res.redirect("/paypal?error=invalid")
      } else {
        const execute_payment_json = {
          "payer_id": payment.payer.payer_info.payer_id,
          "transactions": [{
            "amount": {
              "currency": "GBP",
              "total": req.query.amt * settings.paypal.amount
            }
          }]
        };

        paypal.payment.execute(payment.id, execute_payment_json, async function (error, payment) {
          if (error) {
            console.log(error.response);
            throw error;
          } else {
            let ccoins = await db.get(`coins-${req.session.userinfo.id}`)
            ccoins += settings.paypal.coins * req.query.amt;
            await db.set(`coins-${req.session.userinfo.id}`, coins)
          }
        });
      }
    });
  });
};
