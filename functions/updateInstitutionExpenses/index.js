const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

const updateInstitutionExpenses = async (req, res) => {
  // if (!await authMiddleware.validateFirebaseIdToken(request, response)) {
  // return;
  // }
  const querySnapshot1 = await admin.firestore().collection("expenses").get();
  const expenses = querySnapshot1.docs.map((expense) => ({
    id: expense.id,
    ...expense.data(),
  }));
  let administrativeExpense = 0;
  let operatingExpense = 0;

  for (let c = 0; c < expenses.length; c++) {
    const itemExpense = expenses[c];
    if (itemExpense.category == "Operativo") {
      operatingExpense = operatingExpense + itemExpense.Value;
    } else if (itemExpense.category == "Administrativo") {
      administrativeExpense = administrativeExpense + itemExpense.Value;
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
    administrativeExpenseTotal: administrativeExpense,
    operatingExpenseTotal: operatingExpense,
  };
  console.log(update);
  // eslint-disable-next-line max-len
  await admin.firestore().collection("Institution").doc(idInstitution).update(update);
  res.send({status: "Success!", message: "Institution Expenses updated"});
};

exports.updateInstitutionExpenses = onRequest(updateInstitutionExpenses);

