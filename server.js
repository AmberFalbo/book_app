'use strict';

const express = require('express');
const app = express();

require('dotenv').config();
require('ejs');
// const superagent = require('superagent');

// setting the view engine
app.set('view engine', 'ejs');

// global variables
const PORT = process.env.PORT || 3001;

// middleware
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));

// app.get('/hello', renderTest);
app.get('/searches/new', renderSearchPage);

// functions
function renderSearchPage(request, response){
  response.render('pages/searches/new.ejs')
}

// function renderTest(request, response){
//   response.render('pages/index');
// }

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
