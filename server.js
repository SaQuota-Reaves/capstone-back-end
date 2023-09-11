const express = require("express");
const cors = require("cors");
const pg = require("pg");

const server = express();
server.use(cors());
server.use(express.json());

const db = new pg.Client({
    database: "Therapist",
});

db.connect();

server.get("/", (req, res) => {
    res.send({ server: "online" });
});

const getSpecialties = async () => {
    const allSpec = [];
    const query = await db.query(`SELECT speciality_name FROM therapist`);
    for (const therapist of query.rows) {
        console.log(typeof therapist.speciality_name);
        const specArr = therapist.speciality_name.split(", ");
        allSpec.push(...specArr);
    }

    const deduped = [...new Set(allSpec)].map((spec) => {
        return `<input type="checkbox" name="${spec}"/>${spec}`;
    });
    console.log(deduped.join("<br/>\n"));
};

server.get("/spec", async (req, res) => {
    const allSpec = [];
    const query = await db.query(`SELECT speciality_name FROM therapist`);
    for (const therapist of query.rows) {
        // console.log(typeof therapist.speciality_name);
        const specArr = therapist.speciality_name.split(", ");
        allSpec.push(...specArr);
    }
    const deduped = [...new Set(allSpec)];

    res.send({ spec: deduped });
});

// getSpecialties();

server.post("/databaseSearch", async (req, res) => {
    let keysToSearchFor = [];
    console.log(req.body);
    for (const [key, value] of Object.entries(req.body)) {
        if (value === true) {
            keysToSearchFor.push(`speciality_name ILIKE '%${key}%' `);
        }
    }
    const query = `SELECT * FROM therapist WHERE ${keysToSearchFor.join(
        " OR "
    )}`;

    console.log(query);
    const results = await db.query(query);
    // const results = await db.query(
    //     `SELECT * FROM therapist WHERE state_of_practice='${req.body.query}'`
    // );
    res.send({ therapists: results.rows });
});

server.get("/therapist", async (req, res) => {
    const result = await db.query("SELECT * FROM therapist");
    res.send({ therapist: result.rows });
});
server.listen(3008, () => {
    console.log("Server online at port 3008");
});
