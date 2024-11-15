import express from "express";
import bodyParser from "body-parser";
import mysql2 from "mysql2";

const app=express();
const port=8080;

var con = mysql2.createConnection({
    host: "",  //enter local host
    user: "",
    password: "", //enter the password
    database: ""
  });
  
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });

const users=[];
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

//ROUTES

app.get("/",(req,res)=>{
    res.render("login.ejs");
})

app.get("/register",(req,res)=>{
    res.render("register.ejs");
})
app.post("/register", async(req,res)=>{
    try{
        users.push({
            id: Date.now().toString(),
            name:req.body.name,
            email: req.body.email,
            password: req.body.password
        });
        const temp=JSON.stringify(users);
        console.log("users=" + temp);
        res.render("login.ejs");


        const insertUsers = (temp) => {
            const query = 'INSERT INTO users (user_id, username, email, password) VALUES ?';
            const values = users.map(temp => [Number(temp.id), temp.name, temp.email, temp.password]);
          
            con.query(query, [values], (err, result) => {
              if (err) {
                console.error('Error inserting data:', err);
                return;
              }
              console.log('Data inserted successfully:', result.affectedRows, 'rows inserted.');
            });
          };
          
          // Insert users into the database
          insertUsers(users);

    }
    catch(e){
        console.log(e);
        res.redirect("register.ejs");
    }
})

app.post("/login", async(req,res)=>{
    try{
        const email=req.body.email;
        const password=req.body.password;
        const loginUser = (email, password) => {
            // Query to find the user by email
            const query = 'SELECT * FROM users WHERE email = ?';

            con.query(query, [email], (err, results) => {
                if (err) {
                    console.error('Error querying the database:', err);
                    return;
                }
        
                // Check if user exists and password matches
                if (results.length > 0) {
                    console.log(results);
                    const user = results[0];
                    if (user.password === password) {
                        console.log('Login successful');
                        console.log(user.user_id);
                        con.query('SELECT * FROM Task where user_id = ?', [user.user_id], (err, tasks) => {
                            if (err) {
                                console.error('Error fetching tasks:', err);
                                return res.status(500).send('Server error');
                            }
                            const user_id={"user_id":user.user_id};
                            res.render('index.ejs', {user_id,tasks});
                        });
                        // Handle successful login here
                    } else {
                        console.log('Invalid credentials');
                        // Handle login failure here
                    }
                } else {
                    console.log('User not found');
                    // Handle user not found here
                }
            });
        };
        
        loginUser(email,password);
        
    }
    catch(e){
        console.log(e);
        res.redirect("login.ejs");
    }
})

app.post("/list", async(req,res)=>{
    try{
        
    const {user_id, title, description } = req.body;
    const status_id = 0;

    const query = 'INSERT INTO Task (user_id, title, description, status_id) VALUES (?, ?, ?, ?)';
    con.query(query, [user_id, title, description, status_id], (err, result) => {
        if (err) {
            console.error('Error inserting task:', err);
            return res.status(500).send('Server error');
        }
        res.render("index.ejs"); // Redirect back to the main page to show updated task list
    });
    }
    catch(e){

    }
})

app.post('/updateStatus/:id', (req, res) => {
    const taskId = req.params.id;
    const status = req.body.status ? 1 : 0;
    const query = 'UPDATE Task SET status_id = ? WHERE task_id = ?';
    con.query(query, [status, taskId], (err, result) => {
        if (err) {
            console.error('Error updating task status:', err);
            return res.status(500).send('Server error');
        }
        res.redirect('/');
    });
});

// Route to delete a task
app.post('/deleteTask/:id', (req, res) => {
    const taskId = req.params.id;
    const query = 'DELETE FROM Task WHERE task_id = ?';
    con.query(query, [taskId], (err, result) => {
        if (err) {
            console.error('Error deleting task:', err);
            return res.status(500).send('Server error');
        }
        res.redirect('/');
    });
});
app.listen(port, ()=>{
    console.log(`Listening on port ${port}`);
});