import { Clerk } from "@clerk/backend";
import clerkAPIKey from "./clerkAPIKey.js";
import express from "express";
import cors from "cors";
import pg from "pg";

const server = express();
server.use(cors());
server.use(express.json());

const clerk = Clerk({
    apiKey: clerkAPIKey,
});

const validateUserTokenMiddleware = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) {
        res.status(401).send({ error: "Authorization header not specified!" });
        return;
    }

    const headerParts = header.split(" ");
    if (headerParts.length !== 2) {
        res.status(401).send({
            error: `Malformed Authorization header - expected two words, found ${headerParts.length}`,
        });
        return;
    }

    if (headerParts[0] !== "Bearer") {
        res.status(401).send({
            error: `Malformed Authorization header - expected Bearer scheme, found ${headerParts[0]}`,
        });
        return;
    }

    const token = headerParts[1];
    if (token.length === 0) {
        res.status(401).send({
            error: "Malformed Authorization header - missing token!",
        });
        return;
    }

    const publicKey = fs.readFileSync("./clerk-public-key.pem", {
        encoding: "utf-8",
    });
    let decoded;
    try {
        decoded = jwt.verify(token, publicKey);
        console.log(decoded);
    } catch (err) {
        console.error("Error validating token:", error.message);
        res.status(401).json({
            error: "Malformed Authorization header - invalid token!",
        });
        return;
    }

    const userDetails = await clerk.users.getUser(decoded.sub);

    req.auth = { clerkUserID: decoded.sub, userDetails };

    next();
};

const db = new pg.Client({
    database: "Therapist",
});

// process.env.DATABASE_URL
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
