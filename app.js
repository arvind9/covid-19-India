const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const databasePath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log('DB Error: ${e.message}')
    process.exit(1)
  }
}

initializeDBAndServer()

// API - 1 GET request method
app.get('/states/', async (request, response) => {
  const listOfAllStatesQuery = `SELECT state_id as stateId, state_name as stateName, population FROM state;`
  const allStates = await db.all(listOfAllStatesQuery)
  response.send(allStates)
})

// API - 2
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getRequestedStateQuery = `
  SELECT 
    state_id as stateId, state_name as stateName, population 
  FROM 
    state 
  WHERE 
    state_id=${stateId}`
  const requestedState = await db.get(getRequestedStateQuery)
  response.send(requestedState)
})

// API - 3 POST METHOD
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const cteateDistrictQuery = `
  INSERT INTO 
    district (district_name, state_id, cases, cured, active, deaths) 
  VALUES 
    ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`
  await db.run(cteateDistrictQuery)
  response.send('District Successfully Added')
})

// API - 4 GET
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictDetailsQuery = `
  SELECT 
    district_id as districtId, district_name as districtName, state_id as stateId, cases, cured, active, deaths
  FROM 
    district
  WHERE
    district_id=${districtId};
  `
  const districts = await db.all(getDistrictDetailsQuery)
  response.send(...districts)
})

// API - 5 DELETE METHOD
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE FROM 
    district 
  WHERE 
    district_id=${districtId};`
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

// API - 6 PUT METHOD
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const updateDistrict = request.body
  const {districtName, stateId, cases, cured, active, deaths} = updateDistrict
  const updateDistrictQuery = `
  UPDATE 
    district 
  SET 
    district_name='${districtName}', state_id=${stateId}, cases=${cases}, cured=${cured}, active=${active}, deaths=${deaths} 
  WHERE 
    district_id=${districtId} `
  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

// API - 7 GET METHOD
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const statisticsCasesDistrictQuery = `
  SELECT 
    SUM(cases) as totalCases, SUM(cured) as totalCured, SUM(active) as totalActive, SUM(deaths) as totalDeaths 
  FROM 
    district
  WHERE 
    state_id=${stateId} `
  const totalCases = await db.all(statisticsCasesDistrictQuery)
  response.send(...totalCases)
})

// API - 8 GET
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const stateNameQuery = `
  SELECT 
    state_name as stateName 
  FROM 
    district JOIN state ON district.state_id=state.state_id 
  WHERE 
    district_id=${districtId}
  `
  const state = await db.get(stateNameQuery)
  response.send(state)
})

module.exports = app
