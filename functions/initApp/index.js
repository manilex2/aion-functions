const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const {getFirestore} = require("firebase-admin/firestore");
const XLSX = require("xlsx");

admin.initializeApp();
setGlobalOptions({
  maxInstances: 10,
  timeoutSeconds: 540,
  memory: "1GiB",
});

const initApp = async (req, res) => {
  const auth = admin.auth();
  const db = getFirestore();
  const batch = db.batch();
  //    const excel = XLSX.read(await (await fetch(`${req.body.excelURL}`)).arrayBuffer());
  const excel = XLSX.readFile("/Users/danneira/Desktop/Proyectos/aion-functions/functions/initApp/Matriz AION.xlsx", {});
  const nombreHoja = excel.SheetNames;
  let instituciones = [];
  let departamentos;
  let responsables;
  let roles;
  let poas;
  let pacs;
  instituciones = XLSX.utils.sheet_to_json(excel.Sheets[nombreHoja[0]]);
  departamentos = XLSX.utils.sheet_to_json(excel.Sheets[nombreHoja[1]]);
  roles = XLSX.utils.sheet_to_json(excel.Sheets[nombreHoja[2]]);
  responsables = XLSX.utils.sheet_to_json(excel.Sheets[nombreHoja[3]]);
  poas = XLSX.utils.sheet_to_json(excel.Sheets[nombreHoja[4]]);
  pacs = XLSX.utils.sheet_to_json(excel.Sheets[nombreHoja[5]]);
  let rolesContainer = [];
  const users = (await db.collection("users").get()).docs.map((user) => {
    return user.data();
  });
  for (let j = instituciones.length - 1; j >= 0; j--) {
    delete instituciones[j].LEYENDA;
    delete instituciones[j].__EMPTY_1;
    if (Object.entries(instituciones[j]).length === 0) {
      delete instituciones[j];
    }
    if (instituciones[j] === undefined) {
      instituciones.splice(j, 1);
    }
  }
  for (let j = departamentos.length - 1; j >= 0; j--) {
    delete departamentos[j].LEYENDA;
    delete departamentos[j].__EMPTY_1;
    if (Object.entries(departamentos[j]).length === 0) {
      delete departamentos[j];
    }
    if (departamentos[j] === undefined) {
      departamentos.splice(j, 1);
    }
  }
  for (let j = roles.length - 1; j >= 0; j--) {
    delete roles[j].LEYENDA;
    delete roles[j].__EMPTY_1;
    if (Object.entries(roles[j]).length === 0) {
      delete roles[j];
    }
    if (roles[j] === undefined) {
      roles.splice(j, 1);
    }
  }
  for (let j = responsables.length - 1; j >= 0; j--) {
    delete responsables[j].LEYENDA;
    delete responsables[j].__EMPTY_1;
    if (Object.entries(responsables[j]).length === 0) {
      delete responsables[j];
    }
    if (responsables[j] === undefined) {
      responsables.splice(j, 1);
    }
  }
  for (let j = poas.length - 1; j >= 0; j--) {
    delete poas[j].LEYENDA;
    delete poas[j].__EMPTY_1;
    if (Object.entries(poas[j]).length === 0) {
      delete poas[j];
    }
    if (poas[j] === undefined) {
      poas.splice(j, 1);
    }
  }
  for (let j = pacs.length - 1; j >= 0; j--) {
    delete pacs[j].LEYENDA;
    delete pacs[j].__EMPTY_1;
    if (Object.entries(pacs[j]).length === 0) {
      delete pacs[j];
    }
    if (pacs[j] === undefined) {
      pacs.splice(j, 1);
    }
  }
  for (let rol of roles) {
    let rolFormated = {};
    let newlistaVistas;
    let newlistaPermisos;
    const listaVistas = rol.vistas.split("*");
    const rolesFiltrado = listaVistas.filter((valor) => {
      if (valor === null || valor === undefined || valor === 0 || valor === false) {
          return false;
      }
      if (typeof valor === "string" && valor.trim() === "") {
          return false;
      }
      return true;
    });
    newlistaVistas = rolesFiltrado.map((vista) => {
      return vista.trim();
    });
    const listaPermisos = rol.permisos.split("*");
    const permisosFiltrado = listaPermisos.filter((valor) => {
      if (valor === null || valor === undefined || valor === 0 || valor === false) {
          return false;
      }
      if (typeof valor === "string" && valor.trim() === "") {
          return false;
      }
      return true;
    });
    newlistaPermisos = permisosFiltrado.map((permiso) => {
      return permiso.trim();
    });
    const permisos = [];
    for (let i = 0; i < newlistaVistas.length; i++) {
      const vista = newlistaVistas[i];
      const permiso = newlistaPermisos[i];
      permisos.push({
          permiso: `${vista}`,
          lectura: permiso[0] == 1? true : false,
          escritura: permiso[1] == 1? true : false,
          edicion: permiso[2] == 1? true : false,
          eliminacion: permiso[3] == 1? true : false,
      })
    }
    rolFormated = {
      rolName: rol.nombre,
      permisos
    }
    const newRolRef = db.collection("roles").doc(`${rol.nombre}`);
    batch.set(newRolRef, rolFormated);
    rolesContainer.push({id: newRolRef.id});
  }
  for (let institucion of instituciones) {
    let newlistaValuesString;
    let newlistaPlanes;
    if (institucion.valores) {
      const listaValuesString = institucion.valores.split(",");
      const arrayFiltrado = listaValuesString.filter((valor) => {
        if (valor === null || valor === undefined || valor === 0 || valor === false) {
          return false;
        }
        if (typeof valor === "string" && valor.trim() === "") {
          return false;
        }
        return true;
      });
      newlistaValuesString = arrayFiltrado.map((valores) => {
        return valores.trim();
      });
    }
    const listaPlanes = institucion.planActivo.split("*");
    const planesFiltrado = listaPlanes.filter((valor) => {
      if (valor === null || valor === undefined || valor === 0 || valor === false) {
        return false;
      }
      if (typeof valor === "string" && valor.trim() === "") {
        return false;
      }
      return true;
    });
    newlistaPlanes = planesFiltrado.map((plan) => {
      return plan.trim();
    });
    const planActivo = {};
    for (let i = 0; i < newlistaPlanes.length; i++) {
      const element = newlistaPlanes[i];
      planActivo[element] = true;
    }
    institucion = {
      Name: institucion.nombre,
      Logo: institucion.logo,
      Mission: institucion.mision,
      Vision: institucion.vision,
      Values: newlistaValuesString? newlistaValuesString : null,
      year: institucion.year,
      proyectC1: 0,
      proyectC2: 0,
      proyectC3: 0,
      totalProyect: 0,
      preparatoryProyect: 0,
      precontractualProjects: 0,
      activitiesC1: 0,
      activitiesC2: 0,
      activitiesC3: 0,
      totalActivities: 0,
      runningActivities: 0,
      completedActivities: 0,
      rescheduledActivities: 0,
      awardedProjects: 0,
      contractsToExpire: 0,
      totalContracts: 0,
      runningProjects: 0,
      runningContracts: 0,
      expiredContracts: 0,
      completeContracts: 0,
      runningDocs: 0,
      DocsToExpire: 0,
      expiredDocs: 0,
      endedDocs: 0,
      totalDocs: 0,
      budgetTotal: 0,
      budgetExecutionPlanned: 0,
      budgetExecutionReal: 0,
      contractsRecurrent: 0,
      contractsSignedCurrentYear: 0,
      totalPAC: 0,
      contractors: 0,
      shareholders: 0,
      totalPOA: 0,
      administrativeExpenseTotal: 0,
      operatingExpenseTotal: 0,
      planActivo: {...planActivo}
    }
    const newInstRef = db.collection("Institution").doc();
    batch.set(newInstRef, institucion);
    for (let departamento of departamentos) {
      if (institucion.nombre == departamento.institucion) {
        departamento = {
            departmentName: departamento.nombre,
            code: departamento.codigo,
            icon: departamento.icono
        }
        
      }
    }
  }
  try {
    //await batch.commit();
    console.log("Documentos agregados exitosamente");
    res.status(200).send({status: "Success!", message: "Función ejecutada correctamente"});
  } catch (error) {
    console.error("Error al agregar documentos:", error);
    res.status(423).send({status: "Error!", message: error.message});
  }
};

exports.initApp = onRequest(initApp);