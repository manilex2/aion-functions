/* eslint-disable max-len */
const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const isEmpty = require("./utils/isEmpty");

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

const updatePOAByMonth = async (req, res) => {
  // if (!await authMiddleware.validateFirebaseIdToken(request, response)) {
  // return;
  // }
  const querySnapshot = await admin.firestore().collection("poa").get();
  const poas = querySnapshot.docs.map((poa) => ({
    id: poa.id,
    ...poa.data(),
  }));
  const querySnapshot2 = await admin.firestore().collection("poaByMonth").get();
  const poaByMonth = querySnapshot2.docs.map((poaByMonth) => ({
    id: poaByMonth.id,
    ...poaByMonth.data(),
  }));
  let projectsStarted = 0;
  for (let i = 0; i < poaByMonth.length; i++) {
    const itemPoaByMonth = poaByMonth[i];
    const month = new Date(itemPoaByMonth.month._seconds * 1000).getMonth() + 1;
    const year = new Date(itemPoaByMonth.month._seconds * 1000).getFullYear();
    for (let p = 0; p < poas.length; p++) {
      const itemPoa = poas[p];
      if (!isEmpty(itemPoa.realProjectStartDate)) {
        const monthPOA = new Date(itemPoa.realProjectStartDate._seconds * 1000).getMonth() + 1;
        const yearPOA = new Date(itemPoa.realProjectStartDate._seconds * 1000).getFullYear();
        if ((month === monthPOA) && (year === yearPOA)) {
          projectsStarted++;
        }
      }
    }
    const update = {
      ProjectsStarted: projectsStarted,
    };
    await admin.firestore().collection("poaByMonth").doc(itemPoaByMonth.id).update(update);
    projectsStarted = 0;
  }
  res.send({status: "Success!!", message: "POA By Month updated"});
};

exports.updatePOAByMonth = onRequest(updatePOAByMonth);
