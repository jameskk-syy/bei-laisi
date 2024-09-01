const {initializeApp} =  require('firebase/app');

const firebaseConfig = {
    apiKey: "AIzaSyDAUsjQXVKyB-Qz0KZ9AerID_5-tYxR3pY",
    authDomain: "newbidleo-c4da9.firebaseapp.com",
    projectId: "newbidleo-c4da9",
    storageBucket: "newbidleo-c4da9.appspot.com",
    messagingSenderId: "525313961759",
    appId: "1:525313961759:web:815da94b964b4ab3dfca2a"
  };

const  app = initializeApp(firebaseConfig);
module.exports = app;