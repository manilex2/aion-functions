const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const isEmpty = require("./utils/isEmpty");

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

const updatePOA = async (req, res) => {
  // if (!await authMiddleware.validateFirebaseIdToken(request, response)) {
  // return;
  // }
  const querySnapshot = await admin.firestore().collection("poa").get();
  const poas = querySnapshot.docs.map((poa) => ({
    id: poa.id,
    ...poa.data(),
  }));
  const querySnapshot4 = await admin.firestore().collection("contracts").get();
  const contracts = querySnapshot4.docs.map((contract) => ({
    id: contract.id,
    ...contract.data(),
  }));
  for (let i = 0; i < poas.length; i++) {
    const itemPoa = poas[i];
    let projectStartDate = 0;
    let relevanceResponseDate = 0;
    let estimatedDatePublicationPortal = 0;
    let estimatedContractSigningDate = 0;
    let currentPeriod = 0;
    let totalPaid = 0;

    if (!isEmpty(itemPoa.estimatedAwardDate)) {
      let EAD = new Date(itemPoa.estimatedAwardDate._seconds * 1000);
      projectStartDate = EAD.setDate(EAD.getDate() - 120);

      EAD = new Date(itemPoa.estimatedAwardDate._seconds * 1000);
      relevanceResponseDate = EAD.setDate(EAD.getDate() - 40);

      EAD = new Date(itemPoa.estimatedAwardDate._seconds * 1000);
      estimatedDatePublicationPortal = EAD.setDate(EAD.getDate() - 30);

      EAD = new Date(itemPoa.estimatedAwardDate._seconds * 1000);
      estimatedContractSigningDate = EAD.setDate(EAD.getDate() + 15);

      if (itemPoa.currentPeriod == 0 || !itemPoa.currentPeriod) {
        currentPeriod = itemPoa.initialPeriod;
      }

      if (itemPoa.contract) {
        const idContractPoa = itemPoa.contract._path.segments[1];
        if (!isEmpty(idContractPoa)) {
          for (let z = 0; z < contracts.length; z++) {
            const itemContract = contracts[z];
            totalPaid = totalPaid + itemContract.totalPaid;
          }
        }
      }
      const update = {
        projectStartDate: new Date(projectStartDate),
        relevanceResponseDate: new Date(relevanceResponseDate),
        estimatedDatePublicationPortal: new Date(
            estimatedDatePublicationPortal,
        ),
        estimatedContractSigningDate: new Date(estimatedContractSigningDate),
        currentPeriod: currentPeriod,
        totalPaidContract: totalPaid,
      };

      await admin.firestore().collection("poa").doc(itemPoa.id).update(update);
    }
  }

  res.send({status: "Success!!", message: "POA updated"});
};

exports.updatePOA = onRequest(updatePOA);
