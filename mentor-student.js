require("dotenv").config()
const express = require("express")
const mongodb = require("mongodb")
const mongoClient = mongodb.MongoClient;
const URL ="mongodb+srv://rajeswaran:SCh7z3WIXSBqbDRx@cluster0.gp4oq.mongodb.net/student-mentor?retryWrites=true&w=majority"
const {param} = require("express/lib/request");
const app = express();

app.get("/",(req,res) => {
    res.send("Webserver start running")
});

app.use(express.json());

app.get("/mentor",(req,res) => {
    mongoClient.connect(URL,(err,client) => {
        if(err) throw err;
        let db = client.db("student-mentor");
        db.collection("mentor")
        .find()
        .toArray()
        .then((data) => {
            res.status(200).json(data);
        })
        .catch((error) => {
            res.status(400).json({
                message: "Data not found",
                error,
            })
        })
    })
})

app.get("/student", (req, res) => {
    mongoClient.connect(URL, (err, client) => {
      if (err) throw err;
      let db = client.db("student-mentor");
      db.collection("student")
        .find()
        .toArray()
        .then((data) => {
          res.status(200).json(data);
        })
        .catch((error) => {
          res.status(400).json({
            message: "Data not found",
            error,
          });
        });
    });
  });

  app.post("/create-mentor", async (req, res) => {
    try {
      let client = await mongoClient.connect(URL);
      let db = client.db("student-mentor");
      await db.collection("mentor").insertOne(req.body);
      res.status(200).json({
        message: "Mentor created",
      });
      client.close();
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  });

  app.post("/create-student", async (req, res) => {
    try {
      let client = await mongoClient.connect(URL);
      let db = client.db("student-mentor");
      await db.collection("student").insertOne(req.body);
      res.status(200).json({
        message: "Student created",
      });
      client.close();
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  });

  app.put("/update-mentor/:name", async (req, res) => {
    try {
      let name = req.params.name;
      let client = await mongoClient.connect(URL);
      let db = client.db("student-mentor");
      let student = await db
        .collection("mentor")
        .find({ _id: mongodb.ObjectId(req.params.student) })
        .toArray();
      student.forEach(async (obj) => {
        let client = await mongoClient.connect(URL);
        let db = client.db("student-mentor");
  
        let student_data = await db
          .collection("student")
          .find({ name: obj })
          .toArray();
        if (!student_data[0].mentor) {
          await db
            .collection("student")
            .findOneAndUpdate({ name: obj }, { $set: { mentor: name } });
          await db
            .collection("mentor")
            .findOneAndUpdate(
              { name },
              { $addToSet: { student: { $each: [obj] } } }
            );
        }
      });
      res.status(200).json({
        message: "Mentor created",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  });

  app.put("/update-student-mentor/:studentName", async (req, res) => {
    try {
      let name = req.params.studentName;
      let client = await mongoClient.connect(URL);
      let db = client.db("student-mentor");
      let student_data = await db.collection("student").find().toArray();
      let mentor_data = student_data[0].mentor;
      await db
        .collection("student")
        .findOneAndUpdate({ name }, { $set: { mentor: req.body.mentor } });
      await db
        .collection("mentor")
        .findOneAndUpdate(
          { name: req.body.mentor },
          { $addToSet: { student: { $each: [name] } } }
        );
      await db
        .collection("mentor")
        .findOneAndUpdate({ name: mentor_data }, { $pull: { student: name } });
      res.status(200).json({
        message: "Mentor Updated",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  });

  app.get("/studentlist/:mentor", async (req, res) => {
    let client = await mongoClient.connect(URL);
    let db = client.db("student-mentor");
    let mentor = await db
      .collection("mentor")
      .find({ _id: mongodb.ObjectId(req.params.mentor) })
      .toArray();
    if (mentor) {
      res.status(200).json({
        message: "Student Details of Mentor",
        data: mentor[0].student,
      });
    } else {
      res.status(404).json({
        message: "No mentor data found",
      });
    }
  });

  app.listen(process.env.PORT || 5000, () => {
    console.log("Sever Started Successfully!!!");
  });