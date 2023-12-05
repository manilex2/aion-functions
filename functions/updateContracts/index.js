const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const isEmpty = require("./utils/isEmpty");

const code = 200;
const status = "Success!!";
const message = "All good";

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

const updateContracts = async (req, res) => {
  const querySnapshot = await admin.firestore().collection("contracts").get();
  const contracts = querySnapshot.docs.map((contract) => ({
    id: contract.id,
    ...contract.data(),
  }));
  const querySnapshot5 = await admin.firestore().collection("poa").get();
  const poas = querySnapshot5.docs.map((poa) => ({
    id: poa.id,
    ...poa.data(),
  }));
  const fechaActual = new Date();
  let progressPayments = 0;
  for (let i = 0; i < contracts.length; i++) {
    const it = contracts[i];
    // eslint-disable-next-line max-len
    const fechaStartContract = new Date(it.contractStartDate._seconds * 1000).getTime();
    const diff = Math.round((fechaActual - fechaStartContract)/(1000*60*60*24));
    const diferencia = parseFloat((diff/it.term).toFixed(2));
    let total = 0;
    if (!isEmpty(it.payments)) {
      for (let j = 0; j < it.payments.length; j++) {
        const itemPayments = it.payments[j];
        total = total + itemPayments.PaymentValue;
      }
    }
    if (!isEmpty(it.totalPaid)) {
      progressPayments = it.totalPaid/it.valueAwarded;
      console.log(it.totalPaid, it.valueAwarded, progressPayments);
    }
    let executionProgress = 0;
    for (let z = 0; z < poas.length; z++) {
      const itemPoa = poas[z];
      if (itemPoa.contract) {
        const idContractPoa = itemPoa.contract._path.segments[1];
        if (!isEmpty(idContractPoa)) {
          if (it.id == idContractPoa) {
            executionProgress = executionProgress + progressPayments;
            console.log(executionProgress);
            const update1 = {
              executionProgress: executionProgress,
            };
            // eslint-disable-next-line max-len
            await admin.firestore().collection("poas").doc(itemPoa.id).update(update1);
          }
        }
      }
    }
    const update = {
      totalPaid: total,
      progressTerm: diferencia,
    };
    // eslint-disable-next-line max-len
    await admin.firestore().collection("contracts").doc(it.id).update(update);
  }
  res.status(code).send({status: status, message: message});
};

exports.updateContracts = onRequest(updateContracts);
