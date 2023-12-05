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

const sendMailPoaDirectives = async (req, res) => {
  const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLECLIENTID,
      process.env.GOOGLESECRETCODE,
      process.env.GOOGLEREDIRECTURI,
  );

  oAuth2Client.setCredentials({refresh_token: process.env.GOOGLEREFRESHTOKEN});
  const querySnapshot = await admin.firestore().collection("poa").get();
  const poas = querySnapshot.docs.map((poa) => ({
    id: poa.id,
    ...poa.data(),
  }));

  const qsUsers = await admin.firestore().collection("users").get();
  const users = qsUsers.docs.map((user) => ({
    id: user.id,
    ...user.data(),
  }));
  // RECORER POA
  for (let i = 0; i < poas.length; i++) {
    const itemPoa = poas[i];

    const idResponsablePoa = itemPoa.responsable._path.segments[1];
    if (!isEmpty(idResponsablePoa)) {
      let emailResponsable = "";
      let displayNameResponsable = "";
      // RECORRER USUARIO
      for (let j = 0; j < users.length; j++) {
        const itemUser = users[j];
        if (idResponsablePoa == itemUser.id) {
          emailResponsable = itemUser.email;
          displayNameResponsable = itemUser.display_name;
          break;
        }
      }
      const getDate = new Date();
      const fechaInicio = getDate.getTime();
      const currentYear = new Date().getFullYear();
      const dateC1 = new Date(currentYear, 3, 30).getTime();
      const dateC2 = new Date(currentYear, 7, 31).getTime();
      const dateC3 = new Date(currentYear, 11, 31).getTime();
      const diffDateC1 = (dateC1 - fechaInicio)/(1000*60*60*24);
      const diffDateC2 = (dateC2 - fechaInicio)/(1000*60*60*24);
      const diffDateC3 = (dateC3 - fechaInicio)/(1000*60*60*24);

      // eslint-disable-next-line max-len
      if ((!itemPoa.advanceRealC1 || itemPoa.advanceRealC1 == 0) && diffDateC1 <= 15 && !itemPoa.expNotifAdvanceRealC1) {
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
        let message = `Estimado ${displayNameResponsable} le comunicamos que el proyecto ${itemPoa.projectName} no ha tenido ningún avance para este cuatrimestre que finaliza el 30 de abril de ${currentYear}`;
        // eslint-disable-next-line max-len
        const messageHtml = `<p>Estimado ${displayNameResponsable} <br> le comunicamos que el proyecto ${itemPoa.projectName} no ha tenido ningún avance para este cuatrimestre que finaliza el 30 de abril de ${currentYear}.</p>`;
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
              expNotifAdvanceRealC1: true,
            };
            const add = {
              dateScheduling: new Date(),
              sendTo: emailResponsable,
              // eslint-disable-next-line max-len
              description: "Notificacion de no avance para final de cuatrimestre 1",
              sendDate: new Date(),
              sendToName: displayNameResponsable,
              type: "POA",
            };
            // eslint-disable-next-line max-len
            admin.firestore().collection("poa").doc(itemPoa.id).update(update);
            admin.firestore().collection("notifications").add(add);
          }
        });
      }

      // eslint-disable-next-line max-len
      if ((!itemPoa.advanceRealC2 || itemPoa.advanceRealC2 == 0) && diffDateC2 <= 15 && !itemPoa.expNotifAdvanceRealC2) {
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
        let message = `Estimado ${displayNameResponsable} le comunicamos que el proyecto ${itemPoa.projectName} no ha tenido ningún avance para este cuatrimestre que finaliza el 31 de agosto de ${currentYear}`;
        // eslint-disable-next-line max-len
        const messageHtml = `<p>Estimado ${displayNameResponsable} <br> le comunicamos que el proyecto ${itemPoa.projectName} no ha tenido ningún avance para este cuatrimestre que finaliza el 31 de agosto de ${currentYear}.</p>`;
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
            const add = {
              dateScheduling: new Date(),
              sendTo: emailResponsable,
              // eslint-disable-next-line max-len
              description: "Notificacion de no avance para final de cuatrimestre 2",
              sendDate: new Date(),
              sendToName: displayNameResponsable,
              type: "POA",
            };
            const update = {
              expNotifAdvanceRealC2: true,
            };
            admin.firestore().collection("poa").doc(itemPoa.id).update(update);
            admin.firestore().collection("notifications").add(add);
          }
        });
      }

      // eslint-disable-next-line max-len
      if ((!itemPoa.advanceRealC3 || itemPoa.advanceRealC3 == 0) && diffDateC3 <= 15 && !itemPoa.expNotifAdvanceRealC3) {
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
        let message = `Estimado ${displayNameResponsable} le comunicamos que el proyecto ${itemPoa.projectName} no ha tenido ningún avance para este cuatrimestre que finaliza el 31 de diciembre de ${currentYear}`;
        // eslint-disable-next-line max-len
        const messageHtml = `<p>Estimado ${displayNameResponsable} <br> le comunicamos que el proyecto ${itemPoa.projectName} no ha tenido ningún avance para este cuatrimestre que finaliza el 31 de diciembre de ${currentYear}.</p>`;
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
            const add = {
              dateScheduling: new Date(),
              sendTo: emailResponsable,
              // eslint-disable-next-line max-len
              description: "Notificacion de no avance para final de cuatrimestre 3",
              sendDate: new Date(),
              sendToName: displayNameResponsable,
              type: "POA",
            };
            const update = {
              expNotifAdvanceRealC3: true,
            };
            admin.firestore().collection("poa").doc(itemPoa.id).update(update);
            admin.firestore().collection("notifications").add(add);
          }
        });
      }

      if (itemPoa.expirationCurrentContract) {
        const fechaFin = new Date(itemPoa.
            expirationCurrentContract.
            _seconds * 1000);
        const diff = fechaFin.getTime() - fechaInicio;
        const diferencia = diff/(1000*60*60*24);
        if (diferencia <= 15 && !itemPoa.expNotifCurrentContract) {
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
          let message = `Estimado ${displayNameResponsable} le comunicamos que el proyecto ${itemPoa.projectName} está por vencer el ${fechaFin}`;
          // eslint-disable-next-line max-len
          const messageHtml = `<p>Estimado ${displayNameResponsable} <br> le comunicamos que el proyecto ${itemPoa.projectName} está por vencer el ${fechaFin}.</p>`;
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
              const add = {
                dateScheduling: new Date(),
                sendTo: emailResponsable,
                description: "Notificacion de vencimiento de projecto",
                sendDate: new Date(),
                sendToName: displayNameResponsable,
                type: "POA",
              };
              const update = {
                expNotifCurrentContract: true,
              };
              // eslint-disable-next-line max-len
              admin.firestore().collection("poa").doc(itemPoa.id).update(update);
              admin.firestore().collection("notifications").add(add);
            }
          });
        }
      }

      if (!isEmpty(itemPoa.realProjectStartDate)) {
        // eslint-disable-next-line max-len
        const fecha = new Date(itemPoa.projectStartDate._seconds * 1000);
        const diferencia = (fecha.getTime() - fechaInicio)/(1000*60*60*24);
        if (diferencia <= 5 && !itemPoa.expNotifRealProjectStartDate) {
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
          let message = `Estimado ${displayNameResponsable} le comunicamos que para el proyecto ${itemPoa.projectName} no ha establecido una fecha real de inicio del proyecto.`;
          // eslint-disable-next-line max-len
          const messageHtml = `<p>Estimado ${displayNameResponsable} <br> le comunicamos que para el proyecto ${itemPoa.projectName} no ha establecido una fecha real de inicio del proyecto.</p>`;
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
              const add = {
                dateScheduling: new Date(),
                sendTo: emailResponsable,
                // eslint-disable-next-line max-len
                description: "Notificación de fecha real de inicio de proyecto no determinada",
                sendDate: new Date(),
                sendToName: displayNameResponsable,
                type: "POA",
              };
              const update = {
                expNotifRealProjectStartDate: true,
              };
              // eslint-disable-next-line max-len
              admin.firestore().collection("poa").doc(itemPoa.id).update(update);
              admin.firestore().collection("notifications").add(add);
            }
          });
        }
      }

      if (!isEmpty(itemPoa.realRelevanceResponseDate)) {
        // eslint-disable-next-line max-len
        const fecha = new Date(itemPoa.relevanceResponseDate._seconds * 1000);
        const diferencia = (fecha.getTime() - fechaInicio)/(1000*60*60*24);
        if (diferencia <= 5 && !itemPoa.expNotifRealRelevanceResponseDate) {
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
          let message = `Estimado ${displayNameResponsable} le comunicamos que para el proyecto ${itemPoa.projectName} no ha establecido una fecha real de una respuesta de pertinencia`;
          // eslint-disable-next-line max-len
          const messageHtml = `<p>Estimado ${displayNameResponsable} <br> le comunicamos que para el proyecto ${itemPoa.projectName} no ha establecido una fecha real de una respuesta de pertinencia.</p>`;
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
              const add = {
                dateScheduling: new Date(),
                sendTo: emailResponsable,
                // eslint-disable-next-line max-len
                description: "Notificación de fecha real de respuesta de pertinencia no determinada",
                sendDate: new Date(),
                sendToName: displayNameResponsable,
                type: "POA",
              };
              const update = {
                expNotifRealRelevanceResponseDate: true,
              };
              // eslint-disable-next-line max-len
              admin.firestore().collection("poa").doc(itemPoa.id).update(update);
              admin.firestore().collection("notifications").add(add);
            }
          });
        }
      }

      if (!isEmpty(itemPoa.realDatePublicationPortal)) {
        // eslint-disable-next-line max-len
        const fecha = new Date(itemPoa.estimatedDatePublicationPortal._seconds * 1000);
        const diferencia = (fecha.getTime() - fechaInicio)/(1000*60*60*24);
        if (diferencia <= 5 && !itemPoa.expNotifRealDatePublicationPortal) {
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
          let message = `Estimado ${displayNameResponsable} le comunicamos que para el proyecto ${itemPoa.projectName} no ha establecido una fecha real de publicación en el portal`;
          // eslint-disable-next-line max-len
          const messageHtml = `<p>Estimado ${displayNameResponsable} <br> le comunicamos que para el proyecto ${itemPoa.projectName} no ha establecido una fecha real de publicación en el portal.</p>`;
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
              const add = {
                dateScheduling: new Date(),
                sendTo: emailResponsable,
                // eslint-disable-next-line max-len
                description: "Notificación de fecha real de publicación en portal",
                sendDate: new Date(),
                sendToName: displayNameResponsable,
                type: "POA",
              };
              const update = {
                estimatedDatePublicationPortal: true,
              };
              // eslint-disable-next-line max-len
              admin.firestore().collection("poa").doc(itemPoa.id).update(update);
              admin.firestore().collection("notifications").add(add);
            }
          });
        }
      }

      if (!isEmpty(itemPoa.realAwardDate)) {
        // eslint-disable-next-line max-len
        const fecha = new Date(itemPoa.estimatedAwardDate._seconds * 1000);
        const diferencia = (fecha.getTime() - fechaInicio)/(1000*60*60*24);
        if (diferencia <= 5 && !itemPoa.expNotifRealAwardDate) {
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
          let message = `Estimado ${displayNameResponsable} le comunicamos que para el proyecto ${itemPoa.projectName} no ha establecido una fecha real de adjudicación`;
          // eslint-disable-next-line max-len
          const messageHtml = `<p>Estimado ${displayNameResponsable} <br> le comunicamos que para el proyecto ${itemPoa.projectName} no ha establecido una fecha real de adjudicación.</p>`;
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
              const add = {
                dateScheduling: new Date(),
                sendTo: emailResponsable,
                // eslint-disable-next-line max-len
                description: "Notificación de fecha real de adjudicación",
                sendDate: new Date(),
                sendToName: displayNameResponsable,
                type: "POA",
              };
              const update = {
                expNotifRealAwardDate: true,
              };
              // eslint-disable-next-line max-len
              admin.firestore().collection("poa").doc(itemPoa.id).update(update);
              admin.firestore().collection("notifications").add(add);
            }
          });
        }
      }

      if (!isEmpty(itemPoa.realContractSigningDate)) {
        // eslint-disable-next-line max-len
        const fecha = new Date(itemPoa.estimatedContractSigningDate._seconds * 1000);
        const diferencia = (fecha.getTime() - fechaInicio)/(1000*60*60*24);
        if (diferencia <= 5 && !itemPoa.expNotifRealContractSigningDate) {
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
          let message = `Estimado ${displayNameResponsable} le comunicamos que para el proyecto ${itemPoa.projectName} no ha establecido una fecha real de firma de contrato`;
          // eslint-disable-next-line max-len
          const messageHtml = `<p>Estimado ${displayNameResponsable} <br> le comunicamos que para el proyecto ${itemPoa.projectName} no ha establecido una fecha real de firma de contrato.</p>`;
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
              const add = {
                dateScheduling: new Date(),
                sendTo: emailResponsable,
                // eslint-disable-next-line max-len
                description: "Notificación de fecha real de firma de contrato",
                sendDate: new Date(),
                sendToName: displayNameResponsable,
                type: "POA",
              };
              const update = {
                expNotifRealContractSigningDate: true,
              };
              // eslint-disable-next-line max-len
              admin.firestore().collection("poa").doc(itemPoa.id).update(update);
              admin.firestore().collection("notifications").add(add);
            }
          });
        }
      }
    }
  }
  res.status(code).send({status: status, message: message});
};

exports.sendMailPoaDirectives = onRequest(sendMailPoaDirectives);
