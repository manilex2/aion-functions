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

const sendMailTasks = async (req, res) => {
  const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLECLIENTID,
      process.env.GOOGLESECRETCODE,
      process.env.GOOGLEREDIRECTURI,
  );

  oAuth2Client.setCredentials({refresh_token: process.env.GOOGLEREFRESHTOKEN});
  const querySnapshot = await admin.firestore().collection("tasks").get();
  const tasks = querySnapshot.docs.map((task) => ({
    id: task.id,
    ...task.data(),
  }));

  const qsUsers = await admin.firestore().collection("users").get();
  const users = qsUsers.docs.map((user) => ({
    id: user.id,
    ...user.data(),
  }));
  // RECORER POA
  let emailCreator = "";
  let emailResponsable = [];
  for (let i = 0; i < tasks.length; i++) {
    const itemTask = tasks[i];
    const idCreatorTask = itemTask.creator._path.segments[1];
    if (!isEmpty(idCreatorTask)) {
      // RECORRER USUARIO
      for (let j = 0; j < users.length; j++) {
        const itemUser = users[j];
        if (idCreatorTask == itemUser.id) {
          emailCreator = itemUser.email;
        }
        for (let u = 0; u < itemTask.assignees.length; u++) {
          const assigneesId = itemTask.assignees[u]._path.segments[1];
          if (itemUser.id == assigneesId) {
            emailResponsable.push(itemUser.email);
          }
        }
      }
      const getDate = new Date();
      const fechaInicio = getDate.getTime();
      const fechaFin = new Date(itemTask.
          estimatedCompletionDate.
          _seconds * 1000);
      const diff = fechaFin.getTime() - fechaInicio;
      const diferencia = diff/(1000*60*60*24);

      // eslint-disable-next-line max-len
      if (diferencia <= 5 && isEmpty(itemTask.actualCompletionDate) && !itemTask.expireNotification1) {
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
        let message = `Estimado le comunicamos que el proyecto ${itemTask.title} está por vencer el ${fechaFin}`;

        // eslint-disable-next-line max-len
        const messageHtml = `<p>Estimado <br> le comunicamos que la tarea ${itemTask.title} está por vencer el ${fechaFin}.</p>`;

        const mailOptions = {
          from: from,
          to: emailResponsable,
          cc: emailCreator,
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
            emailResponsable = [];
          } else {
            const add = {
              dateScheduling: new Date(),
              sendTo: emailResponsable.toString(),
              description: "Notificacion de vencimiento de la tarea",
              sendDate: new Date(),
              sendToName: "Varios",
              type: "Tarea",
            };
            const update = {
              expireNotification1: true,
            };
            // eslint-disable-next-line max-len
            admin.firestore().collection("contracts").doc(itemTask.id).update(update);
            admin.firestore().collection("notifications").add(add);
            emailResponsable = [];
          }
        });
      }
    }
  }

  res.status(code).send({status: status, message: message});
};

exports.sendMailTasks = onRequest(sendMailTasks);
