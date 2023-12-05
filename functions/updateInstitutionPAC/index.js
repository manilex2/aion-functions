const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

const updateInstitutionPAC = async (req, res) => {
  // if (!await authMiddleware.validateFirebaseIdToken(request, response)) {
  // return;
  // }
  const querySnapshot5 = await admin.firestore().collection("pac").get();
  const pacs = querySnapshot5.docs.map((pac) => ({
    id: pac.id,
    ...pac.data(),
  }));
  const querySnapshot1 = await admin.firestore().collection("expenses").get();
  const expenses = querySnapshot1.docs.map((expense) => ({
    id: expense.id,
    ...expense.data(),
  }));
  let firstYearPACValue = 0;
  let secondYearPACValue = 0;
  let thirdYearPACValue = 0;
  let fourthYearPACValue = 0;
  let fifthYearPACValue = 0;
  let totalPAC = 0;
  let itemPac = {};
  let budgetTotal = 0;

  for (let c = 0; c < pacs.length; c++) {
    itemPac = pacs[c];
    firstYearPACValue = firstYearPACValue + itemPac.pacByYear[0].value;
    secondYearPACValue = secondYearPACValue + itemPac.pacByYear[1].value;
    thirdYearPACValue = thirdYearPACValue + itemPac.pacByYear[2].value;
    fourthYearPACValue = fourthYearPACValue + itemPac.pacByYear[3].value;
    fifthYearPACValue = fifthYearPACValue + itemPac.pacByYear[4].value;
    totalPAC = totalPAC + itemPac.totalCost;
    for (let d = 0; d < itemPac.pacByYear.length; d++) {
      const year = itemPac.pacByYear[d];
      if (itemPac.year == year.year) {
        budgetTotal = budgetTotal + year.value;
      }
    }
  }
  for (let i = 0; i < expenses.length; i++) {
    const itemExpense = expenses[i];
    if (itemPac.year == itemExpense.year) {
      budgetTotal = budgetTotal + itemExpense.Value;
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
    budgetTotal: budgetTotal,
    pacByYear: [
      {
        year: parseInt(itemPac.year),
        value: firstYearPACValue,
      },
      {
        year: parseInt(itemPac.year+1),
        value: secondYearPACValue,
      },
      {
        year: parseInt(itemPac.year+2),
        value: thirdYearPACValue,
      },
      {
        year: parseInt(itemPac.year+3),
        value: fourthYearPACValue,
      },
      {
        year: parseInt(itemPac.year+4),
        value: fifthYearPACValue,
      },
    ],
    totalPAC: totalPAC,
  };
  // eslint-disable-next-line max-len
  await admin.firestore().collection("Institution").doc(idInstitution).update(update);
  res.send({status: "Success!", message: "Institution PAC updated"});
};

exports.updateInstitutionPAC = onRequest(updateInstitutionPAC);

