require("dotenv").config("./.env");
const admin = require("firebase-admin");
const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const nodemailer = require("nodemailer");
const {google} = require("googleapis");
const isEmpty = require("./utils/isEmpty");

let code = 200;
let status = "Success!!";
const message = "All good";

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

const sendMailContracts = async (req, res) => {
  const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLECLIENTID,
      process.env.GOOGLESECRETCODE,
      process.env.GOOGLEREDIRECTURI,
  );

  oAuth2Client.setCredentials({refresh_token: process.env.GOOGLEREFRESHTOKEN});
  const querySnapshot = await admin.firestore().collection("contracts").get();
  const contracts = querySnapshot.docs.map((contract) => ({
    id: contract.id,
    ...contract.data(),
  }));

  const qsUsers = await admin.firestore().collection("users").get();
  const users = qsUsers.docs.map((user) => ({
    id: user.id,
    ...user.data(),
  }));

  // RECORER DOCUMENTS
  for (let i = 0; i < contracts.length; i++) {
    const itemContract = contracts[i];

    const idcontractAdministrator = itemContract.
        administrator.
        _path.
        segments[1];
    if (!isEmpty(idcontractAdministrator)) {
      let emailAdministrator = "";
      let displayAdministrator = "";
      // RECORRER USUARIO
      for (let j = 0; j < users.length; j++) {
        const itemUser = users[j];
        if (idcontractAdministrator == itemUser.id) {
          emailAdministrator = itemUser.email;
          displayAdministrator = itemUser.display_name;
          break;
        }
      }

      const fecha = new Date(itemContract.contractEndDate._seconds * 1000);
      const fechaActual = new Date();
      // eslint-disable-next-line max-len
      const resultDate = ((fecha - fechaActual)/ (1000 * 60 * 60 * 24)).toFixed(0);

      if (resultDate < 50 && !itemContract.expireNotification1) {
        const ACCESS_TOKEN = await oAuth2Client.getAccessToken();
        const transporter = nodemailer.createTransport({
          service: process.env.GMAILSERVICE,
          auth: {
            type: "OAuth2",
            user: process.env.GMAILUSER,
            clientId: process.env.GOOGLECLIENTID,
            clientSecret: process.env.GOOGLESECRETCODE,
            refreshToken: process.env.GOOGLEREFRESHTOKEN,
            accessToken: ACCESS_TOKEN,
          },
          tls: {
            rejectUnauthorized: true,
          },
        });

        const from = `Notificaciones <${process.env.MAILFROM}>`;
        const subject = "Notificación";
        // eslint-disable-next-line max-len
        let message = `Estimado ${displayAdministrator} le comunicamos que el contrato del proyecto ${itemContract.projectCode} está por vencer la fecha ${fecha}.`;

        // eslint-disable-next-line max-len
        const messageHtml = `<p>Estimado ${displayAdministrator} <br> le comunicamos que el contrato del proyecto ${itemContract.projectCode} está por vencer la fecha ${fecha}.</p>`;

        const mailOptions = {
          from: from,
          to: emailAdministrator,
          subject: subject,
          text: message,
          html: messageHtml,
        };

        await transporter.sendMail(mailOptions, (error, info) => {
          let codeInside = code;
          let statusInside = status;
          let messageInside = message;
          if (error) {
            codeInside = 400;
            statusInside = "Error!!";
            messageInside = error;

            code = codeInside;
            status = statusInside;
            message = messageInside;
            console.log(error);
          } else {
            const update = {
              expireNotification1: true,
            };
            // eslint-disable-next-line max-len
            const add = {
              dateScheduling: new Date(),
              sendTo: emailAdministrator,
              description: "Notificacion de vencimiento de contrato",
              sendDate: new Date(),
              sendToName: displayAdministrator,
              type: "Contrato",
            };
            // eslint-disable-next-line max-len
            admin.firestore().collection("contracts").doc(itemContract.id).update(update);
            admin.firestore().collection("notifications").add(add);
          }
        });
      }

      if (resultDate < 20 && !itemContract.expireNotification2) {
        const ACCESS_TOKEN = await oAuth2Client.getAccessToken();
        const transporter = nodemailer.createTransport({
          service: process.env.GMAILSERVICE,
          auth: {
            type: "OAuth2",
            user: process.env.GMAILUSER,
            clientId: process.env.GOOGLECLIENTID,
            clientSecret: process.env.GOOGLESECRETCODE,
            refreshToken: process.env.GOOGLEREFRESHTOKEN,
            accessToken: ACCESS_TOKEN,
          },
          tls: {
            rejectUnauthorized: true,
          },
        });

        const from = `Notificaciones <${process.env.MAILFROM}>`;
        const subject = "Notificación";
        // eslint-disable-next-line max-len
        let message = `Estimado ${displayAdministrator} le comunicamos que el contrato del proyecto ${itemContract.projectCode} está por vencer la fecha ${fecha}.`;

        // eslint-disable-next-line max-len
        const messageHtml = `<p>Estimado ${displayAdministrator} <br> le comunicamos que el contrato del proyecto ${itemContract.projectCode} está por vencer la fecha ${fecha}.</p>`;

        const mailOptions = {
          from: from,
          to: emailAdministrator,
          subject: subject,
          text: message,
          html: messageHtml,
        };

        await transporter.sendMail(mailOptions, (error, info) => {
          let codeInside = code;
          let statusInside = status;
          let messageInside = message;
          if (error) {
            codeInside = 400;
            statusInside = "Error!!";
            messageInside = error;

            code = codeInside;
            status = statusInside;
            message = messageInside;
            console.log(error);
          } else {
            const update = {
              expireNotification2: true,
            };
            // eslint-disable-next-line max-len
            const add = {
              dateScheduling: new Date(),
              sendTo: emailAdministrator,
              description: "Notificacion de vencimiento de contrato",
              sendDate: new Date(),
              sendToName: displayAdministrator,
              type: "Contrato",
            };
            // eslint-disable-next-line max-len
            admin.firestore().collection("contracts").doc(itemContract.id).update(update);
            admin.firestore().collection("notifications").add(add);
          }
        });
      }
    }
  }
  res.status(code).send({status: status, message: message});
};

exports.sendMailContracts = onRequest(sendMailContracts);
