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

const sendMailDocuments = async (req, res) => {
  const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLECLIENTID,
      process.env.GOOGLESECRETCODE,
      process.env.GOOGLEREDIRECTURI,
  );

  oAuth2Client.setCredentials({refresh_token: process.env.GOOGLEREFRESHTOKEN});
  const querySnapshot = await admin.firestore().collection("documents").get();
  const documents = querySnapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));

  const qsUsers = await admin.firestore().collection("users").get();
  const users = qsUsers.docs.map((user) => ({
    id: user.id,
    ...user.data(),
  }));
  // RECORER POA
  for (let i = 0; i < documents.length; i++) {
    const itemDocument = documents[i];

    const idResponsableDocument = itemDocument.createdBy._path.segments[1];
    if (!isEmpty(idResponsableDocument)) {
      let emailResponsable = "";
      let displayNameResponsable = "";
      // RECORRER USUARIO
      for (let j = 0; j < users.length; j++) {
        const itemUser = users[j];
        if (idResponsableDocument == itemUser.id) {
          emailResponsable = itemUser.email;
          displayNameResponsable = itemUser.display_name;
          break;
        }
      }
      const getDate = new Date();
      const fechaInicio = getDate.getTime();
      const fechaFin = new Date(itemDocument.
          maxDateDispatch.
          _seconds * 1000);
      const diff = fechaFin.getTime() - fechaInicio;
      const diferencia = diff/(1000*60*60*24);

      if (diferencia <= 5 && !itemDocument.expireNotification1) {
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
        let message = `Estimado ${displayNameResponsable} le comunicamos que el documento ${itemDocument.action} está por vencer el ${fechaFin}`;

        // eslint-disable-next-line max-len
        const messageHtml = `<p>Estimado ${displayNameResponsable} <br> le comunicamos que el proyecto ${itemDocument.action} está por vencer el ${fechaFin}.</p>`;

        const mailOptions = {
          from: from,
          to: emailResponsable,
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
            const add = {
              dateScheduling: new Date(),
              sendTo: emailResponsable,
              description: "Notificacion de vencimiento de documento",
              sendDate: new Date(),
              sendToName: displayNameResponsable,
              type: "Documento",
            };
            // eslint-disable-next-line max-len
            admin.firestore().collection("documents").doc(itemDocument.id).update(update);
            admin.firestore().collection("notifications").add(add);
          }
        });
      }
    }
  }

  res.status(code).send({status: status, message: message});
};

exports.sendMailDocuments = onRequest(sendMailDocuments);
