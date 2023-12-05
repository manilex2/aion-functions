const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const isEmpty = require("./utils/isEmpty");

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

const updateInstitutionDocuments = async (req, res) => {
  // if (!await authMiddleware.validateFirebaseIdToken(request, response)) {
  // return;
  // }

  const qsDocuments = await admin.firestore().collection("documents").get();
  const documents = qsDocuments.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
  let runningDocs = 0;
  let DocsToExpire = 0;
  let expiredDocs = 0;
  let endedDocs = 0;
  let totalDocs = 0;
  const getDate = new Date();
  for (let i = 0; i < documents.length; i++) {
    const item = documents[i];
    if (!isEmpty(item.maxDateDispatch)) {
      totalDocs = documents.length;
      const fechaInicio = getDate.getTime();
      const fechaFin = new Date(item.maxDateDispatch._seconds * 1000).getTime();
      if (fechaFin > (fechaInicio + 5) ) {
        runningDocs++;
      }
      if (fechaFin <= (fechaInicio + 5) && fechaFin > fechaInicio) {
        DocsToExpire++;
      }
      if (fechaFin <= fechaInicio) {
        expiredDocs++;
      }
      if (!isEmpty(item.status)) {
        if (item.status.toLowerCase() == "finalizado") {
          endedDocs++;
        }
      }
    }
  }

  const qsIntitution = await admin.firestore().
      collection("Institution").get();
  const institutions = qsIntitution.docs.map((institution) => ({
    id: institution.id,
    ...institution.data(),
  }));
  let {idInstitution} = "";
  idInstitution = institutions[0].id;
  const update = {
    runningDocs: runningDocs,
    DocsToExpire: DocsToExpire,
    expiredDocs: expiredDocs,
    endedDocs: endedDocs,
    totalDocs: totalDocs,
  };
  await admin.firestore().collection("Institution").
      doc(idInstitution).update(update);
  res.send({status: "Success!", message: "Institution documents updated"});
};

exports.updateInstitutionDocuments = onRequest(updateInstitutionDocuments);
