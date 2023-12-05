const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const isEmpty = require("./utils/isEmpty");

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

const updateDepartments = async (req, res) => {
  // eslint-disable-next-line max-len
  const querySnapshot2 = await admin.firestore().collection("departments").get();
  const departments = querySnapshot2.docs.map((department) => ({
    id: department.id,
    ...department.data(),
  }));
  const querySnapshot3 = await admin.firestore().collection("poa").get();
  const poas = querySnapshot3.docs.map((poa) => ({
    id: poa.id,
    ...poa.data(),
  }));
  const querySnapshot4 = await admin.firestore().collection("contracts").get();
  const contracts = querySnapshot4.docs.map((contract) => ({
    id: contract.id,
    ...contract.data(),
  }));
  const querySnapshot5 = await admin.firestore().collection("pac").get();
  const pacs = querySnapshot5.docs.map((pac) => ({
    id: pac.id,
    ...pac.data(),
  }));
  const querySnapshot = await admin.firestore().collection("expenses").get();
  const expenses = querySnapshot.docs.map((expense) => ({
    id: expense.id,
    ...expense.data(),
  }));
  for (let i = 0; i < departments.length; i++) {
    const itemDepartment = departments[i];
    const idDepartamento = itemDepartment.id;
    let totalProjectsWithBudget = 0;
    let projectsRelevance = 0;
    let preparatoryProjects = 0;
    let precontractualProjects = 0;
    let runningProjects = 0;
    let totalBudget = 0;
    let totalActivities = 0;
    let runningActivities = 0;
    let completedActivities = 0;
    let rescheduledActivities = 0;
    let valorContrato = 0;
    let firstYearPACValue = 0;
    let secondYearPACValue = 0;
    let thirdYearPACValue = 0;
    let fourthYearPACValue = 0;
    let fifthYearPACValue = 0;
    let valorPAC = 0;
    let administrativeExpense = 0;
    let operatingExpense = 0;
    for (let j = 0; j < poas.length; j++) {
      const itemPoa = poas[j];
      const idDepartmentPoa = itemPoa.department._path.segments[1];
      if (!isEmpty(idDepartmentPoa)) {
        // eslint-disable-next-line max-len
        if (itemPoa.budgetEstimate >= 1 && idDepartamento == idDepartmentPoa) {
          totalProjectsWithBudget++;
          totalBudget = totalBudget + itemPoa.budgetEstimate;
        }
        if (
          itemPoa.budgetEstimate >= 1 &&
          idDepartamento == idDepartmentPoa &&
          (itemPoa.relevance.toLowerCase() == "enviado" ||
            itemPoa.relevance.toLowerCase() == "observado" ||
            itemPoa.relevance.toLowerCase() == "aprobado")
        ) {
          projectsRelevance++;
        }
        if (
          itemPoa.budgetEstimate >= 1 &&
          itemPoa.preparatoryProgress >= 0.01 &&
          itemPoa.preparatoryProgress < 1 &&
          idDepartamento == idDepartmentPoa
        ) {
          preparatoryProjects++;
        }
        if (
          itemPoa.budgetEstimate >= 1 &&
          itemPoa.precontractualProgress >= 0.01 &&
          itemPoa.precontractualProgress < 1 &&
          idDepartamento == idDepartmentPoa
        ) {
          precontractualProjects++;
        }
        if (
          itemPoa.budgetEstimate >= 1 &&
          itemPoa.executionProgress >= 0.01 &&
          itemPoa.executionProgress < 1 &&
          idDepartamento == idDepartmentPoa
        ) {
          runningProjects++;
        }
        if (
          // eslint-disable-next-line max-len
          (itemPoa.budgetEstimate == 0 || itemPoa.budgetEstimate == null) && idDepartamento == idDepartmentPoa
        ) {
          totalActivities++;
        }
        if (
          (itemPoa.budgetEstimate == 0 || itemPoa.budgetEstimate == null) &&
          itemPoa.activityProgress >= 0.01 &&
          itemPoa.activityProgress < 1 &&
          idDepartamento == idDepartmentPoa
        ) {
          runningActivities++;
        }
        if (
          (itemPoa.budgetEstimate == 0 || itemPoa.budgetEstimate == null) &&
          itemPoa.activityEnded == true &&
          idDepartamento == idDepartmentPoa
        ) {
          completedActivities++;
        }
        if (
          (itemPoa.budgetEstimate == 0 || itemPoa.budgetEstimate == null) &&
          itemPoa.activityRescheduled == true &&
          idDepartamento == idDepartmentPoa
        ) {
          rescheduledActivities++;
        }
        if (itemPoa.contract) {
          const idContractPoa = itemPoa.contract._path.segments[1];
          if (!isEmpty(idContractPoa)) {
            for (let z = 0; z < contracts.length; z++) {
              const itemContract = contracts[z];
              valorContrato = valorContrato + itemContract.valueAwarded;
            }
          }
        }
      }
    }
    let itemPac = {};
    for (let c = 0; c < pacs.length; c++) {
      itemPac = pacs[c];
      const idDepartmentPac = itemPac.department._path.segments[1];
      if (!isEmpty(idDepartmentPac)) {
        if (idDepartamento == idDepartmentPac) {
          firstYearPACValue = firstYearPACValue + itemPac.pacByYear[0].value;
          secondYearPACValue = secondYearPACValue + itemPac.pacByYear[1].value;
          thirdYearPACValue = thirdYearPACValue + itemPac.pacByYear[2].value;
          fourthYearPACValue = fourthYearPACValue + itemPac.pacByYear[3].value;
          fifthYearPACValue = fifthYearPACValue + itemPac.pacByYear[4].value;
          valorPAC = valorPAC + itemPac.totalCost;
        }
      }
    }
    for (let h = 0; h < expenses.length; h++) {
      const itemExpense = expenses[h];
      if (!isEmpty(itemExpense.department)) {
        const idDepartmentExpense = itemExpense.department._path.segments[1];
        if (!isEmpty(idDepartmentExpense)) {
          if (idDepartamento == idDepartmentExpense) {
            if (itemExpense.category == "Operativo") {
              operatingExpense = operatingExpense + itemExpense.Value;
            } else if (itemExpense.category == "Administrativo") {
              administrativeExpense = administrativeExpense + itemExpense.Value;
            }
          }
        }
      }
    }
    const update = {
      totalProjectsWithBudget: totalProjectsWithBudget,
      projectsRelevance: projectsRelevance,
      preparatoryProjects: preparatoryProjects,
      precontractualProjects: precontractualProjects,
      runningProjects: runningProjects,
      totalBudget: totalBudget,
      totalProjectsWithoutBudget: totalActivities,
      runningActivities: runningActivities,
      completedActivities: completedActivities,
      rescheduledActivities: rescheduledActivities,
      totalPAC: valorPAC,
      totalPOA: valorContrato,
      pacByYear: [
        {
          year: parseInt(itemPac.year),
          value: firstYearPACValue,
        },
        {
          year: parseInt(itemPac.year + 1),
          value: secondYearPACValue,
        },
        {
          year: parseInt(itemPac.year + 2),
          value: thirdYearPACValue,
        },
        {
          year: parseInt(itemPac.year + 3),
          value: fourthYearPACValue,
        },
        {
          year: parseInt(itemPac.year + 4),
          value: fifthYearPACValue,
        },
      ],
      administrativeExpenseTotal: administrativeExpense,
      operatingExpenseTotal: operatingExpense,
    };
    // eslint-disable-next-line max-len
    await admin.firestore().collection("departments").doc(idDepartamento).update(update);
    totalProjectsWithBudget = 0;
    projectsRelevance = 0;
    preparatoryProjects = 0;
    precontractualProjects = 0;
    runningProjects = 0;
    totalBudget = 0;
    totalActivities = 0;
    runningActivities = 0;
    completedActivities = 0;
    rescheduledActivities = 0;
    valorContrato = 0;
    firstYearPACValue = 0;
    secondYearPACValue = 0;
    thirdYearPACValue = 0;
    fourthYearPACValue = 0;
    fifthYearPACValue = 0;
    valorPAC = 0;
    administrativeExpense = 0;
    operatingExpense = 0;
  }
  res.send({status: "success!!", message: "departments updated"});
};

exports.updateDepartments = onRequest(updateDepartments);
