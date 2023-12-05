const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const isEmpty = require("./utils/isEmpty");

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

const updateInstitutionContracts = async (req, res) => {
  // if (!await authMiddleware.validateFirebaseIdToken(request, response)) {
  // return;
  // }
  const qsContracts = await admin.firestore().collection("contracts").get();
  const contracts = qsContracts.docs.map((contract) => ({
    id: contract.id,
    ...contract.data(),
  }));
  let totalContracts = 0;
  let contractsToExpire = 0;
  let runningContracts = 0;
  let expiredContracts = 0;
  let completeContracts = 0;
  const getDate = new Date();
  for (let i = 0; i < contracts.length; i++) {
    const item = contracts[i];
    if (!isEmpty(item.contractEndDate)) {
      if (!isEmpty(item.status)) {
        if (item.status.toLowerCase() == "finalizado") {
          completeContracts++;
        }
        continue;
      }
      totalContracts = contracts.length;
      const fechaInicio = getDate.getTime();
      const fechaFin = new Date(item.contractEndDate._seconds * 1000).getTime();
      const diff = fechaFin - fechaInicio;
      const diferencia = diff/(1000*60*60*24);
      if (diferencia <= 15 ) {
        contractsToExpire++;
      }
      if (diferencia > 15 ) {
        runningContracts++;
      }
      if (diferencia <= 0 ) {
        expiredContracts++;
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
    totalContracts: totalContracts,
    contractsToExpire: contractsToExpire,
    runningContracts: runningContracts,
    expiredContracts: expiredContracts,
    completeContracts: completeContracts,
  };
  await admin.firestore().collection("Institution").
      doc(idInstitution).update(update);
  res.send({status: "Success!", message: "Institution contracts updated"});
};

exports.updateInstitutionContracts = onRequest(updateInstitutionContracts);
