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

const sendMailWarranty = async (req, res) => {
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
      const fechaActual = new Date();
      if (itemContract.garantiaTecnica) {
        if (itemContract.garantiaTecnica.endDate) {
          // eslint-disable-next-line max-len
          const fechaGarantiaTecnica = new Date(itemContract.garantiaTecnica.endDate._seconds * 1000);
          // eslint-disable-next-line max-len
          const resultDate = ((fechaGarantiaTecnica - fechaActual)/ (1000 * 60 * 60 * 24)).toFixed(0);
          // eslint-disable-next-line max-len
          if (resultDate <= 5 && !itemContract.garantiaTecnica.expireNotification) {
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
            let message = `Estimado ${displayAdministrator} le comunicamos que la garantía técnica del proyecto ${itemContract.projectCode} está por vencer la fecha ${fechaGarantiaTecnica}.`;
            // eslint-disable-next-line max-len
            const messageHtml = `<p>Estimado ${displayAdministrator} <br> le comunicamos que la garantía técnica del proyecto ${itemContract.projectCode} está por vencer la fecha ${fechaGarantiaTecnica}.</p>`;
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
                const add = {
                  dateScheduling: new Date(),
                  sendTo: emailAdministrator,
                  // eslint-disable-next-line max-len
                  description: "Notificacion de vencimiento de garantía técnica",
                  sendDate: new Date(),
                  sendToName: displayAdministrator,
                  type: "Garantía",
                };
                const update = {
                  garantiaTecnica: {
                    expireNotification: true,
                    ...itemContract.garantiaTecnica,
                  },
                };
                // eslint-disable-next-line max-len
                admin.firestore().collection("contracts").doc(itemContract.id).update(update);
                // eslint-disable-next-line max-len
                admin.firestore().collection("notifications").add(add);
              }
            });
          }
        }
      }
      if (itemContract.fielCumplimientoList) {
        // eslint-disable-next-line max-len
        for (let f = 0; f < itemContract.fielCumplimientoList.length; f++) {
          const itemFielCumplimiento = itemContract.fielCumplimientoList[f];
          // eslint-disable-next-line max-len
          const fechaFielCumplimiento = new Date(itemFielCumplimiento.endDate._seconds * 1000);
          // eslint-disable-next-line max-len
          const resultDate = ((fechaFielCumplimiento - fechaActual)/ (1000 * 60 * 60 * 24)).toFixed(0);
          // eslint-disable-next-line max-len
          if (resultDate <= 5 && !itemFielCumplimiento.expireNotification) {
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
            let message = `Estimado ${displayAdministrator} le comunicamos que la garantía de fiel cumplimiento del proyecto ${itemContract.projectCode} está por vencer la fecha ${fechaFielCumplimiento}.`;
            // eslint-disable-next-line max-len
            const messageHtml = `<p>Estimado ${displayAdministrator} <br> le comunicamos que la garantía de fiel cumplimiento del proyecto ${itemContract.projectCode} está por vencer la fecha ${fechaFielCumplimiento}.</p>`;
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
                const add = {
                  dateScheduling: new Date(),
                  sendTo: emailAdministrator,
                  // eslint-disable-next-line max-len
                  description: "Notificacion de vencimiento de garantía de fiel cumplimiento",
                  sendDate: new Date(),
                  sendToName: displayAdministrator,
                  type: "Garantía",
                };
                itemContract.fielCumplimientoList[f].expireNotification = true;
                const update = {
                  ...itemContract.fielCumplimientoList[f],
                };
                // eslint-disable-next-line max-len
                admin.firestore().collection("contracts").doc(itemContract.id).update(update);
                // eslint-disable-next-line max-len
                admin.firestore().collection("notifications").add(add);
              }
            });
          }
        }
      }
      if (itemContract.buenUsoAnticipoList) {
        // eslint-disable-next-line max-len
        for (let f = 0; f < itemContract.buenUsoAnticipoList.length; f++) {
          const itemBuenUsoAnticipo = itemContract.buenUsoAnticipoList[f];
          // eslint-disable-next-line max-len
          const fechaBuenUsoAnticipo = new Date(itemBuenUsoAnticipo.endDate._seconds * 1000);
          // eslint-disable-next-line max-len
          const resultDate = ((fechaBuenUsoAnticipo - fechaActual)/ (1000 * 60 * 60 * 24)).toFixed(0);
          // eslint-disable-next-line max-len
          if (resultDate <= 5 && !itemBuenUsoAnticipo.expireNotification) {
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
            let message = `Estimado ${displayAdministrator} le comunicamos que la garantía de buen uso de anticipo del proyecto ${itemContract.projectCode} está por vencer la fecha ${fechaBuenUsoAnticipo}.`;
            // eslint-disable-next-line max-len
            const messageHtml = `<p>Estimado ${displayAdministrator} <br> le comunicamos que la garantía de buen uso de anticipo del proyecto ${itemContract.projectCode} está por vencer la fecha ${fechaBuenUsoAnticipo}.</p>`;
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
                const add = {
                  dateScheduling: new Date(),
                  sendTo: emailAdministrator,
                  // eslint-disable-next-line max-len
                  description: "Notificacion de vencimiento de garantía de buen uso de anticipo",
                  sendDate: new Date(),
                  sendToName: displayAdministrator,
                  type: "Garantía",
                };
                itemContract.buenUsoAnticipoList[f].expireNotification = true;
                const update = {
                  ...itemContract.buenUsoAnticipoList[f],
                };
                // eslint-disable-next-line max-len
                admin.firestore().collection("contracts").doc(itemContract.id).update(update);
                // eslint-disable-next-line max-len
                admin.firestore().collection("notifications").add(add);
              }
            });
          }
        }
      }
    }
  }
  res.status(code).send({status: status, message: message});
};

exports.sendMailWarranty = onRequest(sendMailWarranty);
