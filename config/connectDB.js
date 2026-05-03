
const mysql = require("mysql2");

const connectDB = async() => {
 const con = mysql.createConnection({
  host:"localhost",
  user: "root",
  password: "omorsultan+",
  database: "Task_Management"
 });
 console.log("Database connected successfully");
}

module.exports = connectDB;

// con.connect(function(error){
//  if(error) throw error;
//  console.log("connect");
//  con.query("select * from employees",function(error,result){
//    if(error) throw error;
//    console.log(result);
//  });
// })