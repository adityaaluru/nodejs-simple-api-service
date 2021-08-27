//All imports
const express = require("express");
const Ajv = require("ajv");
const fs = require("fs").promises;
const uuid = require("uuid").v4;

//Load express and create router
const router = express.Router();

//Load Ajv a validation library and define schema for book
const ajv = new Ajv({ allErrors: true });

//Other initializations
const encoding = "utf-8";

//READ the resource

router.get("/:resource", async (req, res) => {
  const resource = req.params.resource;
  let result = {};

  try {
    const fileContents = await readResources(resource);
    result = JSON.parse(fileContents);
    res.status(200);
  } catch (err) {
    console.log("Error: ", err);
    res.status(404);
    result.error = err.message;
  }
  res.send(result);
});

router.get("/:resource/:id", async (req, res) => {
  const resource = req.params.resource;
  const id = req.params.id;
  let result = {};

  try {
    const fileContents = await readResources(resource);
    const movie = JSON.parse(fileContents).filter((movie) => movie._id === id);
    if (movie.length > 0) {
      result = movie[0];
      res.status(200);
    } else {
      res.status(404);
      result.error = "Resource ID not found!";
    }
  } catch (err) {
    console.log("Error: ", err);
    res.status(404);
    result.error = err.message;
  }
  res.send(result);
});

//DELETE the resource

router.delete("/:resource/:id", async (req, res) => {
  const resource = req.params.resource;
  const id = req.params.id;
  let result = {};

  try {
    const fileContents = await readResources(resource);
    const movies = JSON.parse(fileContents).filter((movie) => movie._id !== id);
    await saveResources(resource, movies);

    res.status(200);
  } catch (err) {
    console.log("Error: ", err);
    res.status(500);
    result.error = err.message;
  }
  res.send(result);
});

//CREATE the resource

router.post("/:resource", async (req, res) => {
  const resource = req.params.resource;
  const movieToCreate = req.body;
  let result = {};
  try {
    const fileContents = await readResources(resource);
    const savedMovies = JSON.parse(fileContents);

    //validate the schema
    const validationResult = await validateResource(resource, movieToCreate);
    if (!validationResult.isValid) {
      let errMsg = "";
      validationResult.errors.forEach((err) => (errMsg = err + "," + errMsg));
      throw new Error("Invalid payload! Details: " + errMsg);
    }

    //create resource
    movieToCreate._id = uuid();
    const movies = [movieToCreate, ...savedMovies];
    await saveResources(resource, movies);

    result = movieToCreate;
    res.status(200);
  } catch (err) {
    console.log("Error: ", err);
    res.status(500);
    result.error = err.message;
  }
  res.send(result);
});

//UPDATE the resource

router.put("/:resource/:id", async (req, res) => {
  const resource = req.params.resource;
  const id = req.params.id;
  const movieToUpdate = req.body;
  movieToUpdate._id = id;
  let result = {};

  try {
    const fileContents = await readResources(resource);

    //validate the schema
    const validationResult = await validateResource(resource, movieToUpdate);
    if (!validationResult.isValid) {
      let errMsg = "";
      validationResult.errors.forEach((err) => (errMsg = err + "," + errMsg));
      throw new Error("Invalid payload! Details: " + errMsg);
    }

    const updatedMovies = JSON.parse(fileContents).map((movie) => {
      return movie._id === id ? movieToUpdate : movie;
    });

    await saveResources(resource, updatedMovies);

    result = movieToUpdate;
    res.status(200);
  } catch (err) {
    console.log("Error: ", err);
    res.status(500);
    result.error = err.message;
  }
  res.send(result);
});

//Resource validator

router.post("/validate/:resource", async (req, res) => {
  const resourceName = req.params.resource;
  const resource = req.body;
  let result = {};

  result = await validateResource(resourceName, resource);
  res.status(200).send(result);
});

//Utility functions

let readResources = async function (resourceName) {
  const fileContents = await fs.readFile(`./mock/${resourceName}.json`, {
    encoding,
  });
  return fileContents;
};

let saveResources = async function (resourceName, resources) {
  await fs.writeFile(
    `./mock/${resourceName}.json`,
    JSON.stringify(resources, null, 2),
    encoding
  );
};

let validateResource = async function (resourceName, resource) {
  const validationResult = {};
  try {
    const resourceSchema = await fs.readFile(`./mock/${resourceName}.schema`, {
      encoding,
    });

    const valid = ajv.validate(JSON.parse(resourceSchema), resource);
    if (valid) {
      validationResult.isValid = true;
    } else {
      validationResult.isValid = false;
      validationResult.errors = [];
      for (let i = 0; i < ajv.errors.length; i++) {
        validationResult.errors.push(
          `${ajv.errors[i].instancePath} ${ajv.errors[i].message}`
        );
      }
    }
  } catch (err) {
    console.log("Error: ", err);
    validationResult.isValid = false;
    validationResult.message = err.message;
  }
  return validationResult;
};

module.exports = router;
