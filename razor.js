
const settings = require("../settings.json");
const fs = require('fs');
const indexjs = require("../index.js");
const fetch = require('node-fetch');
var validators = require('credit-card-validate');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: settings.razorpay.client_id,
  key_secret: settings.razorpay.client_secret,
});

module.exports.load = async function(app, db) {
  app.get("/razorpay", async(req, res) => {
    if(!req.session.pterodactyl) return res.redirect("/razor?error=e"

    const payment_capture = 1;
    const amount = req.query.amt * settings.razorpay.amount;
    const currency = "GBP";
    const options = {
      amount: amount,
      currency: currency,
      receipt: makeid(8),
      payment_capture: payment_capture,
      notes: {
        description: "Transaction: " + settings.razorpay.coins * req.query.amt
      },
      card: {
        number: `${req.query.number}`,
        cvv: req.query.vrf,
        expiry_month: req.query.month,
        expiry_year: req.query.year,
        name: req.query.name
      }
    };

    razorpay.payments.create(options, async function(error, payment) {
      if(error) {
        return res.redirect("/razor?error=e"
      } else {
        let coins = await db.get(`coins-${req.session.userinfo.id}`)
        coins += settings.razorpay.coins * req.query.amt;
        await db.set(`coins-${req.session.userinfo.id}`, coins)
        return res.redirect("/razor?success=e"
      }
    });
  });
};

function makeid(length) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
