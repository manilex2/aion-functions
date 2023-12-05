const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

const updatePAC = async (req, res) => {
  // if (!await authMiddleware.validateFirebaseIdToken(request, response)) {
  // return;
  // }
  const querySnapshot5 = await admin.firestore().collection("pac").get();
  const pacs = querySnapshot5.docs.map((pac) => ({
    id: pac.id,
    ...pac.data(),
  }));
  let totalPAC = 0;
  for (let c = 0; c < pacs.length; c++) {
    const itemPac = pacs[c];
    for (let d = 0; d < itemPac.pacByYear.length; d++) {
      const year = itemPac.pacByYear[d];
      totalPAC = totalPAC + year.value;
    }
    const update = {
      totalCost: totalPAC,
    };
    await admin.firestore().collection("pac").doc(itemPac.id).update(update);
    totalPAC = 0;
  }
  res.send({status: "Success!", message: "PAC updated"});
};

exports.updatePAC = onRequest(updatePAC);
