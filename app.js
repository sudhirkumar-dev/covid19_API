const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const reportSnakeToCamelCase = (dbObject) => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  };
};

// app.get("/states/", async (req, res) => {
//   const getStatesQuery = `
//     SELECT state_name FROM state;`;
//   const statesArray = await database.all(getStatesQuery);
//   res.send(
//     statesArray.map((eachState) => ({ stateName: eachState.state_name }))
//   );
// });

app.get("/states/", async (req, res) => {
  const allStatesList = `SELECT * FROM state ORDER_BY state_id;`;
  const statesList = await database.all(allStatesList);
  const statesResult = statesList.map((eachObject) => {
    return convertStateDbObjectToResponseObject(eachObject);
  });
  res.send(statesResult);
});

app.get("/states/:stateId/", async (req, res) => {
  const { stateId } = req.params;
  const getStateQuery = `
    SELECT * FROM state WHERE state_id = ${stateId};`;
  const state = await database.get(getStateQuery);
  res.send(convertStateDbObjectToResponseObject(state));
});

app.post("/districts/", async (req, res) => {
  const { districtName, stateId, cases, cured, active, deaths } = req.body;
  const postDistrictQuery = `
  INSERT INTO district (district_name,state_id,cases,cured,active,deaths) 
  VALUES
  ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}');`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const getDistrictQuery = `
    SELECT * FROM district WHERE district_id= ${districtId};`;
  const district = await database.get(getDistrictQuery);
  res.send(convertDistrictDbObjectToResponseObject(district));
});

app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const deleteDistrictQuery = `
    DELETE FROM district WHERE district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  res.send("District Removed");
});

app.put("/districts/:districtId/", async (req, res) => {
  const { districtName, stateId, cases, cured, active, deaths } = req.body;
  const { districtId } = req.params;
  const updateDistrictQuery = `
            UPDATE
              district
            SET
              district_name = ${districtName},
              state_id = '${stateId}',
              cases = '${cases}',
              cured = '${cured}',
              active = '${active}',
              deaths = '${deaths}'
            WHERE
              district_id = ${districtId};`;

  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (req, res) => {
  const { stateId } = req.params;
  const getStateStatQuery = `SELECT 
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM
        district
    WHERE
        state_id = ${stateId};`;
  const stats = await database.get(getStateStatQuery);
  console.log(stats);
  res.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (req, res) => {
  const { districtId } = req.params;
  const getDistrictId = `
    SELECT state_id FROM district WHERE district_id = ${districtId};`;
  const getDistrictQueryResponse = await database.get(getDistrictId);

  const getStateName = `SELECT state_name AS stateName FROM state WHERE state_id = ${getDistrictQueryResponse.state_id};`;
  const getResult = await database.get(getStateName);
  res.send(getResult);
});

module.exports = app;
