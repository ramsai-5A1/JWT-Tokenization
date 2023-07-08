const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();

//app.use(express.json());
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let ADMINS = [];
let USERS = [];
let COURSES = [];
let userPurchases = [];
let courseId = 1;
const secretKey = 'my-secret-key';
const expiresIn = '1h';

function isNewAdmin(obj) {
  for(let index = 0; index < ADMINS.length; index++) {
    if(ADMINS[index].username === obj.username) return false;
  }
  return true;
}

function isNewUser(obj) {
  for(let index = 0; index < USERS.length; index++) {
    if(USERS[index].username === obj.username) return false;
  }
  return true;
}

function isNewCourse(course) {
  let mainToken = JSON.stringify(course);
  for(let index = 0; index < COURSES.length; index++) {
    let currentToken = JSON.stringify(COURSES[index]);
    if(mainToken === currentToken) {
      return false;
    }
  }
  return true;
}

// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const obj = req.body;
  if(!isNewAdmin(obj)) {
    res.status(201).send('Already admin is having an account');
    return;
  }
  ADMINS.push(obj);
  console.log(`Admins list is ${JSON.stringify(ADMINS)}`);
  const token = jwt.sign(obj, secretKey, {expiresIn: expiresIn});
  res.status(200).json({
    message: 'Admin created successfully',
    token: token
  });
});


const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if(authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, secretKey, { algorithm: 'HS256' }, (err, user) => {
      if(err) {
        res.status(404).json({
          message: 'Error while validating token',
          error: err
        });
        return;
      }
      req.user = user;
      next();
    });
  } else {
    res.status(404).json({
      message: 'token is empty'
    });
    return;
  }
};

app.get('/admin/token', validateToken, (req, res) => {
  const user = req.user;
  console.log(`user is = ${JSON.stringify(user)}`);
  res.status(200).json({
    message: 'validation successfull',
    user: user
  });
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  const obj = {
    username: req.headers['username'],
    password: req.headers['password']
  }
  if(isNewAdmin(obj)) {
    res.status(404).send('Please signup before you login');
    return;
  }

  for(let index = 0; index < ADMINS.length; index++) {
    if(ADMINS[index].username === obj.username) {
      if(ADMINS[index].password === obj.password) {
        const token = jwt.sign(obj, secretKey, {expiresIn: expiresIn});
        res.status(200).json({
          message: 'Logged in successfully',
          token: token
        });
        return;
      } else {
        res.status(200).send('Incorrect password');
        return;
      }
    }
  }
});

app.post('/admin/courses', validateToken, (req, res) => {
  // logic to create a course
  console.log("EXECUTION STARTED");
   const obj = {
      username: req.user.username,
      password: req.user.password
   };
   console.log(`OBJECT extracted is ${JSON.stringify(obj)}`);
   if(isNewAdmin(obj)) {
      res.status(404).send('Please sign-up as an Admin first');
      return;
   }

   const course = req.body;
   if(isNewCourse(course)) {
    course['Id'] = courseId;
    COURSES.push(course);
    res.status(200).json({
      message: 'Course created successfully',
      courseId: courseId
    });
    courseId++;
    return;
   }

   res.status(201).json({
    message: 'Course already exists'
   });
});

app.put('/admin/courses/:courseId', validateToken, (req, res) => {
  // logic to edit a course
  const obj1 = {
    username: req.user.username,
    password: req.user.password
  };
 console.log(`OBJECT extracted is ${JSON.stringify(obj1)}`);
 if(isNewAdmin(obj1)) {
    res.status(404).send('Please sign-up as an Admin first');
    return;
 }

  let id = req.params.courseId;
  let obj = req.body;
  obj['Id'] = id;
  for(let index = 0; index < COURSES.length; index++) {
    if(COURSES[index].Id == id) {
      COURSES[index] = obj;
      res.status(200).json({
        message: 'Course updated successfully'
      });
      return;
    }
  }
  res.status(404).json({
    message: 'Course not found with given courseId'
  });
});

app.get('/admin/courses', validateToken, (req, res) => {
  // logic to get all courses
  const obj = {
    username: req.user.username,
    password: req.user.password
 };
 console.log(`OBJECT extracted is ${JSON.stringify(obj)}`);

  if(isNewAdmin(obj)) {
    res.status(404).send('Please sign-up as an Admin first');
    return;
  }

  res.status(200).json({
    courses: COURSES
  });

});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const obj = req.body;
  if(!isNewUser(obj)) {
    res.status(201).send('Already user is having an account');
    return;
  }
  USERS.push(obj);
  const token = jwt.sign(obj, secretKey, {expiresIn: expiresIn});
  console.log(`Users list is ${JSON.stringify(USERS)}`);
  res.status(200).json({
    message: 'User created successfully',
    token: token
  });
});

app.post('/users/login', (req, res) => {
  // logic to log in user 
  const obj = {
    username: req.headers['username'],
    password: req.headers['password']
  }
  if(isNewUser(obj)) {
    res.status(404).send('Please signup before you login');
    return;
  }

  for(let index = 0; index < USERS.length; index++) {
    if(USERS[index].username === obj.username) {
      if(USERS[index].password === obj.password) {
        const token = jwt.sign(obj, secretKey, {expiresIn: expiresIn});
        res.status(200).json({
          message: 'Logged in successfully',
          token: token
        });
        return;
      } else {
        res.status(200).send('Incorrect password');
        return;
      }
    }
  }
});

app.get('/users/courses', validateToken, (req, res) => {
  // logic to list all courses
  const obj = {
    username: req.user.username,
    password: req.user.password
  };
  console.log(`OBJECT extracted is ${JSON.stringify(obj)}`);

  if(isNewUser(obj)) {
    res.status(404).send('Please sign-up as an User first');
    return;
  }

  res.status(200).json({
    courses: COURSES
  });
});

app.post('/users/courses/:courseId', validateToken, (req, res) => {
  // logic to purchase a course
  const username = req.user.username;
  const obj = {
    username: req.user.username,
    password: req.user.password
  };
  console.log(`OBJECT extracted is ${JSON.stringify(obj)}`);

  if(isNewUser(obj)) {
    res.status(404).send('Please sign-up as an User first');
    return;
  }

  let id = req.params.courseId;
  if(username in userPurchases) {
    for(let index = 0; index < userPurchases[username].length; index++) {
      if(userPurchases[username][index].Id == id) {
        res.status(201).json({
          message: "You've already purchased this course"
        });
        return;
      }
    }
  } else {
    userPurchases[username] = [];
  }

  for(let index = 0; index < COURSES.length; index++) {
    if(COURSES[index].Id == id) {
      userPurchases[username].push(COURSES[index]);
      res.status(200).json({
        message: 'Course purchased successfully'
      });
      return;
    }
  }

  res.status(404).json({
    message: 'Course not found with given courseId'
  });
});

app.get('/users/purchasedCourses', validateToken, (req, res) => {
  // logic to view purchased courses
  const username = req.user.username;
  const obj = {
    username: req.user.username,
    password: req.user.password
  };
  console.log(`OBJECT extracted is ${JSON.stringify(obj)}`);

  if(isNewUser(obj)) {
    res.status(404).send('Please sign-up as an User first');
    return;
  }

  let id = req.params.courseId;
  if(username in userPurchases) {
    res.status(200).json({
      message: userPurchases[username]
    });
  }
  res.status(201).json({
    message: "You haven't purchased any courses yet"
  });
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
