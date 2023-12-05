const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const isEmpty = require("./utils/isEmpty");

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

const updateInstitutionPOA = async (req, res) => {
  // if (!await authMiddleware.validateFirebaseIdToken(request, response)) {
  // return;
  // }
  const querySnapshot = await admin.firestore().collection("poa").get();
  const poas = querySnapshot.docs.map((poa) => ({
    id: poa.id,
    ...poa.data(),
  }));
  const qsContracts = await admin.firestore().collection("contracts").get();
  const contracts = qsContracts.docs.map((contract) => ({
    id: contract.id,
    ...contract.data(),
  }));
  let proyectC1 = 0;
  let proyectC2 = 0;
  let proyectC3 = 0;
  let totalProyect = 0;
  let preparatoryProyect = 0;
  let precontractualProjects = 0;
  let runningProjects = 0;
  let activitiesC1 = 0;
  let activitiesC2 = 0;
  let activitiesC3 = 0;
  let totalActivities = 0;
  let runningActivities = 0;
  let completedActivities = 0;
  let rescheduledActivities = 0;
  let awardedProjects = 0;
  let valorContrato = 0;
  for (let i = 0; i < poas.length; i++) {
    const item = poas[i];
    if (item.budgetEstimate >= 1 && item.currentPeriod == "C1") {
      proyectC1++;
    }
    if (item.budgetEstimate >= 1 && item.currentPeriod == "C2") {
      proyectC2++;
    }
    if (item.budgetEstimate >= 1 && item.currentPeriod == "C3") {
      proyectC3++;
    }
    if (item.budgetEstimate >= 1) {
      totalProyect++;
    }
    if (
      item.budgetEstimate >= 1 &&
      item.preparatoryProgress >= 0.01 &&
      item.preparatoryProgress < 1
    ) {
      preparatoryProyect++;
    }
    if (
      item.budgetEstimate >= 1 &&
      item.precontractualProgress >= 0.01 &&
      item.precontractualProgress < 1
    ) {
      precontractualProjects++;
    }
    if (
      item.budgetEstimate >= 1 &&
      item.executionProgress >= 0.01 &&
      item.executionProgress < 1
    ) {
      runningProjects++;
    }
    if (
      (item.budgetEstimate == 0 || item.budgetEstimate == null) &&
      item.currentPeriod == "C1"
    ) {
      activitiesC1++;
    }
    if (
      (item.budgetEstimate == 0 || item.budgetEstimate == null) &&
      item.currentPeriod == "C2"
    ) {
      activitiesC2++;
    }
    if (
      (item.budgetEstimate == 0 || item.budgetEstimate == null) &&
      item.currentPeriod == "C3"
    ) {
      activitiesC3++;
    }
    if (item.budgetEstimate == 0 || item.budgetEstimate == null) {
      totalActivities++;
    }
    if (
      (item.budgetEstimate == 0 || item.budgetEstimate == null) &&
      item.activityProgress >= 0.01 &&
      item.activityProgress < 1
    ) {
      runningActivities++;
    }
    if (
      (item.budgetEstimate == 0 || item.budgetEstimate == null) &&
      item.activityEnded == true
    ) {
      completedActivities++;
    }
    if (
      (item.budgetEstimate == 0 || item.budgetEstimate == null) &&
      item.activityRescheduled == true
    ) {
      rescheduledActivities++;
    }
    if (item.budgetEstimate >= 1 && item.realAwardDate != null) {
      awardedProjects++;
    }
    if (item.contract) {
      const idContractPoa = item.contract._path.segments[1];
      if (!isEmpty(idContractPoa)) {
        for (let z = 0; z < contracts.length; z++) {
          const itemContract = contracts[z];
          valorContrato = valorContrato + itemContract.valueAwarded;
        }
      }
    }
  }


  const qsIntitution = await admin.firestore().collection("Institution").get();
  const institutions = qsIntitution.docs.map((institution) => ({
    id: institution.id,
    ...institution.data(),
  }));
  let {idInstitution} = "";
  idInstitution = institutions[0].id;
  const update = {
    proyectC1: proyectC1,
    proyectC2: proyectC2,
    proyectC3: proyectC3,
    totalProyect: totalProyect,
    preparatoryProyect: preparatoryProyect,
    precontractualProjects: precontractualProjects,
    runningProjects: runningProjects,
    activitiesC1: activitiesC1,
    activitiesC2: activitiesC2,
    activitiesC3: activitiesC3,
    totalActivities: totalActivities,
    runningActivities: runningActivities,
    completedActivities: completedActivities,
    rescheduledActivities: rescheduledActivities,
    awardedProjects: awardedProjects,
    totalPOA: valorContrato,
  };
  // eslint-disable-next-line max-len
  await admin.firestore().collection("Institution").doc(idInstitution).update(update);
  res.send({status: "Success!", message: "Institution POA updated"});
};

exports.updateInstitutionPOA = onRequest(updateInstitutionPOA);
